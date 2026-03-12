import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
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

        if (!app) return successResponse({ documents: [] })

        queries++
        const { data: documents } = await supabaseAdmin
            .from('application_documents')
            .select('id, document_type, file_name, uploaded_at')
            .eq('application_id', app.id)
            .order('uploaded_at', { ascending: true })

        const dbDuration = trackTime() - dbStart
        logDbDebug('GET /api/application/document-upload', queries, dbDuration, 'id, type, name, date')

        const payload = {
            documents: documents ?? [],
        }

        const totalDuration = trackTime() - startTime
        logPayloadSize('GET /api/application/document-upload', Buffer.byteLength(JSON.stringify(payload), 'utf8'), totalDuration, 5)
        logVercelSimulation('GET /api/application/document-upload', 1)

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
        const documents: { document_type: string; file_name: string }[] = body.documents ?? []

        let queries = 0
        const dbStart = trackTime()

        queries++
        const { data: app, error: appErr } = await supabaseAdmin
            .from('applications')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (appErr || !app) {
            console.error('[document-upload POST] app not found:', appErr)
            return errorResponse('Application not found', 404)
        }

        const now = new Date().toISOString()

        // Only persist docs with actual file names — no user_id column in this table
        const validDocs = documents.filter(d => d.document_type?.trim() && d.file_name?.trim())
        if (validDocs.length > 0) {
            const rows = validDocs.map(d => ({
                application_id: app.id,
                document_type: d.document_type,
                file_name: d.file_name,
                uploaded_at: now,
            }))

            console.log('[document-upload POST] inserting', rows.length, 'docs for application_id:', app.id)

            queries++
            const { error: docErr } = await supabaseAdmin
                .from('application_documents')
                .insert(rows)

            if (docErr) {
                console.error('[document-upload POST] INSERT error:', docErr.message, docErr.details, docErr.hint)
                return errorResponse('Failed to record documents', 500)
            }
        }

        // Mark doc upload complete
        queries++
        const { error: updateErr } = await supabaseAdmin
            .from('applications')
            .update({
                document_upload_status: 'completed',
                current_step: 'dashboard_split',
                last_edited_at: now,
                updated_at: now,
            })
            .eq('id', app.id)

        if (updateErr) {
            console.error('[document-upload POST] UPDATE applications error:', updateErr.message)
            return errorResponse('Failed to update application', 500)
        }

        const dbDuration = trackTime() - dbStart
        logDbDebug('POST /api/application/document-upload', queries, dbDuration, 'insert docs, update app')

        const responsePayload = {
            message: 'Documents submitted successfully',
            redirect_to: '/dashboard',
            updated_flags: {
                document_upload_status: 'completed',
                current_step: 'dashboard_split'
            }
        }

        const totalDuration = trackTime() - startTime
        logPayloadSize('POST /api/application/document-upload', Buffer.byteLength(JSON.stringify(responsePayload), 'utf8'), totalDuration, 5)
        logVercelSimulation('POST /api/application/document-upload', 1)

        return successResponse(responsePayload)
    } catch (err) {
        console.error('[document-upload POST] unhandled error:', err)
        return errorResponse('Server Error', 500)
    }
}
