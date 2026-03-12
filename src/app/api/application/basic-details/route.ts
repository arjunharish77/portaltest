import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { BasicDetailsSchema } from '@/lib/validations/application'
import type { Application } from '@/types/db'

export async function GET(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)

        // Try to fetch app id just to find details
        const { data: app } = await supabaseAdmin
            .from('applications')
            .select('id, application_number, custom_user_data:user_id ( full_name, email, phone )')
            .eq('user_id', user.id)
            .single()

        if (!app) return successResponse({ details: null, user: null })

        const { data: details } = await supabaseAdmin
            .from('application_basic_details')
            .select('alternate_email, alternate_mobile_number, gender, date_of_birth, country, state, city, pincode, address_line, nationality')
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
        const parsed = BasicDetailsSchema.safeParse(body)
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]
            return errorResponse(firstError?.message ?? 'Validation failed', 400, {
                validation_errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (appError || !app) {
            return errorResponse('Application not found', 404)
        }

        const typedApp = app as Application
        const now = new Date().toISOString()

        // Upsert basic details
        const { data: existing } = await supabaseAdmin
            .from('application_basic_details')
            .select('id')
            .eq('application_id', typedApp.id)
            .single()

        const payload = {
            ...parsed.data,
            application_id: typedApp.id,
            full_name: user.full_name,
            email: user.email,
            mobile_number: user.phone,
            updated_at: now,
        }

        if (existing?.id) {
            const { error } = await supabaseAdmin
                .from('application_basic_details')
                .update(payload)
                .eq('id', existing.id)
            if (error) {
                console.error('[Supabase DB Error] update basic details:', error)
                return errorResponse(`Database error: ${error.message}`, 500)
            }
        } else {
            const { error } = await supabaseAdmin
                .from('application_basic_details')
                .insert(payload)
            if (error) {
                console.error('[Supabase DB Error] insert basic details:', error)
                return errorResponse(`Database error: ${error.message}`, 500)
            }
        }

        // Update application: mark basic details complete, set next step to application_fee
        const { error: stepErr } = await supabaseAdmin
            .from('applications')
            .update({
                basic_details_status: 'completed',
                application_status: 'application_fee_pending',
                current_step: 'application_fee',
                last_edited_at: now,
                updated_at: now,
            })
            .eq('id', typedApp.id)

        if (stepErr) console.error('[basic-details POST] step update error:', stepErr)

        return successResponse({
            message: 'Basic details saved successfully',
            updated_flags: {
                basic_details_status: 'completed',
                application_status: 'application_fee_pending',
                current_step: 'application_fee'
            }
        })
    } catch (err) {
        console.error('[basic-details POST] error:', err)
        return errorResponse('Server Error', 500)
    }
}
