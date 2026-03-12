'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import type { DashboardData } from '@/types/application'

interface BasicForm {
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

const EMPTY: BasicForm = {
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

const GENDERS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

import type { Variants } from 'framer-motion'

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function BasicDetailsPage() {
    const router = useRouter()

    const [appState, setAppState] = useState<DashboardData | null>(null)
    const [form, setForm] = useState<BasicForm>(EMPTY)
    const [errors, setErrors] = useState<Partial<BasicForm>>({})

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [paying, setPaying] = useState(false)

    const [showFeeBlock, setShowFeeBlock] = useState(false)
    const [success, setSuccess] = useState('')
    const [serverError, setServerError] = useState('')

    // Prefetch specific next steps
    useEffect(() => {
        router.prefetch('/dashboard')
        router.prefetch('/application/admission-fee')
    }, [router])

    useEffect(() => {
        async function load() {
            try {
                // Fetch core state from dashboard API (compact)
                const dashRes = await fetch('/api/application/dashboard')
                if (dashRes.status === 401) { router.replace('/login'); return }
                const dashJson = await dashRes.json()

                if (dashJson.success) {
                    setAppState(dashJson.data)
                    const app = dashJson.data.application
                    if (app?.basic_details_status === 'completed' || app?.application_fee_status === 'success') {
                        setShowFeeBlock(true)
                    }
                }

                // Fetch basic details
                const detailRes = await fetch('/api/application/basic-details')
                const detailJson = await detailRes.json()
                if (detailJson.success && detailJson.data?.details) {
                    const d = detailJson.data.details
                    setForm({
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
            } catch {
                setServerError('Failed to load form details')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [router])

    function update(field: keyof BasicForm, value: string) {
        setForm(p => ({ ...p, [field]: value }))
        setErrors(p => ({ ...p, [field]: '' }))
        setSuccess('')
        setServerError('')
    }

    function validate(): boolean {
        const e: Partial<BasicForm> = {}
        if (!form.gender) e.gender = 'Required'
        if (!form.date_of_birth) e.date_of_birth = 'Required'
        if (!form.country.trim()) e.country = 'Required'
        if (!form.state.trim()) e.state = 'Required'
        if (!form.city.trim()) e.city = 'Required'
        if (!form.pincode.trim()) e.pincode = 'Required'
        if (!form.address_line.trim()) e.address_line = 'Required'
        if (!form.nationality.trim()) e.nationality = 'Required'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return
        setSaving(true)
        setServerError('')
        setSuccess('')
        try {
            const res = await fetch('/api/application/basic-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (!json.success) { setServerError(json.error ?? 'Failed to save'); return }

            setSuccess('Basic details saved.')
            setShowFeeBlock(true)

            // smooth scroll to fee block
            setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
            }, 100)
        } catch {
            setServerError('Network error. Try again.')
        } finally {
            setSaving(false)
        }
    }

    async function handlePayFee() {
        setPaying(true)
        setServerError('')
        try {
            const res = await fetch('/api/payment/application-fee', { method: 'POST' })
            const json = await res.json()

            if (!json.success) {
                setServerError(json.error ?? 'Payment failed')
                setPaying(false)
                return
            }

            // Success -> immediately router push without waiting to clear paying state
            router.push('/dashboard')
        } catch {
            setServerError('Network error during payment.')
            setPaying(false)
        }
    }

    if (loading) {
        return (
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
    }

    const appFeeAlreadyPaid = appState?.application?.application_fee_status === 'success'

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
                    {appState?.application?.application_number && (
                        <span className="text-sm text-[var(--text-muted)] hidden sm:block">
                            App: <span className="font-mono font-semibold text-[var(--text-primary)]">{appState.application.application_number}</span>
                        </span>
                    )}
                    <Link href="/dashboard" className="text-sm text-[var(--brand-primary)] font-medium hover:underline">← Dashboard</Link>
                </div>
            </header>

            {/* Lean Progress Stepper */}
            <div className="border-b bg-white/50 backdrop-blur-sm" style={{ borderColor: 'var(--border)' }}>
                <div className="max-w-4xl mx-auto px-6 py-3">
                    <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-[var(--brand-primary)] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white text-[10px] flex items-center justify-center">1</span>
                            Basic Details
                        </span>
                        <span className="text-gray-300">›</span>
                        <span className="text-gray-400">Split Journey</span>
                        <span className="text-gray-300">›</span>
                        <span className="text-gray-400">Docs Upload</span>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
                    <AnimatePresence>
                        {success && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <Alert variant="success">{success}</Alert>
                            </motion.div>
                        )}
                        {serverError && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <Alert variant="error">{serverError}</Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSave} className="flex flex-col gap-6">
                        {/* Personal Identity (locked) */}
                        <motion.div variants={itemVariants}>
                            <Card className="shadow-sm border-0 ring-1 ring-black/5">
                                <div className="px-1 pb-4 mb-4 border-b border-[var(--border)]">
                                    <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                        Basic Details
                                    </h2>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mb-4">Auto-filled from registration. Non-editable.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-60 pointer-events-none">
                                    <div className="sm:col-span-2">
                                        <Input label="Full Name" value={appState?.user?.full_name ?? ''} disabled readOnly />
                                    </div>
                                    <Input label="Email Address" value={appState?.user?.email ?? ''} disabled readOnly />
                                    <Input label="Mobile Number" value={appState?.user?.phone ?? ''} disabled readOnly />
                                    <div className="sm:col-span-2">
                                        <Input label="Applied Programme" value={appState?.user?.course_name ?? ''} disabled readOnly />
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                                    <p className="text-sm font-semibold text-[var(--text-secondary)] mb-4">Personal Details</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-[var(--text-primary)]">
                                                Gender <span className="text-[var(--error)]">*</span>
                                            </label>
                                            <select
                                                value={form.gender}
                                                onChange={e => update('gender', e.target.value)}
                                                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 ${errors.gender ? 'border-[var(--error)] focus:ring-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)] focus:ring-opacity-20'}`}
                                            >
                                                <option value="">Select gender</option>
                                                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                            </select>
                                            {errors.gender && <p className="text-xs text-[var(--error)] mt-1">{errors.gender}</p>}
                                        </div>
                                        <Input label="Date of Birth" type="date" value={form.date_of_birth}
                                            onChange={e => update('date_of_birth', e.target.value)} error={errors.date_of_birth} required />
                                        <Input label="Nationality" placeholder="e.g. Indian" value={form.nationality}
                                            onChange={e => update('nationality', e.target.value)} error={errors.nationality} required />
                                        <Input label="Alternate Mobile" type="tel" placeholder="Optional"
                                            value={form.alternate_mobile_number} onChange={e => update('alternate_mobile_number', e.target.value)} />
                                        <div className="sm:col-span-2">
                                            <Input label="Alternate Email" type="email" placeholder="Optional"
                                                value={form.alternate_email} onChange={e => update('alternate_email', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Address */}
                        <motion.div variants={itemVariants}>
                            <Card className="shadow-sm border-0 ring-1 ring-black/5">
                                <div className="pb-4 mb-4 border-b border-[var(--border)]">
                                    <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                        Address Details
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="sm:col-span-2">
                                        <Input label="Address Line" placeholder="Flat/house no., street, locality"
                                            value={form.address_line} onChange={e => update('address_line', e.target.value)}
                                            error={errors.address_line} required />
                                    </div>
                                    <Input label="Country" value={form.country} onChange={e => update('country', e.target.value)} error={errors.country} required />
                                    <Input label="State / Province" placeholder="State" value={form.state} onChange={e => update('state', e.target.value)} error={errors.state} required />
                                    <Input label="City" placeholder="City" value={form.city} onChange={e => update('city', e.target.value)} error={errors.city} required />
                                    <Input label="Pincode / ZIP" placeholder="Pincode" value={form.pincode} onChange={e => update('pincode', e.target.value)} error={errors.pincode} required />
                                </div>
                            </Card>
                        </motion.div>

                        {/* Eligibility Criteria */}
                        <motion.div variants={itemVariants}>
                            <Card className="shadow-sm border-0 ring-1 ring-black/5">
                                <div className="pb-4 mb-4 border-b border-[var(--border)]">
                                    <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                        Eligibility Criteria
                                    </h2>
                                </div>
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 shadow-sm">
                                    <p className="font-semibold mb-2">General Eligibility</p>
                                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                                        <li>Must have passed 10+2 or equivalent examination</li>
                                        <li>Minimum aggregate: 50% marks in qualifying examination</li>
                                        <li>Must be a citizen of India or eligible NRI/OCI</li>
                                    </ul>
                                </div>
                                <div className="mt-4 flex items-start gap-3 p-2">
                                    <input type="checkbox" id="elig" required className="mt-1 w-4 h-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] transition-colors" />
                                    <label htmlFor="elig" className="text-sm text-[var(--text-primary)] cursor-pointer select-none">
                                        I confirm that I meet the eligibility criteria for the selected programme.
                                    </label>
                                </div>
                            </Card>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex justify-end gap-3 sticky bottom-4 z-10 p-4 bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-lg ring-1 ring-black/5">
                            <Link href="/dashboard" prefetch={true}>
                                <Button type="button" variant="secondary" className="shadow-sm bg-gray-50 border-gray-200">Save for later</Button>
                            </Link>
                            <Button type="submit" loading={saving} className="shadow-sm">Save & Continue</Button>
                        </motion.div>
                    </form>

                    {/* Application Fee Block — revealed only after save */}
                    <AnimatePresence>
                        {showFeeBlock && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className="mt-2"
                            >
                                <Card className="shadow-md border-0 ring-1 ring-brand-primary/30 bg-brand-primary/[0.01]">
                                    <div className="pb-4 mb-5 border-b border-[var(--border)]">
                                        <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                            Application Fee
                                        </h2>
                                    </div>
                                    {appFeeAlreadyPaid ? (
                                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                                            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xl shadow-sm">✓</div>
                                            <div>
                                                <p className="font-semibold text-green-700">Application Fee Paid</p>
                                                <p className="text-sm text-green-600">₹500 — Payment successful</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-2">
                                            <div>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    A non-refundable application fee of{' '}
                                                    <span className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">₹500</span>{' '}
                                                    is required to proceed.
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                    This is a mock payment. No real transaction will occur.
                                                </p>
                                            </div>
                                            <Button onClick={handlePayFee} loading={paying} size="lg" className="w-full sm:w-auto shadow-md">
                                                Pay ₹500 Now
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>
        </div>
    )
}
