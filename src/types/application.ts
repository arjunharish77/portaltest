export interface DashboardData {
    user: {
        id: string
        full_name: string
        email: string
        phone: string
        course_name: string
    }
    application: {
        id: string
        application_number: string | null
        applied_course: string | null
        application_status: string
        current_step: number | string
    } | null
}

export interface BasicDetailsPayload {
    alternate_email?: string
    alternate_mobile_number?: string
    gender: string
    date_of_birth: string
    country: string
    state: string
    city: string
    pincode: string
    address_line: string
    nationality: string
}

export interface EducationWorkDetailsPayload {
    highest_qualification: string
    institution_name: string
    specialization: string
    graduation_year: string
    percentage_or_cgpa: string
    is_work_experience: boolean
    work_experience_years?: string
    current_company?: string
    current_designation?: string
}
