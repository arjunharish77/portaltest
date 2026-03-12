import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { AdmissionFeeSchema } from '@/lib/validations/application'
import { ADMISSION_FEE_PLANS } from '@/types/application'
import { trackTime, logDbDebug, logPayloadSize, logVercelSimulation } from '@/lib/utils/verification'
import type { Application } from '@/types/db'

export async function POST(req: NextRequest) {
    const startTime = trackTime()
    try {
        const { user } = await getAuthUser(req)

        const body = await req.json()
        const parsed = AdmissionFeeSchema.safeParse(body)
        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
        }

        const { plan } = parsed.data
        const { amount } = ADMISSION_FEE_PLANS[plan]

        let queries = 0
        const dbStart = trackTime()

        queries++
        const { data: app, error: appErr } = await supabaseAdmin
            .from('applications')
            .select('id, admission_fee_status')
            .eq('user_id', user.id)
            .single()

        if (appErr || !app) return errorResponse('Application not found', 404)

        const typedApp = app as Application
        if (typedApp.admission_fee_status === 'success') {
            return errorResponse('Admission fee already paid', 400)
        }

        const now = new Date().toISOString()
        const txRef = `MOCK-ADMFEE-${Date.now()}`

        const paymentPayload = {
            application_id: typedApp.id,
            user_id: user.id,
            payment_type: 'admission_fee',
            plan_type: plan,
            amount,
            currency: 'INR',
            payment_status: 'success',
            gateway: 'mock',
            gateway_payment_id: txRef,
            initiated_at: now,
            paid_at: now,
        }

        console.log('[payment/admission-fee] inserting payload:', paymentPayload)

        queries++
        const { error: payErr } = await supabaseAdmin
            .from('application_payments')
            .insert(paymentPayload)

        if (payErr) {
            console.error('[payment/admission-fee] INSERT error:', payErr.message, payErr.details, payErr.hint)
            return errorResponse('Failed to record payment', 500)
        }

        queries++
        const { error: updateErr } = await supabaseAdmin
            .from('applications')
            .update({
                admission_fee_status: 'success',
                admission_fee_plan: plan,
                admission_fee_amount: amount,
                current_step: 'dashboard_split',
                last_edited_at: now,
                updated_at: now,
            })
            .eq('id', typedApp.id)

        if (updateErr) {
            console.error('[payment/admission-fee] update error:', updateErr)
            return errorResponse('Failed to update application', 500)
        }

        const dbDuration = trackTime() - dbStart
        logDbDebug('POST /api/payment/admission-fee', queries, dbDuration, 'insert pay, update app')

        const responsePayload = {
            message: `Admission fee paid (${ADMISSION_FEE_PLANS[plan].label})`,
            plan,
            amount,
            transaction_reference: txRef,
            redirect_to: '/dashboard',
            updated_flags: {
                admission_fee_status: 'success',
                admission_fee_plan: plan,
                admission_fee_amount: amount,
                application_status: 'split_journey',
                current_step: 'dashboard_split'
            }
        }

        const totalDuration = trackTime() - startTime
        logPayloadSize('POST /api/payment/admission-fee', Buffer.byteLength(JSON.stringify(responsePayload), 'utf8'), totalDuration, 5)
        logVercelSimulation('POST /api/payment/admission-fee', 1)

        return successResponse(responsePayload)
    } catch {
        return errorResponse('Unauthorized', 401)
    }
}
