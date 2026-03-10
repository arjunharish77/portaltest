'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

type BasicDetailsForm = {
    alternate_email: string
    alternate_mobile_number: string
    gender: string
    date_of_birth: string
    country: string
    state: string
    city: string
    pincode: string
    address_line: string
    nationality: string
}

type EducationWorkForm = {
    highest_qualification: string
    institution_name: string
    specialization: string
    graduation_year: string
    percentage_or_cgpa: string
    is_work_experience: boolean
    work_experience_years: string
    current_company: string
    current_designation: string
}

const EMPTY_BASIC: BasicDetailsForm = {
    alternate_email: '',
    alternate_mobile_number: '',
    gender: '',
    date_of_birth: '',
    country: 'India',
    state: '',
    city: '',
    pincode: '',
    address_line: '',
    nationality: 'Indian',
}

const EMPTY_EDU: EducationWorkForm = {
    highest_qualification: '',
    institution_name: '',
    specialization: '',
    graduation_year: '',
    percentage_or_cgpa: '',
    is_work_experience: false,
    work_experience_years: '',
    current_company: '',
    current_designation: '',
}

const GENDERS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export default function ApplicationPage() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1)

    // Identity data (Read-Only)
    const [identity, setIdentity] = useState({
        full_name: '',
        email: '',
        phone: '',
        course_name: '',
        application_number: ''
    })

    const [basicForm, setBasicForm] = useState<BasicDetailsForm>(EMPTY_BASIC)
    const [eduForm, setEduForm] = useState<EducationWorkForm>(EMPTY_EDU)

    const [basicErrors, setBasicErrors] = useState<Partial<BasicDetailsForm>>({})
    const [eduErrors, setEduErrors] = useState<Partial<EducationWorkForm>>({})

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const [serverError, setServerError] = useState('')

    // Load existing data
    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const meRes = await fetch('/api/auth/me')
            if (meRes.status === 401) {
                router.replace('/login')
                return
            }

            // Load basic details + identity
            const basicRes = await fetch('/api/application/basic-details')
            const basicJson = await basicRes.json()

            if (basicJson.success) {
                if (basicJson.data?.user) {
                    setIdentity(basicJson.data.user)
                }
                if (basicJson.data?.details) {
                    const d = basicJson.data.details
                    setBasicForm({
                        alternate_email: d.alternate_email ?? '',
                        alternate_mobile_number: d.alternate_mobile_number ?? '',
                        gender: d.gender ?? '',
                        date_of_birth: d.date_of_birth ?? '',
                        country: d.country ?? 'India',
                        state: d.state ?? '',
                        city: d.city ?? '',
                        pincode: d.pincode ?? '',
                        address_line: d.address_line ?? '',
                        nationality: d.nationality ?? 'Indian',
                    })
                }
            }

            // Load Education Details
            const eduRes = await fetch('/api/application/education-work-details')
            const eduJson = await eduRes.json()
            if (eduJson.success && eduJson.data?.details) {
                const d = eduJson.data.details
                setEduForm({
                    highest_qualification: d.highest_qualification ?? '',
                    institution_name: d.institution_name ?? '',
                    specialization: d.specialization ?? '',
                    graduation_year: d.graduation_year ?? '',
                    percentage_or_cgpa: d.percentage_or_cgpa ?? '',
                    is_work_experience: d.is_work_experience ?? false,
                    work_experience_years: d.work_experience_years ?? '',
                    current_company: d.current_company ?? '',
                    current_designation: d.current_designation ?? '',
                })
            }

            setLoading(false)
        }
        loadData()
    }, [router])

    function updateBasic(field: keyof BasicDetailsForm, value: string) {
        setBasicForm((p) => ({ ...p, [field]: value }))
        setBasicErrors((p) => ({ ...p, [field]: '' }))
        setSuccess('')
        setServerError('')
    }

    function updateEdu<K extends keyof EducationWorkForm>(field: K, value: EducationWorkForm[K]) {
        setEduForm((p) => ({ ...p, [field]: value }))
        setEduErrors((p) => ({ ...p, [field]: '' }))
        setSuccess('')
        setServerError('')
    }

    function validateBasic(): boolean {
        const e: Partial<BasicDetailsForm> = {}
        if (!basicForm.gender) e.gender = 'Required'
        if (!basicForm.date_of_birth) e.date_of_birth = 'Required'
        if (!basicForm.country.trim()) e.country = 'Required'
        if (!basicForm.state.trim()) e.state = 'Required'
        if (!basicForm.city.trim()) e.city = 'Required'
        if (!basicForm.pincode.trim()) e.pincode = 'Required'
        if (!basicForm.address_line.trim()) e.address_line = 'Required'
        if (!basicForm.nationality.trim()) e.nationality = 'Required'
        if (basicForm.alternate_email && !/\S+@\S+\.\S+/.test(basicForm.alternate_email)) {
            e.alternate_email = 'Valid email required'
        }
        setBasicErrors(e)
        return Object.keys(e).length === 0
    }

    function validateEdu(): boolean {
        const e: Partial<EducationWorkForm> = {}
        if (!eduForm.highest_qualification.trim()) e.highest_qualification = 'Required'
        if (!eduForm.institution_name.trim()) e.institution_name = 'Required'
        if (!eduForm.specialization.trim()) e.specialization = 'Required'
        if (!eduForm.graduation_year.trim()) {
            e.graduation_year = 'Required'
        } else if (!/^\d{4}$/.test(eduForm.graduation_year)) {
            e.graduation_year = '4-digit year required'
        }
        if (!eduForm.percentage_or_cgpa.trim()) e.percentage_or_cgpa = 'Required'

        if (eduForm.is_work_experience) {
            if (!eduForm.work_experience_years?.trim()) e.work_experience_years = 'Required'
            if (!eduForm.current_company?.trim()) e.current_company = 'Required'
            if (!eduForm.current_designation?.trim()) e.current_designation = 'Required'
        }

        setEduErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleBasicSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validateBasic()) return

        setSaving(true)
        setServerError('')
        setSuccess('')

        try {
            const res = await fetch('/api/application/basic-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(basicForm),
            })
            const json = await res.json()

            if (!json.success) {
                setServerError(json.error ?? 'Failed to save')
                return
            }

            setSuccess('Basic details saved successfully.')
            // Advance step
            setStep(2)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch {
            setServerError('Network error. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    async function handleEduSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validateEdu()) return

        setSaving(true)
        setServerError('')
        setSuccess('')

        try {
            const res = await fetch('/api/application/education-work-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eduForm),
            })
            const json = await res.json()

            if (!json.success) {
                setServerError(json.error ?? 'Failed to save')
                return
            }

            setSuccess('Application completed and saved successfully!')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            setTimeout(() => {
                router.push('/dashboard')
            }, 1500);
        } catch {
            setServerError('Network error. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
            {/* Nav */}
            <header
                className="border-b px-6 py-4 flex items-center justify-between"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: 'var(--brand-primary)' }}
                    >
                        M
                    </div>
                    <span className="font-semibold text-[var(--text-primary)]">Online Manipal</span>
                </div>
                <div className="flex items-center gap-4">
                    {identity.application_number && (
                        <span className="text-sm font-medium text-[var(--text-secondary)] hidden sm:block">
                            Application No: <span className="font-mono text-[var(--text-primary)]">{identity.application_number}</span>
                        </span>
                    )}
                    <Link href="/dashboard" className="text-sm text-[var(--brand-primary)] font-medium hover:underline">
                        ← Dashboard
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-10">
                {/* Step Indicator */}
                <div className="mb-8 flex items-center gap-4 border-b border-[var(--border)] pb-4">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'opacity-100' : 'opacity-60 cursor-pointer'}`} onClick={() => setStep(1)}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-[var(--brand-primary)] text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                        <span className={`text-sm font-semibold ${step === 1 ? 'text-[var(--brand-primary)]' : 'text-gray-600'}`}>Basic Details</span>
                    </div>
                    <div className="h-px bg-[var(--border)] flex-grow" />
                    <div className={`flex items-center gap-2 ${step === 2 ? 'opacity-100' : 'opacity-60 cursor-pointer'}`} onClick={() => setStep(2)}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-[var(--brand-primary)] text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                        <span className={`text-sm font-semibold ${step === 2 ? 'text-[var(--brand-primary)]' : 'text-gray-600'}`}>Education & Work</span>
                    </div>
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        {step === 1 ? 'Basic Details' : 'Education & Work Details'}
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Please fill in all required fields accurately as per your valid documents.
                    </p>
                </div>

                {success && <Alert variant="success" className="mb-6">{success}</Alert>}
                {serverError && <Alert variant="error" className="mb-6">{serverError}</Alert>}

                {step === 1 && (
                    <form onSubmit={handleBasicSubmit} className="flex flex-col gap-6">
                        {/* Personal Details */}
                        <Card>
                            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5 pb-3 border-b border-[var(--border)]">
                                Personal Identity (Locked)
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-70 cursor-not-allowed">
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Full Name"
                                        value={identity.full_name}
                                        disabled
                                        readOnly
                                    />
                                </div>
                                <Input
                                    label="Email Address"
                                    type="email"
                                    value={identity.email}
                                    disabled
                                    readOnly
                                />
                                <Input
                                    label="Applied Course"
                                    value={identity.course_name}
                                    disabled
                                    readOnly
                                />
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5 pb-3 border-b border-[var(--border)]">
                                Additional Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[var(--text-primary)]">
                                        Gender <span className="text-[var(--error)]">*</span>
                                    </label>
                                    <select
                                        value={basicForm.gender}
                                        onChange={(e) => updateBasic('gender', e.target.value)}
                                        className={[
                                            'w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white transition-colors',
                                            'focus:outline-none focus:ring-2',
                                            basicErrors.gender
                                                ? 'border-[var(--error)] focus:ring-red-100'
                                                : 'border-[var(--border)] focus:border-[var(--brand-primary)] focus:ring-blue-100',
                                            !basicForm.gender ? 'text-[var(--text-muted)]' : '',
                                        ].join(' ')}
                                    >
                                        <option value="">Select gender</option>
                                        {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                                    </select>
                                    {basicErrors.gender && <p className="text-xs text-[var(--error)] mt-0.5">{basicErrors.gender}</p>}
                                </div>

                                <Input
                                    label="Date of Birth"
                                    type="date"
                                    value={basicForm.date_of_birth}
                                    onChange={(e) => updateBasic('date_of_birth', e.target.value)}
                                    error={basicErrors.date_of_birth}
                                    required
                                />

                                <Input
                                    label="Nationality"
                                    placeholder="e.g. Indian"
                                    value={basicForm.nationality}
                                    onChange={(e) => updateBasic('nationality', e.target.value)}
                                    error={basicErrors.nationality}
                                    required
                                />
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5 pb-3 border-b border-[var(--border)]">
                                Contact Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="opacity-70 cursor-not-allowed">
                                    <Input
                                        label="Primary Mobile Number (Locked)"
                                        type="tel"
                                        value={identity.phone}
                                        disabled
                                        readOnly
                                    />
                                </div>
                                <Input
                                    label="Alternate Mobile"
                                    type="tel"
                                    placeholder="Optional"
                                    value={basicForm.alternate_mobile_number}
                                    onChange={(e) => updateBasic('alternate_mobile_number', e.target.value)}
                                    error={basicErrors.alternate_mobile_number}
                                />
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Alternate Email"
                                        type="email"
                                        placeholder="Optional"
                                        value={basicForm.alternate_email}
                                        onChange={(e) => updateBasic('alternate_email', e.target.value)}
                                        error={basicErrors.alternate_email}
                                    />
                                </div>
                            </div>

                        </Card>

                        <Card>
                            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5 pb-3 border-b border-[var(--border)]">
                                Address Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Address"
                                        placeholder="Flat/house no., street, locality"
                                        value={basicForm.address_line}
                                        onChange={(e) => updateBasic('address_line', e.target.value)}
                                        error={basicErrors.address_line}
                                        required
                                    />
                                </div>
                                <Input
                                    label="Country"
                                    placeholder="Country"
                                    value={basicForm.country}
                                    onChange={(e) => updateBasic('country', e.target.value)}
                                    error={basicErrors.country}
                                    required
                                />
                                <Input
                                    label="State / Province"
                                    placeholder="State"
                                    value={basicForm.state}
                                    onChange={(e) => updateBasic('state', e.target.value)}
                                    error={basicErrors.state}
                                    required
                                />
                                <Input
                                    label="City"
                                    placeholder="City"
                                    value={basicForm.city}
                                    onChange={(e) => updateBasic('city', e.target.value)}
                                    error={basicErrors.city}
                                    required
                                />
                                <Input
                                    label="Pincode / ZIP"
                                    placeholder="Pincode"
                                    value={basicForm.pincode}
                                    onChange={(e) => updateBasic('pincode', e.target.value)}
                                    error={basicErrors.pincode}
                                    required
                                />
                            </div>
                        </Card>

                        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
                            <Link href="/dashboard">
                                <Button type="button" variant="secondary" size="lg">
                                    Save for later
                                </Button>
                            </Link>
                            <Button type="submit" size="lg" loading={saving}>
                                Next Step
                            </Button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleEduSubmit} className="flex flex-col gap-6">
                        <Card>
                            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5 pb-3 border-b border-[var(--border)]">
                                Highest Qualification
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-[var(--text-primary)]">
                                            Qualification Level <span className="text-[var(--error)]">*</span>
                                        </label>
                                        <select
                                            value={eduForm.highest_qualification}
                                            onChange={(e) => updateEdu('highest_qualification', e.target.value)}
                                            className={[
                                                'w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white transition-colors',
                                                'focus:outline-none focus:ring-2',
                                                eduErrors.highest_qualification
                                                    ? 'border-[var(--error)] focus:ring-red-100'
                                                    : 'border-[var(--border)] focus:border-[var(--brand-primary)] focus:ring-blue-100',
                                                !eduForm.highest_qualification ? 'text-[var(--text-muted)]' : '',
                                            ].join(' ')}
                                        >
                                            <option value="">Select qualification</option>
                                            <option value="high_school">12th / High School / Equivalent</option>
                                            <option value="diploma">Diploma</option>
                                            <option value="bachelors">Bachelor&apos;s Degree</option>
                                            <option value="masters">Master&apos;s Degree</option>
                                            <option value="doctorate">Doctorate / PhD</option>
                                        </select>
                                        {eduErrors.highest_qualification && <p className="text-xs text-[var(--error)] mt-0.5">{eduErrors.highest_qualification}</p>}
                                    </div>
                                </div>

                                <Input
                                    label="Institution Name"
                                    placeholder="University or College"
                                    value={eduForm.institution_name}
                                    onChange={(e) => updateEdu('institution_name', e.target.value)}
                                    error={eduErrors.institution_name}
                                    required
                                />
                                <Input
                                    label="Specialization / Degree"
                                    placeholder="e.g. B.Tech Computer Science"
                                    value={eduForm.specialization}
                                    onChange={(e) => updateEdu('specialization', e.target.value)}
                                    error={eduErrors.specialization}
                                    required
                                />
                                <Input
                                    label="Graduation Year"
                                    placeholder="YYYY"
                                    value={eduForm.graduation_year}
                                    onChange={(e) => updateEdu('graduation_year', e.target.value)}
                                    error={eduErrors.graduation_year}
                                    required
                                />
                                <Input
                                    label="Percentage / CGPA"
                                    placeholder="e.g. 85% or 8.5"
                                    value={eduForm.percentage_or_cgpa}
                                    onChange={(e) => updateEdu('percentage_or_cgpa', e.target.value)}
                                    error={eduErrors.percentage_or_cgpa}
                                    required
                                />
                            </div>
                        </Card>

                        <Card>
                            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border)]">
                                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                    Work Experience
                                </h2>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={eduForm.is_work_experience}
                                        onChange={(e) => updateEdu('is_work_experience', e.target.checked)}
                                        className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                                    />
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">I have work experience</span>
                                </label>
                            </div>

                            {eduForm.is_work_experience ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-[var(--text-primary)]">
                                            Years of Experience <span className="text-[var(--error)]">*</span>
                                        </label>
                                        <select
                                            value={eduForm.work_experience_years}
                                            onChange={(e) => updateEdu('work_experience_years', e.target.value)}
                                            className={[
                                                'w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white transition-colors',
                                                'focus:outline-none focus:ring-2',
                                                eduErrors.work_experience_years
                                                    ? 'border-[var(--error)] focus:ring-red-100'
                                                    : 'border-[var(--border)] focus:border-[var(--brand-primary)] focus:ring-blue-100',
                                                !eduForm.work_experience_years ? 'text-[var(--text-muted)]' : '',
                                            ].join(' ')}
                                        >
                                            <option value="">Select years</option>
                                            <option value="<1">Less than 1 year</option>
                                            <option value="1-3">1 to 3 years</option>
                                            <option value="3-5">3 to 5 years</option>
                                            <option value="5-10">5 to 10 years</option>
                                            <option value="10+">10+ years</option>
                                        </select>
                                        {eduErrors.work_experience_years && <p className="text-xs text-[var(--error)] mt-0.5">{eduErrors.work_experience_years}</p>}
                                    </div>

                                    <Input
                                        label="Current / Last Company"
                                        placeholder="Company name"
                                        value={eduForm.current_company || ''}
                                        onChange={(e) => updateEdu('current_company', e.target.value)}
                                        error={eduErrors.current_company}
                                        required
                                    />

                                    <div className="sm:col-span-2">
                                        <Input
                                            label="Designation / Role"
                                            placeholder="e.g. Software Engineer"
                                            value={eduForm.current_designation || ''}
                                            onChange={(e) => updateEdu('current_designation', e.target.value)}
                                            error={eduErrors.current_designation}
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)]">
                                    No work experience selected. If you have work experience, please check the box above.
                                </p>
                            )}
                        </Card>

                        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
                            <Button type="button" variant="secondary" size="lg" onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                                Back
                            </Button>
                            <Button type="submit" size="lg" loading={saving}>
                                Complete Application
                            </Button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    )
}
