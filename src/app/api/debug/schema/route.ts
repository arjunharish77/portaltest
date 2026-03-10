import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/utils/api-response'

// Dev-only: read one row from each table (or empty set) to learn the actual column names
export async function GET(req: NextRequest) {
    if (process.env.APP_ENV !== 'development') {
        return errorResponse('Not available in production', 403)
    }

    const tables = [
        'portal_users',
        'otp_requests',
        'portal_sessions',
        'applications',
        'application_basic_details',
    ]

    const results: Record<string, unknown> = {}

    for (const t of tables) {
        const { data, error } = await supabaseAdmin
            .from(t)
            .select('*')
            .limit(1)

        if (error) {
            results[t] = { error: error.message, code: error.code }
        } else if (data && data.length > 0) {
            results[t] = { columns: Object.keys(data[0]), sample_row: data[0] }
        } else {
            // table exists but empty — try a bad insert to get column hints from error
            results[t] = { columns: 'table_empty_no_rows', raw: data }
        }
    }

    return successResponse(results)
}
