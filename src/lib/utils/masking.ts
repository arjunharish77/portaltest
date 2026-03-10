export function maskPhone(phone: string): string {
    // +91XXXXXXXXXX → +91XXXXXX1234
    const cleaned = phone.replace(/\s/g, '')
    if (cleaned.length <= 4) return cleaned
    return cleaned.slice(0, -4).replace(/\d/g, 'X') + cleaned.slice(-4)
}

export function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!domain) return email
    const visible = local.length > 3 ? local.slice(0, 3) : local.slice(0, 1)
    return `${visible}${'*'.repeat(Math.max(0, local.length - visible.length))}@${domain}`
}
