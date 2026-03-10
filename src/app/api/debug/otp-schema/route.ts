import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/utils/api-response'

// Dev-only: confirm target_value column usage and get full row shape on success
export async function GET(req: NextRequest) {
    if (process.env.APP_ENV !== 'development') {
        return errorResponse('Not available in production', 403)
    }

    const results: Record<string, unknown> = {}

    // Try complete insert with target_value
    const r1 = await supabaseAdmin.from('otp_requests').insert({
        user_id: null,
        otp_code: '123456',
        otp_type: 'sms',
        channel: 'sms',
        purpose: 'register',
        status: 'pending',
        expires_at: new Date(Date.now() + 300000).toISOString(),
        attempt_count: 0,
        target_value: '+917012648304',
        payload: { test: true },
    }).select('*').single()

    results.full_insert_with_target = {
        success: !r1.error,
        error: r1.error ? { message: r1.error.message, code: r1.error.code, details: r1.error.details } : null,
        row: r1.data,
    }
    if (r1.data?.id) {
        await supabaseAdmin.from('otp_requests').delete().eq('id', r1.data.id)
        results.cleanup = 'deleted test row'
    }

    return successResponse(results)
}
