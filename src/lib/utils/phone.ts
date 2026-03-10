/**
 * Normalise a phone string.
 * - Strips spaces, dashes, parentheses
 * - Prepends +91 if no country code (no leading +)
 */
export function normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-().]/g, '')
    if (!cleaned.startsWith('+')) {
        cleaned = `+91${cleaned}`
    }
    return cleaned
}

export function stripCountryCode(phone: string): string {
    return phone.replace(/^\+\d{1,3}/, '')
}
