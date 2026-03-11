import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import type { Application } from '@/types/db'

export async function POST(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)

        // Get application
        const { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .select('id, application_fee_status')
            .eq('user_id', user.id)
            .single()

        if (appError || !app) {
            return errorResponse('Application not found', 404)
        }

        const typedApp = app as Application

        if (typedApp.application_fee_status === 'success') {
            return errorResponse('Application fee already paid', 400)
        }

        const FEE_AMOUNT = 500

        // Create application_fee_payments row
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('application_fee_payments')
            .insert({
                application_id: typedApp.id,
                user_id: user.id,
                fee_type: 'application_fee',
                amount: FEE_AMOUNT,
                payment_status: 'initiated',
                initiated_at: new Date().toISOString()
            })
            .select('id')
            .single()

        if (paymentError || !payment) {
            console.error('[Supabase DB Error] create payment:', paymentError)
            return errorResponse('Failed to initiate payment', 500)
        }

        // Update applications row
        const { error: updateError } = await supabaseAdmin
            .from('applications')
            .update({
                application_fee_amount: FEE_AMOUNT,
                application_fee_status: 'initiated',
                updated_at: new Date().toISOString()
            })
            .eq('id', typedApp.id)

        if (updateError) {
            console.error('[Supabase DB Error] update app fee status:', updateError)
        }

        return successResponse({
            message: 'Payment initiated successfully',
            payment_id: payment.id,
            amount: FEE_AMOUNT
        })

    } catch (err) {
        return errorResponse('Unauthorized', 401)
    }
}
