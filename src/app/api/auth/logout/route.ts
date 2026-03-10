import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSessionToken, clearSessionCookie } from '@/lib/utils/cookies'
import { errorResponse, successResponse } from '@/lib/utils/api-response'

export async function POST(req: NextRequest) {
    try {
        const token = getSessionToken(req)

        if (token) {
            await supabaseAdmin
                .from('portal_sessions')
                .update({ status: 'revoked' })
                .eq('session_token', token)
        }

        const response = successResponse({ message: 'Logged out successfully' })
        return clearSessionCookie(response as NextResponse)
    } catch (err) {
        console.error('[logout]', err)
        return errorResponse('Server error', 500)
    }
}
