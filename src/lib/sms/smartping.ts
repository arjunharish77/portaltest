import { env } from '@/lib/env'

function buildOtpMessage(otp: string): string {
    return `Hello, ${otp} is your One-Time Password(OTP) for logging into the MAHE Portal at Online Manipal. This OTP is only valid for five minutes. Team MAHE`
}

interface SmsResult {
    success: boolean
    message: string
}

export async function sendSmsOtp(
    phone: string,
    otp: string,
    _purpose?: string
): Promise<SmsResult> {
    const text = buildOtpMessage(otp)

    const params = new URLSearchParams({
        username: env.SMS_API_USERNAME,
        password: env.SMS_API_PASSWORD,
        unicode: 'false',
        from: env.SMS_API_FROM,
        text,
        to: phone,
    })

    const url = `${env.SMS_API_BASE_URL}?${params.toString()}`

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: '',
        })

        let body = ''
        try {
            body = await response.text()
        } catch {
            body = ''
        }

        // Log safely (no credentials — they are in query string, not logged here)
        console.log(`[SMS] to=${phone.slice(0, 4)}*** status=${response.status}`)

        if (!response.ok) {
            console.warn(`[SMS] Non-OK response: ${response.status}`)
            return { success: false, message: `SMS API returned ${response.status}` }
        }

        const isSuccess = response.ok && (body.toLowerCase().includes('success') || response.status === 200)
        return { success: isSuccess, message: isSuccess ? 'OTP sent via SMS' : body }
    } catch (err) {
        console.error('[SMS] Fetch failed:', (err as Error).message)
        return { success: false, message: 'SMS delivery failed' }
    }
}
