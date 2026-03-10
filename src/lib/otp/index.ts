/**
 * OTP helpers
 * - 6-digit OTP generation
 * - 5-minute expiry
 * - Max 5 attempts, 30-second resend cooldown
 */

export const OTP_EXPIRY_MINUTES = 5
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_SECONDS = 30

/** Generates a random 6-digit OTP string */
export function generateOtp(): string {
    const digits = Math.floor(100000 + Math.random() * 900000)
    return String(digits)
}

/** Returns the ISO expiry timestamp (now + 5 min) */
export function getOtpExpiry(): string {
    const d = new Date()
    d.setMinutes(d.getMinutes() + OTP_EXPIRY_MINUTES)
    return d.toISOString()
}

/** Returns true if the stored OTP has passed its expiry */
export function isOtpExpired(expiresAt: string): boolean {
    return new Date() > new Date(expiresAt)
}

/** Returns true if a resend is allowed (cooldown passed) */
export function canResendOtp(createdAt: string): boolean {
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000
    return elapsed >= OTP_RESEND_COOLDOWN_SECONDS
}
