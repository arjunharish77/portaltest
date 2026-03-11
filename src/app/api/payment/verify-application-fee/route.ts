import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import type { Application } from '@/types/db'
import { z } from 'zod'

const VerifyPaymentSchema = z.object({
    payment_id: z.string().uuid()
})

export async function POST(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)

        const body = await req.json()
        const parsed = VerifyPaymentSchema.safeParse(body)

        if (!parsed.success) {
            return errorResponse('Invalid payment ID', 400)
        }

        const { payment_id } = parsed.data

        // Get application
        const { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .select('id, application_fee_status, current_step')
            .eq('user_id', user.id)
            .single()

        if (appError || !app) {
            return errorResponse('Application not found', 404)
        }

        const typedApp = app as Application

        if (typedApp.application_fee_status === 'success') {
            return successResponse({ message: 'Already paid' })
        }

        const now = new Date().toISOString()

        // 1. Simulate Gateway Verification Logic here
        // For now, assume it always succeeds.

        // 2. Update Payment Row
        const { error: paymentUpdateError } = await supabaseAdmin
            .from('application_fee_payments')
            .update({
                payment_status: 'success',
                paid_at: now,
                transaction_reference: `SIM_${Date.now()}`
            })
            .eq('id', payment_id)
            .eq('user_id', user.id)

        if (paymentUpdateError) {
            console.error('[Supabase DB Error] payment verify update:', paymentUpdateError)
            return errorResponse('Failed to verify payment', 500)
        }

        // 3. Update Application Row
        const { error: appUpdateError } = await supabaseAdmin
            .from('applications')
            .update({
                application_fee_status: 'success',
                payment_completed_at: now,
                application_status: 'in_progress', // Set to in_progress now that fee is paid
                updated_at: now
            })
            .eq('id', typedApp.id)

        if (appUpdateError) {
            console.error('[Supabase DB Error] app fee status verify update:', appUpdateError)
        }

        return successResponse({ message: 'Payment verified successfully' })

    } catch (err) {
        return errorResponse('Unauthorized', 401)
    }
}
