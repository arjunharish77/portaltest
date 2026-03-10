import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'portal_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export function setSessionCookie(response: NextResponse, token: string) {
    const isProduction = process.env.APP_ENV === 'production'
    response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: SESSION_MAX_AGE,
        path: '/',
    })
    return response
}

export function clearSessionCookie(response: NextResponse) {
    response.cookies.set(COOKIE_NAME, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.APP_ENV === 'production',
        maxAge: 0,
        path: '/',
    })
    return response
}

export function getSessionToken(req: NextRequest): string | null {
    return req.cookies.get(COOKIE_NAME)?.value ?? null
}
