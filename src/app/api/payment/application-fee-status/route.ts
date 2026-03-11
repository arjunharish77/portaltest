import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'

export async function GET(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)

        const { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .select('application_fee_amount, application_fee_status, payment_completed_at')
            .eq('user_id', user.id)
            .single()

        if (appError || !app) {
            return errorResponse('Application not found', 404)
        }

        return successResponse({
            application_fee_amount: app.application_fee_amount,
            application_fee_status: app.application_fee_status,
            payment_completed_at: app.payment_completed_at
        })

    } catch (err) {
        return errorResponse('Unauthorized', 401)
    }
}
