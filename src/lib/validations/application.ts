import { z } from 'zod'

export const BasicDetailsSchema = z.object({
    alternate_email: z.string().email('Valid email required').or(z.literal('')).optional(),
    alternate_mobile_number: z.string().or(z.literal('')).optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    country: z.string().min(1, 'Country is required'),
    state: z.string().min(1, 'State is required'),
    city: z.string().min(1, 'City is required'),
    pincode: z.string().min(4, 'Pincode is required'),
    address_line: z.string().min(5, 'Address is required'),
    nationality: z.string().min(1, 'Nationality is required'),
})

export const EducationWorkDetailsSchema = z.object({
    highest_qualification: z.string().min(1, 'Highest qualification is required'),
    institution_name: z.string().min(1, 'Institution name is required'),
    specialization: z.string().min(1, 'Specialization is required'),
    graduation_year: z.string().regex(/^\d{4}$/, 'Valid graduation year required'),
    percentage_or_cgpa: z.string().min(1, 'Percentage or CGPA is required'),
    is_work_experience: z.boolean(),
    work_experience_years: z.string().optional(),
    current_company: z.string().optional(),
    current_designation: z.string().optional(),
})
