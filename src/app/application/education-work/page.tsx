'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

import type { Variants } from 'framer-motion'

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

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
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

    // Prefetch next route
    useEffect(() => {
        router.prefetch('/application/document-upload')
    }, [router])

    useEffect(() => {
        async function load() {
            try {
                // First get the core dashboard state for meta
                const dashRes = await fetch('/api/application/dashboard')
                if (dashRes.status === 401) { router.replace('/login'); return }
                const dashJson = await dashRes.json()

                if (!dashJson.success) {
                    router.replace('/dashboard')
                    return
                }

                const u = dashJson.data.user
                const a = dashJson.data.application
                setMeta({
                    full_name: u?.full_name ?? '',
                    application_number: a?.application_number ?? null,
                    applied_course: a?.applied_course || u?.course_name || null
                })

                // Then get just the education details
                const res = await fetch('/api/application/education-work-details')
                const json = await res.json()

                if (json.success && json.data?.details) {
                    const d = json.data.details
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
            } catch {
                setServerError('Failed to load details.')
            } finally {
                setLoading(false)
            }
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
            if (!json.success) { setServerError(json.error ?? 'Failed to save'); setSaving(false); return }

            // Optimistic navigation
            router.push('/application/document-upload')
        } catch {
            setServerError('Network error. Try again.')
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
            <header className="border-b px-6 py-4 flex items-center justify-between bg-white bg-opacity-80 backdrop-blur-md sticky top-0 z-10 border-[var(--border)]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
                <Card><div className="h-48 bg-gray-100 rounded animate-pulse"></div></Card>
                <Card><div className="h-48 bg-gray-100 rounded animate-pulse"></div></Card>
            </main>
        </div>
    )

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
            {/* Header */}
            <header className="border-b px-6 py-4 flex items-center justify-between bg-white bg-opacity-80 backdrop-blur-md sticky top-0 z-10 border-[var(--border)] transition-all">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
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
            <div className="border-b bg-white/50 backdrop-blur-sm" style={{ borderColor: 'var(--border)' }}>
                <div className="max-w-4xl mx-auto px-6 py-3">
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400 flex items-center gap-2 cursor-pointer hover:text-gray-600 transition-colors" onClick={() => router.push('/application/basic-details')}>
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center">✓</span>
                            Basic Details
                        </span>
                        <span className="text-gray-300">›</span>
                        <span className="font-semibold text-[var(--brand-primary)] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white text-[10px] flex items-center justify-center shadow-sm">2</span>
                            Education & Work
                        </span>
                        <span className="text-gray-300">›</span>
                        <span className="text-gray-400">Docs Upload</span>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <motion.div variants={containerVariants} initial="hidden" animate="show">
                    <motion.div variants={itemVariants} className="mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Education &amp; Work Details</h1>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Fill in your academic and work history for <span className="font-semibold text-[var(--text-primary)]">{meta.applied_course ?? 'your programme'}</span>.
                        </p>
                    </motion.div>

                    <AnimatePresence>
                        {serverError && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                                <Alert variant="error">{serverError}</Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSave} className="flex flex-col gap-6">
                        {/* Education Details */}
                        <motion.div variants={itemVariants}>
                            <Card className="shadow-sm border-0 ring-1 ring-black/5 overflow-hidden">
                                <div className="pb-4 mb-5 border-b border-[var(--border)]">
                                    <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                        Education Details
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
                                    {/* Highest Qualification */}
                                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-[var(--text-primary)]">
                                            Highest Qualification <span className="text-[var(--error)]">*</span>
                                        </label>
                                        <select
                                            value={form.highest_qualification}
                                            onChange={e => update('highest_qualification', e.target.value)}
                                            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 shadow-sm
                                                ${errors.highest_qualification ? 'border-[var(--error)] ring-[var(--error)]/20' : 'border-[var(--border)] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20'}`}
                                        >
                                            <option value="">Select qualification</option>
                                            {QUALIFICATIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                                        </select>
                                        {errors.highest_qualification && <p className="text-xs text-[var(--error)] animate-in slide-in-from-top-1">{errors.highest_qualification}</p>}
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
                        </motion.div>

                        {/* Work Experience */}
                        <motion.div variants={itemVariants}>
                            <Card className="shadow-sm border-0 ring-1 ring-black/5 overflow-hidden">
                                <div className="pb-4 mb-5 border-b border-[var(--border)] flex justify-between items-center">
                                    <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                        Work Experience
                                    </h2>
                                </div>

                                <label className="flex items-center gap-3 mb-2 p-3 rounded-lg border border-[var(--border)] hover:bg-gray-50/50 cursor-pointer transition-colors w-fit">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            id="has_work"
                                            checked={form.is_work_experience}
                                            onChange={e => update('is_work_experience', e.target.checked)}
                                            className="peer w-5 h-5 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20 cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-[var(--text-primary)] select-none">
                                        I have work experience
                                    </span>
                                </label>

                                <AnimatePresence initial={false}>
                                    {form.is_work_experience && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] shadow-inner">
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
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex justify-end gap-3 mt-4 pt-6 border-t border-[var(--border)]">
                            <Link href="/dashboard">
                                <Button type="button" variant="secondary" className="shadow-sm">Save Draft</Button>
                            </Link>
                            <Button type="submit" loading={saving} className="shadow-sm px-6">
                                Save &amp; Proceed
                            </Button>
                        </motion.div>
                    </form>
                </motion.div>
            </main>
        </div>
    )
}
