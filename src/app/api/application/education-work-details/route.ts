import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { EducationWorkSchema } from '@/lib/validations/application'
import { trackTime, logDbDebug, logPayloadSize, logVercelSimulation } from '@/lib/utils/verification'

export async function GET(req: NextRequest) {
    const startTime = trackTime()
    try {
        const { user } = await getAuthUser(req)

        let queries = 0
        const dbStart = trackTime()

        queries++
        const { data: app } = await supabaseAdmin
            .from('applications')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (!app) return successResponse({ details: null })

        queries++
        const { data: details } = await supabaseAdmin
            .from('application_education_work_details')
            .select('highest_qualification, institution_name, specialization, graduation_year, percentage_or_cgpa, is_work_experience, work_experience_years, current_company, current_designation')
            .eq('application_id', app.id)
            .single()

        const dbDuration = trackTime() - dbStart
        logDbDebug('GET /api/application/education-work-details', queries, dbDuration, 'highest_qual, institution, ...')

        const payload = {
            details: details ?? null,
        }

        const totalDuration = trackTime() - startTime
        logPayloadSize('GET /api/application/education-work-details', Buffer.byteLength(JSON.stringify(payload), 'utf8'), totalDuration, 5)
        logVercelSimulation('GET /api/application/education-work-details', 1)

        return successResponse(payload)
    } catch {
        return errorResponse('Unauthorized', 401)
    }
}

export async function POST(req: NextRequest) {
    const startTime = trackTime()
    try {
        const { user } = await getAuthUser(req)

        const body = await req.json()
        const parsed = EducationWorkSchema.safeParse(body)
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]
            return errorResponse(firstError?.message ?? 'Validation failed', 400, {
                validation_errors: parsed.error.flatten().fieldErrors,
            })
        }

        let queries = 0
        const dbStart = trackTime()

        queries++
        const { data: app, error: appErr } = await supabaseAdmin
            .from('applications')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (appErr || !app) {
            console.error('[education-work POST] app not found:', appErr)
            return errorResponse('Application not found', 404)
        }

        const now = new Date().toISOString()

        // Payload maps 1:1 to actual table columns
        const payload = {
            application_id: app.id,
            highest_qualification: parsed.data.highest_qualification,
            institution_name: parsed.data.institution_name,
            specialization: parsed.data.specialization,
            graduation_year: parsed.data.graduation_year,
            percentage_or_cgpa: parsed.data.percentage_or_cgpa,
            is_work_experience: parsed.data.is_work_experience,
            work_experience_years: parsed.data.work_experience_years ?? null,
            current_company: parsed.data.current_company ?? null,
            current_designation: parsed.data.current_designation ?? null,
            updated_at: now,
        }

        console.log('[education-work POST] application_id:', app.id, 'payload:', payload)

        // Check if a row exists already (unique index on application_id)
        queries++
        const { data: existing } = await supabaseAdmin
            .from('application_education_work_details')
            .select('id')
            .eq('application_id', app.id)
            .single()

        queries++
        if (existing?.id) {
            const { error: updateErr } = await supabaseAdmin
                .from('application_education_work_details')
                .update(payload)
                .eq('id', existing.id)
            if (updateErr) {
                console.error('[education-work POST] UPDATE error:', updateErr.message, updateErr.details, updateErr.hint)
                return errorResponse('Database error saving education details', 500)
            }
        } else {
            const { error: insertErr } = await supabaseAdmin
                .from('application_education_work_details')
                .insert(payload)
            if (insertErr) {
                console.error('[education-work POST] INSERT error:', insertErr.message, insertErr.details, insertErr.hint)
                return errorResponse('Database error saving education details', 500)
            }
        }

        // Update applications step
        queries++
        const { error: stepErr } = await supabaseAdmin
            .from('applications')
            .update({
                education_details_status: 'completed',
                application_status: 'document_pending',
                current_step: 'document_upload',
                last_edited_at: now,
                updated_at: now,
            })
            .eq('id', app.id)

        if (stepErr) {
            console.error('[education-work POST] step update error:', stepErr.message)
        }

        const dbDuration = trackTime() - dbStart
        logDbDebug('POST /api/application/education-work-details', queries, dbDuration, 'upsert full row')

        const responsePayload = {
            message: 'Education & work details saved successfully',
            redirect_to: '/application/document-upload',
            updated_flags: {
                education_details_status: 'completed',
                application_status: 'document_pending',
                current_step: 'document_upload'
            }
        }

        const totalDuration = trackTime() - startTime
        logPayloadSize('POST /api/application/education-work-details', Buffer.byteLength(JSON.stringify(responsePayload), 'utf8'), totalDuration, 5)
        logVercelSimulation('POST /api/application/education-work-details', 1)

        return successResponse(responsePayload)
    } catch (err) {
        console.error('[education-work POST] unhandled error:', err)
        return errorResponse('Server Error', 500)
    }
}
