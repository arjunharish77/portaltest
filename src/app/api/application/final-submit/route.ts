import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import type { Application } from '@/types/db'

/**
 * POST /api/application/final-submit
 * Validates readiness (admission_fee_status=success AND document_upload_status=completed).
 * Sets application_status=submitted, creates 3 approval rows.
 */
export async function POST(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)

        const { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .select('id, admission_fee_status, document_upload_status, application_status, current_step')
            .eq('user_id', user.id)
            .single()

        if (appError || !app) {
            return errorResponse('Application not found', 404)
        }

        const typedApp = app as Application

        if (typedApp.application_status === 'submitted') {
            return errorResponse('Application already submitted', 400)
        }

        if (typedApp.admission_fee_status !== 'success') {
            return errorResponse('Admission fee must be paid before submitting', 400)
        }

        if (typedApp.document_upload_status !== 'completed') {
            return errorResponse('Documents must be uploaded before submitting', 400)
        }

        const now = new Date().toISOString()

        // Update application to submitted
        const { error: updateError } = await supabaseAdmin
            .from('applications')
            .update({
                application_status: 'submitted',
                current_step: 'submitted',
                submitted_at: now,
                last_edited_at: now,
                updated_at: now,
            })
            .eq('id', typedApp.id)

        if (updateError) {
            console.error('[final-submit] update error:', updateError)
            return errorResponse('Failed to submit application', 500)
        }

        // Create 3 approval rows
        const approvalRows = [
            { application_id: typedApp.id, level: 'University Level 1', status: 'Pending', remarks: 'NA', created_at: now },
            { application_id: typedApp.id, level: 'University Level 2', status: 'Pending', remarks: 'NA', created_at: now },
            { application_id: typedApp.id, level: 'University Level 3', status: 'Pending', remarks: 'NA', created_at: now },
        ]

        const { error: approvalError } = await supabaseAdmin
            .from('application_approval_status')
            .insert(approvalRows)

        if (approvalError) {
            console.error('[final-submit] approval rows error:', approvalError)
            // Don't fail — application is already submitted, log and continue
        }

        return successResponse({ message: 'Application submitted successfully' })

    } catch {
        return errorResponse('Unauthorized', 401)
    }
}
