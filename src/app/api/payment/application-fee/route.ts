import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { trackTime, logDbDebug, logPayloadSize, logVercelSimulation } from '@/lib/utils/verification'

/**
 * POST /api/payment/application-fee
 * Fixed ₹500 mock payment. Inserts into application_payments using correct column names.
 */
export async function POST(req: NextRequest) {
    const startTime = trackTime()
    try {
        const { user } = await getAuthUser(req)
        console.log('[payment/application-fee] user_id:', user.id)

        let queries = 0
        const dbStart = trackTime()

        // Resolve application row
        queries++
        const { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .select('id, application_fee_status')
            .eq('user_id', user.id)
            .single()

        if (appError || !app) {
            console.error('[payment/application-fee] app not found, error:', appError)
            return errorResponse('Application not found', 404)
        }

        console.log('[payment/application-fee] application_id:', app.id)

        if (app.application_fee_status === 'success') {
            return errorResponse('Application fee already paid', 400)
        }

        const FEE = 500
        const now = new Date().toISOString()
        const txRef = `MOCK-APPFEE-${Date.now()}`

        // Payment payload using exact DB column names from application_payments table
        const paymentPayload = {
            application_id: app.id,
            user_id: user.id,
            payment_type: 'application_fee',
            plan_type: 'standard',
            amount: FEE,
            currency: 'INR',
            payment_status: 'success',
            gateway: 'mock',
            gateway_payment_id: txRef,
            initiated_at: now,
            paid_at: now,
        }

        console.log('[payment/application-fee] inserting payload:', paymentPayload)

        queries++
        const { error: payErr } = await supabaseAdmin
            .from('application_payments')
            .insert(paymentPayload)

        if (payErr) {
            console.error('[payment/application-fee] INSERT error:', payErr.message, payErr.details, payErr.hint)
            return errorResponse('Failed to record payment', 500)
        }

        // Update applications table
        queries++
        const { error: updateErr } = await supabaseAdmin
            .from('applications')
            .update({
                application_fee_status: 'success',
                application_fee_amount: FEE,
                payment_completed_at: now,
                application_status: 'split_journey',
                current_step: 'dashboard_split',
                last_edited_at: now,
                updated_at: now,
            })
            .eq('id', app.id)

        if (updateErr) {
            console.error('[payment/application-fee] UPDATE applications error:', updateErr.message, updateErr.details)
            return errorResponse('Failed to update application status', 500)
        }

        console.log('[payment/application-fee] success for application_id:', app.id)

        const dbDuration = trackTime() - dbStart
        logDbDebug('POST /api/payment/application-fee', queries, dbDuration, 'insert pay, update app')

        const responsePayload = {
            message: 'Application fee paid successfully',
            amount: FEE,
            transaction_reference: txRef,
            redirect_to: '/dashboard',
            updated_flags: {
                application_fee_status: 'success',
                application_fee_amount: FEE,
                application_status: 'split_journey',
                current_step: 'dashboard_split'
            }
        }

        const totalDuration = trackTime() - startTime
        logPayloadSize('POST /api/payment/application-fee', Buffer.byteLength(JSON.stringify(responsePayload), 'utf8'), totalDuration, 5)
        logVercelSimulation('POST /api/payment/application-fee', 1)

        return successResponse(responsePayload)
    } catch (err) {
        console.error('[payment/application-fee] unhandled error:', err)
        return errorResponse('Unauthorized', 401)
    }
}
