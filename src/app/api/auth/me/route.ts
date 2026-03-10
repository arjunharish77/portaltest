import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth/guard'
import { errorResponse, successResponse } from '@/lib/utils/api-response'

export async function GET(req: NextRequest) {
    try {
        const { user } = await getAuthUser(req)
        return successResponse({ user })
    } catch {
        return errorResponse('Unauthorized', 401)
    }
}
