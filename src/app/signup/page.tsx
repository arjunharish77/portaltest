'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

const COURSES = [
    'MBA',
    'MCA',
    'M.Com',
    'MSc Data Science',
    'MSc IT',
    'BBA',
    'BCA',
    'B.Com',
    'BA (English Hons.)',
    'MA (English)',
    'MA (Journalism)',
    'Other',
]

interface FormData {
    full_name: string
    phone: string
    email: string
    course_name: string
}

export default function SignupPage() {
    const router = useRouter()
    const [form, setForm] = useState<FormData>({
        full_name: '',
        phone: '',
        email: '',
        course_name: '',
    })
    const [errors, setErrors] = useState<Partial<FormData>>({})
    const [serverError, setServerError] = useState('')
    const [loading, setLoading] = useState(false)

    function update(field: keyof FormData, value: string) {
        setForm((p) => ({ ...p, [field]: value }))
        setErrors((p) => ({ ...p, [field]: '' }))
        setServerError('')
    }

    function validate(): boolean {
        const newErrors: Partial<FormData> = {}
        if (!form.full_name.trim() || form.full_name.trim().length < 2)
            newErrors.full_name = 'Enter your full name'
        if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 7)
            newErrors.phone = 'Enter a valid mobile number'
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
            newErrors.email = 'Enter a valid email address'
        if (!form.course_name) newErrors.course_name = 'Select a course'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return

        setLoading(true)
        setServerError('')

        try {
            // Step 1: Check if user exists
            const checkRes = await fetch('/api/auth/register-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: form.phone, email: form.email }),
            })
            const checkJson = await checkRes.json()

            if (!checkJson.success) {
                setServerError(checkJson.error ?? 'Failed to validate')
                return
            }

            // Step 2: Start registration (create user, send OTP)
            const startRes = await fetch('/api/auth/register-start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: form.full_name.trim(),
                    phone: form.phone.trim(),
                    email: form.email.trim().toLowerCase(),
                    course_name: form.course_name,
                    phone_country_code: '+91',
                }),
            })
            const startJson = await startRes.json()

            if (!startJson.success) {
                setServerError(startJson.error ?? 'Failed to start registration')
                return
            }

            sessionStorage.setItem(
                'otp_context',
                JSON.stringify({
                    otp_request_id: startJson.data.otp_request_id,
                    user_id: startJson.data.user_id,
                    masked_target: startJson.data.masked_phone,
                    channel: 'sms',
                    purpose: 'register',
                    flow: 'register',
                })
            )

            router.push('/verify-otp')
        } catch {
            setServerError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Apply to MAHE programs through Online Manipal"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Input
                    label="Full Name"
                    type="text"
                    placeholder="As on your ID proof"
                    value={form.full_name}
                    onChange={(e) => update('full_name', e.target.value)}
                    error={errors.full_name}
                    required
                />

                <Input
                    label="Mobile Number"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    error={errors.phone}
                    hint="OTP will be sent to this number"
                    required
                />

                <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    error={errors.email}
                    required
                />

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--text-primary)]">
                        Course <span className="text-[var(--error)]">*</span>
                    </label>
                    <select
                        value={form.course_name}
                        onChange={(e) => update('course_name', e.target.value)}
                        className={[
                            'w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors bg-white',
                            'focus:outline-none focus:ring-2',
                            errors.course_name
                                ? 'border-[var(--error)] focus:ring-red-100'
                                : 'border-[var(--border)] focus:border-[var(--brand-primary)] focus:ring-blue-100',
                            !form.course_name ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]',
                        ].join(' ')}
                    >
                        <option value="">Select your programme</option>
                        {COURSES.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    {errors.course_name && (
                        <p className="text-xs text-[var(--error)] mt-0.5">{errors.course_name}</p>
                    )}
                </div>

                {serverError && (
                    <Alert variant={serverError.includes('exists') || serverError.includes('already') ? 'warning' : 'error'}>
                        {serverError}
                        {(serverError.includes('exists') || serverError.includes('already')) && (
                            <>{' '}<Link href="/login" className="font-medium underline">Login here</Link></>
                        )}
                    </Alert>
                )}

                <Button type="submit" fullWidth loading={loading} size="lg">
                    Continue with OTP
                </Button>

                <p className="text-center text-sm text-[var(--text-secondary)]">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-[var(--brand-primary)]">
                        Login
                    </Link>
                </p>
            </form>
        </AuthLayout>
    )
}
