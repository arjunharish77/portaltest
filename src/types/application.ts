import type { ApplicationApprovalStatus } from './db'

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
        current_step: string
        last_edited_at: string | null
        // Step statuses
        basic_details_status: string | null
        education_details_status: string | null
        document_upload_status: string | null
        // Application fee
        application_fee_status: string | null
        application_fee_amount: number | null
        payment_completed_at: string | null
        // Admission fee
        admission_fee_status: string | null
        admission_fee_plan: string | null
        admission_fee_amount: number | null
    } | null
    approvals: ApplicationApprovalStatus[]
}

export type AdmissionFeePlan = 'semester' | 'annual' | 'full_course'

export const ADMISSION_FEE_PLANS: Record<AdmissionFeePlan, { label: string; amount: number }> = {
    semester: { label: 'Semester Fee', amount: 20000 },
    annual: { label: 'Annual Fee', amount: 40000 },
    full_course: { label: 'Full Course Fee', amount: 80000 },
}

export interface EduWorkForm {
    // 10th
    tenth_board: string
    tenth_school: string
    tenth_year: string
    tenth_percentage: string
    // 12th
    twelfth_board: string
    twelfth_school: string
    twelfth_year: string
    twelfth_percentage: string
    // UG
    ug_university: string
    ug_college: string
    ug_course: string
    ug_year: string
    ug_percentage: string
    // Work experience
    is_work_experience: boolean
    work_experience_years: string
    current_company: string
    current_designation: string
    // Specialization
    specialization: string
}
