export interface PortalUser {
    id: string
    full_name: string
    phone_country_code: string
    phone: string
    email: string
    course_name: string
    is_phone_verified: boolean
    is_email_verified: boolean
    registration_status: 'pending' | 'active' | 'suspended'
    last_login_at: string | null
    created_at: string
    updated_at: string
}

export interface OtpRequest {
    id: string
    user_id: string | null
    otp_type: string
    channel: 'sms' | 'email'
    target_value: string
    purpose: 'register' | 'login'
    otp_code: string
    status: 'pending' | 'verified' | 'expired'
    expires_at: string
    attempt_count: number
    verified_at: string | null
    payload: Record<string, unknown> | null
    created_at: string
}

export interface PortalSession {
    id: string
    user_id: string
    session_token: string
    status: 'active' | 'revoked'
    expires_at: string
    created_at: string
}

export interface Application {
    id: string
    user_id: string
    application_number: string | null
    applied_course: string | null
    application_status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
    current_step: number | string
    created_at: string
    updated_at: string
}

export interface ApplicationBasicDetails {
    id: string
    application_id: string
    alternate_email: string | null
    mobile_number: string | null
    alternate_mobile_number: string | null
    gender: string | null
    date_of_birth: string | null
    country: string | null
    state: string | null
    city: string | null
    pincode: string | null
    address_line: string | null
    nationality: string | null
    created_at: string
    updated_at: string
}

export interface ApplicationEducationWorkDetails {
    id: string
    application_id: string
    highest_qualification: string | null
    institution_name: string | null
    specialization: string | null
    graduation_year: string | null
    percentage_or_cgpa: string | null
    is_work_experience: boolean | null
    work_experience_years: string | null
    current_company: string | null
    current_designation: string | null
    created_at: string
    updated_at: string
}

export interface LsqSyncLog {
    id: string
    user_id: string | null
    application_id: string | null
    event_type: string
    payload: Record<string, unknown>
    response: Record<string, unknown> | null
    status: 'pending' | 'success' | 'failed'
    synced_at: string | null
    created_at: string
}
