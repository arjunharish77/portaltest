export type OtpPurpose = 'register' | 'login'
export type OtpChannel = 'sms' | 'email'

export interface AuthUser {
    id: string
    full_name: string
    phone: string
    phone_country_code: string
    email: string
    course_name: string
    registration_status: string
    is_phone_verified: boolean
    is_email_verified: boolean
}

export interface OtpVerifyContext {
    userId: string
    target: string // masked phone or email shown on screen
    rawTarget: string // actual phone or email for API call
    channel: OtpChannel
    purpose: OtpPurpose
    otpRequestId?: string
}
