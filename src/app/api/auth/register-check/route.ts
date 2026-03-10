import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { RegisterCheckSchema } from '@/lib/validations/auth'
import { errorResponse, successResponse } from '@/lib/utils/api-response'
import { normalizePhone } from '@/lib/utils/phone'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = RegisterCheckSchema.safeParse(body)
        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
        }

        const { phone, email } = parsed.data
        const normalizedPhone = normalizePhone(phone)

        const { data: existing } = await supabaseAdmin
            .from('portal_users')
            .select('id, phone, email')
            .or(`phone.eq.${normalizedPhone},email.eq.${email}`)
            .limit(1)

        if (existing && existing.length > 0) {
            return errorResponse('An account already exists with this phone or email. Please login.', 409, {
                code: 'USER_EXISTS',
            })
        }

        return successResponse({ available: true })
    } catch (err) {
        console.error('[register-check]', err)
        return errorResponse('Server error', 500)
    }
}
