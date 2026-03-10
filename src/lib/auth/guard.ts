import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSessionToken } from '@/lib/utils/cookies'
import { isSessionExpired } from '@/lib/session'
import type { AuthUser } from '@/types/auth'
import type { PortalSession, PortalUser } from '@/types/db'

export interface GuardResult {
    user: AuthUser
    sessionId: string
}

/**
 * Reads the portal_session cookie, validates it against portal_sessions table,
 * and returns the current user. Throws an error if session is invalid or expired.
 */
export async function getAuthUser(req: NextRequest): Promise<GuardResult> {
    const token = getSessionToken(req)
    if (!token) {
        throw new Error('No session token')
    }

    const { data: session, error } = await supabaseAdmin
        .from('portal_sessions')
        .select('*')
        .eq('session_token', token)
        .eq('status', 'active')
        .single()

    if (error || !session) {
        throw new Error('Invalid session')
    }

    const typedSession = session as PortalSession

    if (isSessionExpired(typedSession.expires_at)) {
        // Revoke the expired session
        await supabaseAdmin
            .from('portal_sessions')
            .update({ status: 'revoked' })
            .eq('id', typedSession.id)
        throw new Error('Session expired')
    }

    const { data: user, error: userError } = await supabaseAdmin
        .from('portal_users')
        .select('id, full_name, phone, phone_country_code, email, course_name, registration_status, is_phone_verified, is_email_verified')
        .eq('id', typedSession.user_id)
        .single()

    if (userError || !user) {
        throw new Error('User not found')
    }

    const typedUser = user as PortalUser

    return {
        user: {
            id: typedUser.id,
            full_name: typedUser.full_name,
            phone: typedUser.phone,
            phone_country_code: typedUser.phone_country_code,
            email: typedUser.email,
            course_name: typedUser.course_name,
            registration_status: typedUser.registration_status,
            is_phone_verified: typedUser.is_phone_verified,
            is_email_verified: typedUser.is_email_verified,
        },
        sessionId: typedSession.id,
    }
}
