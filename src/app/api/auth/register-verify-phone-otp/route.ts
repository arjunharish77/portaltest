import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { VerifyOtpSchema } from '@/lib/validations/auth'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { isOtpExpired, OTP_MAX_ATTEMPTS } from '@/lib/otp'
import { generateSessionToken, getSessionExpiry } from '@/lib/session'
import { setSessionCookie } from '@/lib/utils/cookies'
import { generateApplicationNumber } from '@/lib/utils/id'

interface SignupPayload {
    full_name: string
    phone_country_code: string
    phone: string
    email: string
    course_name: string
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = VerifyOtpSchema.safeParse(body)
        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
        }

        const { otp_request_id, otp_code } = parsed.data

        // Fetch the OTP request (includes payload from register-start)
        const { data: otpReq, error } = await supabaseAdmin
            .from('otp_requests')
            .select('*')
            .eq('id', otp_request_id)
            .eq('purpose', 'register')
            .single()

        if (error || !otpReq) {
            return errorResponse('Invalid OTP request', 400)
        }

        if (otpReq.status === 'verified') {
            return errorResponse('OTP already used', 400)
        }

        if (otpReq.status === 'expired' || isOtpExpired(otpReq.expires_at)) {
            await supabaseAdmin
                .from('otp_requests')
                .update({ status: 'expired' })
                .eq('id', otp_request_id)
            return errorResponse('OTP has expired. Please request a new one.', 400, { code: 'OTP_EXPIRED' })
        }

        if (otpReq.attempt_count >= OTP_MAX_ATTEMPTS) {
            return errorResponse(
                'Maximum OTP attempts exceeded. Please start registration again.',
                429,
                { code: 'MAX_ATTEMPTS' }
            )
        }

        if (otpReq.otp_code !== otp_code) {
            await supabaseAdmin
                .from('otp_requests')
                .update({ attempt_count: otpReq.attempt_count + 1 })
                .eq('id', otp_request_id)
            return errorResponse('Incorrect OTP', 400, { code: 'WRONG_OTP' })
        }

        // OTP is correct — extract signup payload from otp_requests.payload
        const signupData = otpReq.payload as SignupPayload | null
        if (!signupData?.phone || !signupData?.email) {
            return errorResponse('Registration data missing. Please start registration again.', 400)
        }

        // Race guard: re-check if phone/email was registered concurrently
        const { data: existingUser } = await supabaseAdmin
            .from('portal_users')
            .select('id')
            .or(`phone.eq.${signupData.phone},email.eq.${signupData.email}`)
            .limit(1)

        if (existingUser && existingUser.length > 0) {
            return errorResponse(
                'An account already exists with this phone or email. Please login.',
                409,
                { code: 'USER_EXISTS' }
            )
        }

        // Mark OTP as verified first (prevents double-submission)
        await supabaseAdmin
            .from('otp_requests')
            .update({ status: 'verified', verified_at: new Date().toISOString() })
            .eq('id', otp_request_id)

        // Create portal_users row now (after OTP verified)
        const { data: user, error: userError } = await supabaseAdmin
            .from('portal_users')
            .insert({
                full_name: signupData.full_name,
                phone: signupData.phone,
                phone_country_code: signupData.phone_country_code ?? '+91',
                email: signupData.email,
                course_name: signupData.course_name,
                is_phone_verified: true,
                is_email_verified: false,
                registration_status: 'active',
            })
            .select('id')
            .single()

        if (userError || !user) {
            console.error('[register-verify-phone-otp] insert portal_users:', JSON.stringify(userError))
            return errorResponse('Failed to complete registration', 500)
        }

        // Create application row
        await supabaseAdmin.from('applications').insert({
            user_id: user.id,
            application_number: generateApplicationNumber(signupData.course_name),
            applied_course: signupData.course_name,
            application_status: 'draft',
            current_step: 'basic_details',
            updated_at: new Date().toISOString(),
        })

        // Create session
        const sessionToken = generateSessionToken()
        const sessionExpiry = getSessionExpiry()

        await supabaseAdmin.from('portal_sessions').insert({
            user_id: user.id,
            session_token: sessionToken,
            status: 'active',
            expires_at: sessionExpiry,
        })

        const response = successResponse({
            message: 'Registration complete',
            redirect_to: '/dashboard',
        })
        return setSessionCookie(response as NextResponse, sessionToken)
    } catch (err) {
        console.error('[register-verify-phone-otp]', err)
        return errorResponse('Server error', 500)
    }
}
