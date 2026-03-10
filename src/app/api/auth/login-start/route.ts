import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { LoginStartSchema } from '@/lib/validations/auth'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { generateOtp, getOtpExpiry } from '@/lib/otp'
import { sendSmsOtp } from '@/lib/sms/smartping'
import { sendEmailOtp } from '@/lib/email/otp'
import { maskPhone, maskEmail } from '@/lib/utils/masking'
import { isDev } from '@/lib/env'
import type { PortalUser } from '@/types/db'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = LoginStartSchema.safeParse(body)
        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
        }

        const { user_id, channel } = parsed.data

        const { data: user, error: userError } = await supabaseAdmin
            .from('portal_users')
            .select('id, phone, email, registration_status')
            .eq('id', user_id)
            .single()

        if (userError || !user) return errorResponse('User not found', 404)

        const typedUser = user as PortalUser

        if (typedUser.registration_status !== 'active') {
            return errorResponse('Account not active', 403)
        }

        const otp = generateOtp()
        const expiresAt = getOtpExpiry()

        const { data: otpReq, error: otpError } = await supabaseAdmin
            .from('otp_requests')
            .insert({
                user_id,
                otp_type: channel,
                channel,
                target_value: channel === 'sms' ? typedUser.phone : typedUser.email,
                purpose: 'login',
                otp_code: otp,
                status: 'pending',
                expires_at: expiresAt,
                attempt_count: 0,
            })
            .select('id')
            .single()

        if (otpError || !otpReq) return errorResponse('Failed to create OTP', 500)

        let deliveryResult
        if (channel === 'sms') {
            deliveryResult = await sendSmsOtp(typedUser.phone, otp, 'login')
        } else {
            deliveryResult = await sendEmailOtp(typedUser.email, otp, 'login')
        }

        if (!deliveryResult.success) {
            console.warn('[login-start] OTP delivery failed:', deliveryResult.message)
        }

        const responsePayload: Record<string, unknown> = {
            otp_request_id: otpReq.id,
            channel,
            masked_target: channel === 'sms' ? maskPhone(typedUser.phone) : maskEmail(typedUser.email),
        }

        if (isDev()) {
            responsePayload.dev_otp = otp
        }

        return successResponse(responsePayload)
    } catch (err) {
        console.error('[login-start]', err)
        return errorResponse('Server error', 500)
    }
}
