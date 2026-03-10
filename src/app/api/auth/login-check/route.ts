import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { LoginCheckSchema } from '@/lib/validations/auth'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { normalizePhone } from '@/lib/utils/phone'
import type { PortalUser } from '@/types/db'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = LoginCheckSchema.safeParse(body)
        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
        }

        const { identifier } = parsed.data
        const isEmail = identifier.includes('@')
        let query

        if (isEmail) {
            query = supabaseAdmin
                .from('portal_users')
                .select('id, full_name, phone, email, registration_status')
                .eq('email', identifier.toLowerCase().trim())
        } else {
            const normalized = normalizePhone(identifier)
            query = supabaseAdmin
                .from('portal_users')
                .select('id, full_name, phone, email, registration_status')
                .eq('phone', normalized)
        }

        const { data: users, error } = await query.limit(1)

        if (error) {
            console.error('[login-check] DB error:', error)
            return errorResponse('Server error', 500)
        }

        if (!users || users.length === 0) {
            return errorResponse('No account found. Please register first.', 404, { code: 'USER_NOT_FOUND' })
        }

        const user = users[0] as PortalUser

        if (user.registration_status !== 'active') {
            return errorResponse('Your registration is not complete. Please complete registration.', 403, {
                code: 'REGISTRATION_INCOMPLETE',
            })
        }

        return successResponse({
            user_id: user.id,
            full_name: user.full_name,
            phone: user.phone,
            email: user.email,
        })
    } catch (err) {
        console.error('[login-check]', err)
        return errorResponse('Server error', 500)
    }
}
