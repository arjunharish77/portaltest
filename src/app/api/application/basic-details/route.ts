import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { BasicDetailsSchema } from '@/lib/validations/application'
import { trackTime, logDbDebug, logPayloadSize, logVercelSimulation } from '@/lib/utils/verification'
import type { Application } from '@/types/db'

export async function GET(req: NextRequest) {
    const startTime = trackTime()
    try {
        const { user } = await getAuthUser(req)

        let queries = 0
        const dbStart = trackTime()

        // Try to fetch app id just to find details
        queries++
        const { data: app } = await supabaseAdmin
            .from('applications')
            .select('id, application_number, custom_user_data:user_id ( full_name, email, phone )')
            .eq('user_id', user.id)
            .single()

        if (!app) return successResponse({ details: null, user: null })

        queries++
        const { data: details } = await supabaseAdmin
            .from('application_basic_details')
            .select('alternate_email, alternate_mobile_number, gender, date_of_birth, country, state, city, pincode, address_line, nationality')
            .eq('application_id', app.id)
            .single()

        const dbDuration = trackTime() - dbStart
        logDbDebug('GET /api/application/basic-details', queries, dbDuration, 'alternate_email, gender, dob, ...')

        const payload = {
            details: details ?? null,
            user: {
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                course_name: user.course_name,
                application_number: app.application_number,
            }
        }

        const totalDuration = trackTime() - startTime
        const payloadBytes = Buffer.byteLength(JSON.stringify(payload), 'utf8')
        logPayloadSize('GET /api/application/basic-details', payloadBytes, totalDuration, 3)
        logVercelSimulation('GET /api/application/basic-details', 1)

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
        const parsed = BasicDetailsSchema.safeParse(body)
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]
            return errorResponse(firstError?.message ?? 'Validation failed', 400, {
                validation_errors: parsed.error.flatten().fieldErrors,
            })
        }

        let queries = 0
        const dbStart = trackTime()

        queries++
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
        queries++
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

        queries++
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
        queries++
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

        const dbDuration = trackTime() - dbStart
        logDbDebug('POST /api/application/basic-details', queries, dbDuration, 'upsert full row')

        const responsePayload = {
            message: 'Basic details saved successfully',
            updated_flags: {
                basic_details_status: 'completed',
                application_status: 'application_fee_pending',
                current_step: 'application_fee'
            }
        }

        const totalDuration = trackTime() - startTime
        logPayloadSize('POST /api/application/basic-details', Buffer.byteLength(JSON.stringify(responsePayload), 'utf8'), totalDuration, 3)
        logVercelSimulation('POST /api/application/basic-details', 1)

        return successResponse(responsePayload)
    } catch (err) {
        console.error('[basic-details POST] error:', err)
        return errorResponse('Server Error', 500)
    }
}
