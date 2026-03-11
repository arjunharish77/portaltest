'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

// ── Types matching actual DB columns ─────────────────────────────────────────

interface EduForm {
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

const EMPTY: EduForm = {
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

const QUALIFICATIONS = [
    { value: '10th', label: '10th Standard' },
    { value: '12th', label: '12th Standard / PUC' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'ug', label: "Under Graduate (B.A / B.Sc / B.Com / B.E etc.)" },
    { value: 'pg', label: "Post Graduate (M.A / M.Sc / M.Com / M.E etc.)" },
]

interface PageMeta {
    full_name: string
    application_number: string | null
    applied_course: string | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EducationWorkPage() {
    const router = useRouter()
    const [meta, setMeta] = useState<PageMeta>({ full_name: '', application_number: null, applied_course: null })
    const [form, setForm] = useState<EduForm>(EMPTY)
    const [errors, setErrors] = useState<Partial<Record<keyof EduForm, string>>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [serverError, setServerError] = useState('')

    useEffect(() => {
        async function load() {
            const res = await fetch('/api/application/education-work-details')
            if (res.status === 401) { router.replace('/login'); return }
            const json = await res.json()
            if (!json.success) return
            const u = json.data?.user
            if (u) setMeta({ full_name: u.full_name, application_number: u.application_number, applied_course: u.applied_course })
            const d = json.data?.details
            if (d) {
                setForm({
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
        load()
    }, [router])

    function update<K extends keyof EduForm>(field: K, value: EduForm[K]) {
        setForm(p => ({ ...p, [field]: value }))
        setErrors(p => ({ ...p, [field]: undefined }))
        setServerError('')
    }

    function validate(): boolean {
        const e: Partial<Record<keyof EduForm, string>> = {}
        if (!form.highest_qualification) e.highest_qualification = 'Required'
        if (!form.institution_name.trim()) e.institution_name = 'Required'
        if (!form.specialization.trim()) e.specialization = 'Required'
        if (!form.graduation_year.match(/^\d{4}$/)) e.graduation_year = 'Enter a valid 4-digit year'
        if (!form.percentage_or_cgpa.trim()) e.percentage_or_cgpa = 'Required'
        if (form.is_work_experience) {
            if (!form.work_experience_years.trim()) e.work_experience_years = 'Required'
            if (!form.current_company.trim()) e.current_company = 'Required'
            if (!form.current_designation.trim()) e.current_designation = 'Required'
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
        setSaving(true)
        setServerError('')
        try {
            const res = await fetch('/api/application/education-work-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (!json.success) { setServerError(json.error ?? 'Failed to save'); return }
            router.push('/application/document-upload')
        } catch {
            setServerError('Network error. Try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
            <Spinner size="lg" />
        </div>
    )

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
            {/* Header */}
            <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: 'var(--brand-primary)' }}>M</div>
                    <span className="font-semibold text-[var(--text-primary)]">Online Manipal</span>
                </div>
                <div className="flex items-center gap-4">
                    {meta.application_number && (
                        <span className="text-sm text-[var(--text-muted)] hidden sm:block">
                            App: <span className="font-mono font-semibold text-[var(--text-primary)]">{meta.application_number}</span>
                        </span>
                    )}
                    <Link href="/dashboard" className="text-sm text-[var(--brand-primary)] hover:underline font-medium">← Dashboard</Link>
                </div>
            </header>

            {/* Stepper */}
            <div className="border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-6 overflow-x-auto text-xs">
                    {['Basic Details & Application Fee', 'Admission Fee / Education', 'Document Upload'].map((s, i) => (
                        <div key={i} className={`flex items-center gap-2 shrink-0 ${i === 1 ? 'text-[var(--brand-primary)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 1 ? 'text-white' : i === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                                style={i === 1 ? { background: 'var(--brand-primary)' } : {}}>{i === 0 ? '✓' : i + 1}</div>
                            {s}{i < 2 && <span className="text-[var(--border)] ml-2">›</span>}
                        </div>
                    ))}
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Education &amp; Work Details</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Fill in your academic and work history for <span className="font-semibold">{meta.applied_course ?? 'your programme'}</span>.
                    </p>
                </div>

                {serverError && <Alert variant="error" className="mb-6">{serverError}</Alert>}

                <form onSubmit={handleSave} className="flex flex-col gap-6">

                    {/* Education Details */}
                    <Card>
                        <div className="pb-3 mb-4 border-b border-[var(--border)]">
                            <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                Education Details
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Highest Qualification */}
                            <div className="sm:col-span-2 flex flex-col gap-1">
                                <label className="text-sm font-medium text-[var(--text-primary)]">
                                    Highest Qualification <span className="text-[var(--error)]">*</span>
                                </label>
                                <select
                                    value={form.highest_qualification}
                                    onChange={e => update('highest_qualification', e.target.value)}
                                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2
                                        ${errors.highest_qualification ? 'border-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--brand-primary)]'}`}
                                >
                                    <option value="">Select qualification</option>
                                    {QUALIFICATIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                                </select>
                                {errors.highest_qualification && <p className="text-xs text-[var(--error)]">{errors.highest_qualification}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <Input
                                    label="Institution / University Name"
                                    placeholder="e.g. Delhi University, IIT Bombay"
                                    value={form.institution_name}
                                    onChange={e => update('institution_name', e.target.value)}
                                    error={errors.institution_name}
                                    required
                                />
                            </div>

                            <Input
                                label="Specialization / Stream"
                                placeholder="e.g. Commerce, Science, Computer Science"
                                value={form.specialization}
                                onChange={e => update('specialization', e.target.value)}
                                error={errors.specialization}
                                required
                            />

                            <Input
                                label="Year of Passing"
                                placeholder="e.g. 2022"
                                value={form.graduation_year}
                                onChange={e => update('graduation_year', e.target.value)}
                                error={errors.graduation_year}
                                required
                            />

                            <div className="sm:col-span-2">
                                <Input
                                    label="Percentage / CGPA"
                                    placeholder="e.g. 78% or 7.5 CGPA"
                                    value={form.percentage_or_cgpa}
                                    onChange={e => update('percentage_or_cgpa', e.target.value)}
                                    error={errors.percentage_or_cgpa}
                                    required
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Work Experience */}
                    <Card>
                        <div className="pb-3 mb-4 border-b border-[var(--border)]">
                            <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                Work Experience
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="has_work"
                                checked={form.is_work_experience}
                                onChange={e => update('is_work_experience', e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <label htmlFor="has_work" className="text-sm font-medium text-[var(--text-primary)]">
                                I have work experience
                            </label>
                        </div>

                        {form.is_work_experience && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[var(--bg-base)] rounded-lg border border-[var(--border)]">
                                <Input
                                    label="Years of Experience"
                                    placeholder="e.g. 3"
                                    value={form.work_experience_years}
                                    onChange={e => update('work_experience_years', e.target.value)}
                                    error={errors.work_experience_years}
                                    required
                                />
                                <Input
                                    label="Current Company"
                                    placeholder="Company name"
                                    value={form.current_company}
                                    onChange={e => update('current_company', e.target.value)}
                                    error={errors.current_company}
                                    required
                                />
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Current Designation"
                                        placeholder="e.g. Software Engineer, Manager"
                                        value={form.current_designation}
                                        onChange={e => update('current_designation', e.target.value)}
                                        error={errors.current_designation}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/dashboard">
                            <Button type="button" variant="secondary">Save Draft</Button>
                        </Link>
                        <Button type="submit" loading={saving}>
                            Save &amp; Proceed to Documents
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    )
}
