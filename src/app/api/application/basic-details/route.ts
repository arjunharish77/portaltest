import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { BasicDetailsSchema } from '@/lib/validations/application'
import type { Application, ApplicationBasicDetails } from '@/types/db'

export async function GET(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)

        const { data: app } = await supabaseAdmin
            .from('applications')
            .select('id, application_number')
            .eq('user_id', user.id)
            .single()

        if (!app) return successResponse({ details: null })

        const typedApp = app as Application

        const { data: details } = await supabaseAdmin
            .from('application_basic_details')
            .select('*')
            .eq('application_id', typedApp.id)
            .single()

        return successResponse({
            details: details as ApplicationBasicDetails | null,
            user: {
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                course_name: user.course_name,
                application_number: typedApp.application_number
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
        console.log('[DEBUG basic-details] received payload:', body)

        const parsed = BasicDetailsSchema.safeParse(body)
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]
            console.error('[DEBUG basic-details] validation failed:', parsed.error.flatten().fieldErrors)
            return errorResponse(firstError?.message ?? 'Validation failed', 400, {
                validation_errors: parsed.error.flatten().fieldErrors,
            })
        }

        console.log(`[DEBUG basic-details] resolved user_id: ${user.id}`)

        // Get application
        let { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (appError) {
            console.error('[DEBUG basic-details] app fetch error:', appError)
        }

        if (!app) {
            console.error('[DEBUG basic-details] Application not found for user', user.id)
            return errorResponse('Application not found. Please contact support.', 404)
        }

        const typedApp = app as Application
        console.log(`[DEBUG basic-details] resolved application_id: ${typedApp.id}`)

        // Check if details already exist
        const { data: existing, error: existingError } = await supabaseAdmin
            .from('application_basic_details')
            .select('id')
            .eq('application_id', typedApp.id)
            .single()

        if (existingError && existingError.code !== 'PGRST116') {
            console.log('[DEBUG basic-details] Existing details fetch error:', existingError)
        }

        // We construct the payload including the identity details from the user object 
        // safely to ensure the database schema receives them if they are still required fields.
        const payload = {
            ...parsed.data,
            application_id: typedApp.id,
            full_name: user.full_name,
            email: user.email,
            mobile_number: user.phone,
            updated_at: new Date().toISOString(),
        }

        console.log('[DEBUG basic-details] preparing db save payload:', payload)

        if (existing?.id) {
            const { error: updateError } = await supabaseAdmin
                .from('application_basic_details')
                .update(payload)
                .eq('id', existing.id)

            if (updateError) {
                console.error('[Supabase DB Error] basic-details update:', updateError)
                return errorResponse('Database error during update', 500)
            }
        } else {
            const { error: insertError } = await supabaseAdmin
                .from('application_basic_details')
                .insert(payload)

            if (insertError) {
                console.error('[Supabase DB Error] basic-details insert:', insertError)
                return errorResponse('Database error during insert', 500)
            }
        }

        // Update application step and status
        const { error: stepUpdateError } = await supabaseAdmin
            .from('applications')
            .update({ current_step: 'education_work_details', application_status: 'in_progress', updated_at: new Date().toISOString() })
            .eq('id', typedApp.id)

        if (stepUpdateError) {
            console.error('[Supabase DB Error] application step update:', stepUpdateError)
        }

        console.log('[DEBUG basic-details] Basic details saved successfully')
        return successResponse({ message: 'Basic details saved successfully' })
    } catch (err: any) {
        console.error('[DEBUG basic-details] unhandled server error:', err)
        return errorResponse('Server Error', 500)
    }
}
