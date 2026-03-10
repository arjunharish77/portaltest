import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { EducationWorkDetailsSchema } from '@/lib/validations/application'
import type { Application, ApplicationEducationWorkDetails } from '@/types/db'

export async function GET(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)

        const { data: app } = await supabaseAdmin
            .from('applications')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (!app) return successResponse({ details: null })

        const typedApp = app as Application

        const { data: details } = await supabaseAdmin
            .from('application_education_work_details')
            .select('*')
            .eq('application_id', typedApp.id)
            .single()

        return successResponse({ details: details as ApplicationEducationWorkDetails | null })
    } catch {
        return errorResponse('Unauthorized', 401)
    }
}

export async function POST(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)

        const body = await req.json()
        console.log('[DEBUG edu-work] received payload:', body)

        const parsed = EducationWorkDetailsSchema.safeParse(body)
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]
            console.error('[DEBUG edu-work] validation failed:', parsed.error.flatten().fieldErrors)
            return errorResponse(firstError?.message ?? 'Validation failed', 400, {
                validation_errors: parsed.error.flatten().fieldErrors,
            })
        }

        console.log(`[DEBUG edu-work] resolved user_id: ${user.id}`)

        // Get application
        const { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .select('id, current_step')
            .eq('user_id', user.id)
            .single()

        if (appError) console.error('[DEBUG edu-work] app fetch error:', appError)

        if (!app) {
            console.error('[DEBUG edu-work] Application not found for user', user.id)
            return errorResponse('Application not found', 404)
        }

        const typedApp = app as Application
        console.log(`[DEBUG edu-work] resolved application_id: ${typedApp.id}`)

        // Check if details already exist
        const { data: existing, error: existingError } = await supabaseAdmin
            .from('application_education_work_details')
            .select('id')
            .eq('application_id', typedApp.id)
            .single()

        if (existingError && existingError.code !== 'PGRST116') {
            console.log('[DEBUG edu-work] Existing details fetch error:', existingError)
        }

        const payload = {
            ...parsed.data,
            application_id: typedApp.id,
            updated_at: new Date().toISOString(),
        }

        console.log('[DEBUG edu-work] preparing db save payload:', payload)

        if (existing?.id) {
            const { error: updateError } = await supabaseAdmin
                .from('application_education_work_details')
                .update(payload)
                .eq('id', existing.id)

            if (updateError) {
                console.error('[Supabase DB Error] edu-work update:', updateError)
                return errorResponse('Database error during update', 500)
            }
        } else {
            const { error: insertError } = await supabaseAdmin
                .from('application_education_work_details')
                .insert(payload)

            if (insertError) {
                console.error('[Supabase DB Error] edu-work insert:', insertError)
                return errorResponse('Database error during insert', 500)
            }
        }

        // Update application step and status
        const { error: stepUpdateError } = await supabaseAdmin
            .from('applications')
            .update({
                current_step: 'document_upload', // Assuming this is next, or 'completed'
                application_status: 'in_progress',
                updated_at: new Date().toISOString()
            })
            .eq('id', typedApp.id)

        if (stepUpdateError) {
            console.error('[Supabase DB Error] application step update:', stepUpdateError)
        }

        console.log('[DEBUG edu-work] Details saved successfully')
        return successResponse({ message: 'Education & work details saved successfully' })
    } catch (err: any) {
        console.error('[DEBUG edu-work] unhandled server error:', err)
        return errorResponse('Server Error', 500)
    }
}
