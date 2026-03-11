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
    application_status: string
    current_step: string
    // Step statuses
    basic_details_status: string | null
    education_details_status: string | null
    document_upload_status: string | null
    // Application fee (₹500)
    application_fee_amount: number | null
    application_fee_status: string | null
    payment_completed_at: string | null
    // Admission fee (semester/annual/full_course)
    admission_fee_status: string | null
    admission_fee_plan: 'semester' | 'annual' | 'full_course' | null
    admission_fee_amount: number | null
    // Timestamps
    submitted_at: string | null
    last_edited_at: string | null
    created_at: string
    updated_at: string
}

export interface ApplicationPayment {
    id: string
    application_id: string
    user_id: string
    fee_type: 'application_fee' | 'admission_fee'
    plan: 'semester' | 'annual' | 'full_course' | null
    amount: number
    payment_status: 'initiated' | 'success' | 'failed'
    initiated_at: string
    paid_at: string | null
    transaction_reference: string | null
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
    // 10th
    tenth_board: string | null
    tenth_school: string | null
    tenth_year: string | null
    tenth_percentage: string | null
    // 12th
    twelfth_board: string | null
    twelfth_school: string | null
    twelfth_year: string | null
    twelfth_percentage: string | null
    // UG
    ug_university: string | null
    ug_college: string | null
    ug_course: string | null
    ug_year: string | null
    ug_percentage: string | null
    // Work experience
    is_work_experience: boolean | null
    work_experience_years: string | null
    current_company: string | null
    current_designation: string | null
    // Specialization
    specialization: string | null
    created_at: string
    updated_at: string
}

export interface ApplicationDocument {
    id: string
    application_id: string
    user_id: string
    document_type: string
    file_name: string
    uploaded_at: string
}

export interface ApplicationApprovalStatus {
    id: string
    application_id: string
    level: string
    status: 'Pending' | 'Approved' | 'Rejected'
    remarks: string
    created_at: string
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
