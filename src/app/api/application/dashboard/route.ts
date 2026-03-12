import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { trackTime, logDbDebug, logPayloadSize, logVercelSimulation } from '@/lib/utils/verification'
import type { Application, ApplicationApprovalStatus } from '@/types/db'

/** Helper: create approval rows if both conditions met and rows don't exist yet */
async function maybeCreateApprovals(applicationId: string) {
    const { data: existing } = await supabaseAdmin
        .from('application_approval_status')
        .select('id')
        .eq('application_id', applicationId)
        .limit(1)

    if (existing && existing.length > 0) return // already created

    const now = new Date().toISOString()
    await supabaseAdmin.from('application_approval_status').insert([
        { application_id: applicationId, level: 'University Level 1', status: 'Pending', remarks: 'NA', created_at: now },
        { application_id: applicationId, level: 'University Level 2', status: 'Pending', remarks: 'NA', created_at: now },
        { application_id: applicationId, level: 'University Level 3', status: 'Pending', remarks: 'NA', created_at: now },
    ])
}

export async function GET(req: NextRequest) {
    const startTime = trackTime()
    try {
        const { user } = await getAuthUser(req)

        let queries = 0
        const dbStart = trackTime()

        queries++
        let { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .select(`
                id, application_status, current_step, application_number, applied_course,
                basic_details_status, education_details_status, document_upload_status,
                application_fee_amount, application_fee_status, payment_completed_at,
                admission_fee_status, admission_fee_plan, admission_fee_amount,
                submitted_at, last_edited_at
            `)
            .eq('user_id', user.id)
            .single()

        if (appError || !app) {
            queries++
            const now = new Date().toISOString()
            const { data: newApp, error: createError } = await supabaseAdmin
                .from('applications')
                .insert({
                    user_id: user.id,
                    application_status: 'draft',
                    current_step: 'basic_details',
                    last_edited_at: now,
                })
                .select(`
                    id, application_status, current_step, application_number, applied_course,
                    basic_details_status, education_details_status, document_upload_status,
                    application_fee_amount, application_fee_status, payment_completed_at,
                    admission_fee_status, admission_fee_plan, admission_fee_amount,
                    submitted_at, last_edited_at
                `)
                .single()

            if (createError || !newApp) {
                return errorResponse('Failed to load application data', 500)
            }
            app = newApp
        }

        const typedApp = app as Application

        // Auto-trigger approval creation when both conditions are met
        const approvalEligible =
            typedApp.admission_fee_status === 'success' &&
            typedApp.document_upload_status === 'completed'

        if (approvalEligible) {
            queries += 2 // approx select + insert
            await maybeCreateApprovals(typedApp.id)
        }

        // Fetch approval rows
        let approvals: ApplicationApprovalStatus[] = []
        if (approvalEligible) {
            queries++
            const { data: approvalRows } = await supabaseAdmin
                .from('application_approval_status')
                .select('id, application_id, level, status, remarks, created_at, updated_at')
                .eq('application_id', typedApp.id)
                .order('created_at', { ascending: true })
            approvals = (approvalRows ?? []) as ApplicationApprovalStatus[]
        }

        const dbDuration = trackTime() - dbStart
        logDbDebug('/api/application/dashboard', queries, dbDuration, 'id, application_status, current_step, ...')

        const payload = {
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                course_name: user.course_name,
            },
            application: {
                id: typedApp.id,
                application_number: typedApp.application_number,
                applied_course: typedApp.applied_course,
                application_status: typedApp.application_status,
                current_step: typedApp.current_step,
                last_edited_at: typedApp.last_edited_at,
                basic_details_status: typedApp.basic_details_status,
                education_details_status: typedApp.education_details_status,
                document_upload_status: typedApp.document_upload_status,
                application_fee_status: typedApp.application_fee_status,
                application_fee_amount: typedApp.application_fee_amount,
                payment_completed_at: typedApp.payment_completed_at,
                admission_fee_status: typedApp.admission_fee_status,
                admission_fee_plan: typedApp.admission_fee_plan,
                admission_fee_amount: typedApp.admission_fee_amount,
            },
            approvals,
        }

        const totalDuration = trackTime() - startTime
        const payloadBytes = Buffer.byteLength(JSON.stringify(payload), 'utf8')
        logPayloadSize('/api/application/dashboard', payloadBytes, totalDuration, 5)
        logVercelSimulation('/api/application/dashboard', 1)

        return successResponse(payload)
    } catch {
        return errorResponse('Unauthorized', 401)
    }
}
