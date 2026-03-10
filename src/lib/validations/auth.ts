import { z } from 'zod'

export const RegisterCheckSchema = z.object({
    phone: z.string().min(7, 'Phone is required'),
    email: z.string().email('Invalid email address'),
})

export const RegisterStartSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: z.string().min(7, 'Phone number is required'),
    phone_country_code: z.string().default('+91'),
    email: z.string().email('Invalid email address'),
    course_name: z.string().min(1, 'Course is required'),
})

export const VerifyOtpSchema = z.object({
    otp_request_id: z.string().uuid('Invalid OTP request'),
    otp_code: z.string().length(6, 'OTP must be 6 digits'),
})

export const LoginCheckSchema = z.object({
    identifier: z.string().min(3, 'Phone or email is required'),
    channel: z.enum(['sms', 'email']).optional().default('sms'),
})

export const LoginStartSchema = z.object({
    user_id: z.string().uuid(),
    channel: z.enum(['sms', 'email']).default('sms'),
})

export const ResendOtpSchema = z.object({
    otp_request_id: z.string().uuid('Invalid OTP request ID'),
})

export const SendEmailOtpSchema = z.object({
    user_id: z.string().uuid(),
})
