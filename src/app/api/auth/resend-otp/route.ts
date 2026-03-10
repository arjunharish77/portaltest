import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ResendOtpSchema } from '@/lib/validations/auth'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { generateOtp, getOtpExpiry, canResendOtp, isOtpExpired } from '@/lib/otp'
import { sendSmsOtp } from '@/lib/sms/smartping'
import { sendEmailOtp } from '@/lib/email/otp'
import { maskPhone, maskEmail } from '@/lib/utils/masking'
import { isDev } from '@/lib/env'
import type { OtpRequest } from '@/types/db'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = ResendOtpSchema.safeParse(body)
        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
        }

        const { otp_request_id } = parsed.data

        const { data: otpReq, error } = await supabaseAdmin
            .from('otp_requests')
            .select('*')
            .eq('id', otp_request_id)
            .single()

        if (error || !otpReq) return errorResponse('OTP request not found', 404)

        const typedOtp = otpReq as OtpRequest

        if (typedOtp.status === 'verified') {
            return errorResponse('OTP already verified', 400)
        }

        if (!canResendOtp(typedOtp.created_at)) {
            return errorResponse('Please wait 30 seconds before resending OTP.', 429, { code: 'RESEND_COOLDOWN' })
        }

        // Expire the old OTP request
        await supabaseAdmin
            .from('otp_requests')
            .update({ status: 'expired' })
            .eq('id', otp_request_id)

        const otp = generateOtp()
        const expiresAt = getOtpExpiry()

        const { data: newOtpReq, error: insertError } = await supabaseAdmin
            .from('otp_requests')
            .insert({
                user_id: typedOtp.user_id,
                otp_type: typedOtp.otp_type || typedOtp.channel,
                channel: typedOtp.channel,
                target_value: typedOtp.target_value,
                purpose: typedOtp.purpose,
                otp_code: otp,
                status: 'pending',
                expires_at: expiresAt,
                attempt_count: 0,
            })
            .select('id')
            .single()

        if (insertError || !newOtpReq) return errorResponse('Failed to resend OTP', 500)

        if (typedOtp.channel === 'sms' && typedOtp.target_value) {
            await sendSmsOtp(typedOtp.target_value, otp, typedOtp.purpose)
        } else if (typedOtp.channel === 'email' && typedOtp.target_value) {
            await sendEmailOtp(typedOtp.target_value, otp, typedOtp.purpose)
        }

        const responsePayload: Record<string, unknown> = {
            otp_request_id: newOtpReq.id,
            channel: typedOtp.channel,
            masked_target:
                typedOtp.channel === 'sms' && typedOtp.target_value
                    ? maskPhone(typedOtp.target_value)
                    : typedOtp.target_value
                        ? maskEmail(typedOtp.target_value)
                        : '',
        }

        if (isDev()) {
            responsePayload.dev_otp = otp
        }

        return successResponse(responsePayload)
    } catch (err) {
        console.error('[resend-otp]', err)
        return errorResponse('Server error', 500)
    }
}
