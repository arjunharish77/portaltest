import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { VerifyOtpSchema } from '@/lib/validations/auth'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { isOtpExpired, OTP_MAX_ATTEMPTS } from '@/lib/otp'
import { generateSessionToken, getSessionExpiry } from '@/lib/session'
import { setSessionCookie } from '@/lib/utils/cookies'
import type { OtpRequest } from '@/types/db'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = VerifyOtpSchema.safeParse(body)
        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
        }

        const { otp_request_id, otp_code } = parsed.data

        const { data: otpReq, error } = await supabaseAdmin
            .from('otp_requests')
            .select('*')
            .eq('id', otp_request_id)
            .eq('channel', 'email')
            .single()

        if (error || !otpReq) return errorResponse('Invalid OTP request', 400)

        const typedOtp = otpReq as OtpRequest

        if (typedOtp.status === 'verified') return errorResponse('OTP already used', 400)

        if (typedOtp.status === 'expired' || isOtpExpired(typedOtp.expires_at)) {
            await supabaseAdmin.from('otp_requests').update({ status: 'expired' }).eq('id', otp_request_id)
            return errorResponse('OTP expired. Please request a new one.', 400, { code: 'OTP_EXPIRED' })
        }

        if (typedOtp.attempt_count >= OTP_MAX_ATTEMPTS) {
            return errorResponse('Too many attempts. Please request a new OTP.', 429, { code: 'MAX_ATTEMPTS' })
        }

        if (typedOtp.otp_code !== otp_code) {
            await supabaseAdmin
                .from('otp_requests')
                .update({ attempt_count: typedOtp.attempt_count + 1 })
                .eq('id', otp_request_id)
            return errorResponse('Incorrect OTP', 400, { code: 'WRONG_OTP' })
        }

        const userId = typedOtp.user_id

        await supabaseAdmin.from('otp_requests').update({ status: 'verified' }).eq('id', otp_request_id)
        await supabaseAdmin
            .from('portal_users')
            .update({ is_email_verified: true, registration_status: 'active', updated_at: new Date().toISOString() })
            .eq('id', userId)

        // Ensure application row exists
        const { data: existingApp } = await supabaseAdmin
            .from('applications')
            .select('id')
            .eq('user_id', userId)
            .limit(1)

        if (!existingApp || existingApp.length === 0) {
            await supabaseAdmin.from('applications').insert({
                user_id: userId,
                application_status: 'draft',
                current_step: 0,
            })
        }

        const sessionToken = generateSessionToken()
        const sessionExpiry = getSessionExpiry()

        await supabaseAdmin.from('portal_sessions').insert({
            user_id: userId,
            session_token: sessionToken,
            status: 'active',
            expires_at: sessionExpiry,
        })

        const response = successResponse({ message: 'Email verified and registered', redirect_to: '/dashboard' })
        return setSessionCookie(response as NextResponse, sessionToken)
    } catch (err) {
        console.error('[verify-email-otp]', err)
        return errorResponse('Server error', 500)
    }
}
