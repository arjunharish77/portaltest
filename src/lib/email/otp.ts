/**
 * Email OTP sender stub.
 * Replace the body of sendEmailOtp() with a real provider (Resend, SendGrid, etc.)
 * when ready. For now it simulates success in development and logs in production.
 */

interface EmailResult {
    success: boolean
    message: string
}

export async function sendEmailOtp(
    email: string,
    otp: string,
    purpose: string
): Promise<EmailResult> {
    const isDev = process.env.APP_ENV === 'development'

    console.log(`[EMAIL] OTP for ${email} (purpose=${purpose}): ${isDev ? otp : '***REDACTED***'}`)

    // TODO: integrate a real email provider here
    // e.g. Resend: await resend.emails.send({ from, to: email, subject, html })

    return { success: true, message: 'OTP sent via email (stub)' }
}
