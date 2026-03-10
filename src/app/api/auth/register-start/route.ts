import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { RegisterStartSchema } from '@/lib/validations/auth'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { normalizePhone } from '@/lib/utils/phone'
import { maskPhone } from '@/lib/utils/masking'
import { generateOtp, getOtpExpiry } from '@/lib/otp'
import { sendSmsOtp } from '@/lib/sms/smartping'
import { isDev } from '@/lib/env'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = RegisterStartSchema.safeParse(body)
        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
        }

        const { full_name, phone, email, course_name, phone_country_code } = parsed.data
        const normalizedPhone = normalizePhone(phone)

        // Check if phone OR email already exists in portal_users
        const { data: existing } = await supabaseAdmin
            .from('portal_users')
            .select('id')
            .or(`phone.eq.${normalizedPhone},email.eq.${email.toLowerCase().trim()}`)
            .limit(1)

        if (existing && existing.length > 0) {
            return errorResponse(
                'An account already exists with this phone or email. Please login.',
                409,
                { code: 'USER_EXISTS' }
            )
        }

        // Generate OTP — do NOT create portal_users row yet
        const otp = generateOtp()
        const expiresAt = getOtpExpiry()

        // Full signup payload saved for retrieval after OTP verification
        const signupPayload = {
            full_name,
            phone_country_code: phone_country_code ?? '+91',
            phone: normalizedPhone,
            email: email.toLowerCase().trim(),
            course_name,
        }

        const { data: otpReq, error: otpError } = await supabaseAdmin
            .from('otp_requests')
            .insert({
                user_id: null,
                otp_type: 'sms',           // actual column name (not 'purpose')
                channel: 'sms',
                target_value: normalizedPhone, // actual column — stores the destination (phone/email)
                otp_code: otp,
                purpose: 'register',
                status: 'pending',
                expires_at: expiresAt,
                attempt_count: 0,
                payload: signupPayload,
            })
            .select('id')
            .single()

        if (otpError || !otpReq) {
            console.error('[register-start] insert otp_requests:', JSON.stringify(otpError))
            const devExtra = process.env.APP_ENV === 'development'
                ? { db_error: otpError?.message, db_details: otpError?.details, db_hint: otpError?.hint }
                : {}
            return errorResponse('Failed to initiate OTP', 500, devExtra)
        }

        // Send SMS OTP
        const smsResult = await sendSmsOtp(normalizedPhone, otp, 'register')
        if (!smsResult.success) {
            console.warn('[register-start] SMS failed:', smsResult.message)
        }

        const responsePayload: Record<string, unknown> = {
            otp_request_id: otpReq.id,
            masked_phone: maskPhone(normalizedPhone),
            channel: 'sms',
        }

        if (isDev()) {
            responsePayload.dev_otp = otp
        }

        return successResponse(responsePayload, 201)
    } catch (err) {
        console.error('[register-start]', err)
        return errorResponse('Server error', 500)
    }
}
