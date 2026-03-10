import { v4 as uuidv4 } from 'uuid'

const SESSION_EXPIRY_DAYS = 7

/** Generates a secure random UUID session token */
export function generateSessionToken(): string {
    return uuidv4()
}

/** Returns the ISO expiry timestamp (now + 7 days) */
export function getSessionExpiry(): string {
    const d = new Date()
    d.setDate(d.getDate() + SESSION_EXPIRY_DAYS)
    return d.toISOString()
}

/** Returns true if the stored session has expired */
export function isSessionExpired(expiresAt: string): boolean {
    return new Date() > new Date(expiresAt)
}
