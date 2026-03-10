import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SendEmailOtpSchema } from '@/lib/validations/auth'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { generateOtp, getOtpExpiry } from '@/lib/otp'
import { sendEmailOtp } from '@/lib/email/otp'
import { maskEmail } from '@/lib/utils/masking'
import { isDev } from '@/lib/env'
import type { PortalUser } from '@/types/db'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = SendEmailOtpSchema.safeParse(body)
        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
        }

        const { user_id } = parsed.data

        const { data: user, error: userError } = await supabaseAdmin
            .from('portal_users')
            .select('id, email')
            .eq('id', user_id)
            .single()

        if (userError || !user) {
            return errorResponse('User not found', 404)
        }

        const typedUser = user as PortalUser

        const otp = generateOtp()
        const expiresAt = getOtpExpiry()

        const { data: otpReq, error: otpError } = await supabaseAdmin
            .from('otp_requests')
            .insert({
                user_id,
                otp_type: 'email',
                channel: 'email',
                target_value: typedUser.email,
                purpose: 'register',
                otp_code: otp,
                status: 'pending',
                expires_at: expiresAt,
                attempt_count: 0,
            })
            .select('id')
            .single()

        if (otpError || !otpReq) {
            return errorResponse('Failed to create OTP request', 500)
        }

        await sendEmailOtp(typedUser.email, otp, 'register')

        const responsePayload: Record<string, unknown> = {
            otp_request_id: otpReq.id,
            masked_email: maskEmail(typedUser.email),
            channel: 'email',
        }

        if (isDev()) {
            responsePayload.dev_otp = otp
        }

        return successResponse(responsePayload)
    } catch (err) {
        console.error('[send-email-otp]', err)
        return errorResponse('Server error', 500)
    }
}
