import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import type { Application } from '@/types/db'

export async function GET(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)

        console.log(`[DEBUG dashboard] resolved user_id: ${user.id}`)

        // Fetch or create application row
        let { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .select('id, application_status, current_step, application_number, applied_course')
            .eq('user_id', user.id)
            .single()

        if (appError || !app) {
            // Create application if not exists
            const { data: newApp, error: createError } = await supabaseAdmin
                .from('applications')
                .insert({ user_id: user.id, application_status: 'draft', current_step: 0 })
                .select('id, application_status, current_step, application_number, applied_course')
                .single()

            if (createError || !newApp) {
                return errorResponse('Failed to load application data', 500)
            }
            app = newApp
        }

        const typedApp = app as Application
        console.log('[DEBUG dashboard] fetched application row:', typedApp)

        return successResponse({
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
            },
        })
    } catch {
        return errorResponse('Unauthorized', 401)
    }
}
