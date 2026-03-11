import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { EducationWorkSchema } from '@/lib/validations/application'

export async function GET(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)

        const { data: app } = await supabaseAdmin
            .from('applications')
            .select('id, application_number, applied_course, education_details_status')
            .eq('user_id', user.id)
            .single()

        if (!app) return successResponse({ details: null, user: null })

        const { data: details } = await supabaseAdmin
            .from('application_education_work_details')
            .select('*')
            .eq('application_id', app.id)
            .single()

        return successResponse({
            details: details ?? null,
            user: {
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                course_name: user.course_name,
                application_number: app.application_number,
                applied_course: app.applied_course,
            }
        })
    } catch {
        return errorResponse('Unauthorized', 401)
    }
}

export async function POST(req: NextRequest) {
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
        const { data: existing } = await supabaseAdmin
            .from('application_education_work_details')
            .select('id')
            .eq('application_id', app.id)
            .single()

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

        return successResponse({ message: 'Education & work details saved successfully' })
    } catch (err) {
        console.error('[education-work POST] unhandled error:', err)
        return errorResponse('Server Error', 500)
    }
}
