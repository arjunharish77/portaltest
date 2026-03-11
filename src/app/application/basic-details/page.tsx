'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageUser {
    full_name: string
    email: string
    phone: string
    course_name: string
    application_number: string | null
    basic_details_status: string | null
    application_fee_status: string | null
    current_step: string
}

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function BasicDetailsPage() {
    const router = useRouter()

    const [pageUser, setPageUser] = useState<PageUser | null>(null)
    const [form, setForm] = useState<BasicForm>(EMPTY)
    const [errors, setErrors] = useState<Partial<BasicForm>>({})

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [paying, setPaying] = useState(false)

    // Controls whether the Application Fee block is shown
    const [showFeeBlock, setShowFeeBlock] = useState(false)

    const [success, setSuccess] = useState('')
    const [serverError, setServerError] = useState('')

    useEffect(() => {
        async function load() {
            const res = await fetch('/api/application/basic-details')
            if (res.status === 401) { router.replace('/login'); return }
            const json = await res.json()
            if (!json.success) { router.replace('/login'); return }

            const u = json.data?.user
            const d = json.data?.details

            if (u) setPageUser(u)

            // If already past basic details save, show fee block immediately
            if (u?.basic_details_status === 'completed' || u?.application_fee_status === 'success') {
                setShowFeeBlock(true)
            }

            if (d) {
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
            setLoading(false)
        }
        load()
    }, [router])

    // ── Form handlers ──────────────────────────────────────────────────────────

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
            setShowFeeBlock(true)          // ← reveal fee block on same page
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
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
            if (!json.success) { setServerError(json.error ?? 'Payment failed'); setPaying(false); return }
            router.push('/dashboard')
        } catch {
            setServerError('Network error during payment.')
            setPaying(false)
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                <Spinner size="lg" />
            </div>
        )
    }

    const appFeeAlreadyPaid = pageUser?.application_fee_status === 'success'

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
                    {pageUser?.application_number && (
                        <span className="text-sm text-[var(--text-muted)] hidden sm:block">
                            App: <span className="font-mono font-semibold text-[var(--text-primary)]">{pageUser.application_number}</span>
                        </span>
                    )}
                    <Link href="/dashboard" className="text-sm text-[var(--brand-primary)] font-medium hover:underline">← Dashboard</Link>
                </div>
            </header>

            {/* Stepper */}
            <div className="border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-6 overflow-x-auto text-xs">
                    {[
                        { label: 'Basic Details & Application Fee', active: true },
                        { label: 'Admission Fee / Education', active: false },
                        { label: 'Document Upload', active: false },
                    ].map((s, i) => (
                        <div key={i} className={`flex items-center gap-2 shrink-0 ${s.active ? 'text-[var(--brand-primary)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${s.active ? 'text-white' : 'bg-gray-200 text-gray-500'}`}
                                style={s.active ? { background: 'var(--brand-primary)' } : {}}>
                                {i + 1}
                            </div>
                            {s.label}
                            {i < 2 && <span className="text-[var(--border)] ml-2">›</span>}
                        </div>
                    ))}
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
                {success && <Alert variant="success">{success}</Alert>}
                {serverError && <Alert variant="error">{serverError}</Alert>}

                <form onSubmit={handleSave} className="flex flex-col gap-6">
                    {/* Personal Identity (locked) */}
                    <Card>
                        <div className="px-1 pb-4 mb-4 border-b border-[var(--border)]">
                            <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                Basic Details
                            </h2>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mb-4">Auto-filled from registration. Non-editable.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-60 pointer-events-none">
                            <div className="sm:col-span-2">
                                <Input label="Full Name" value={pageUser?.full_name ?? ''} disabled readOnly />
                            </div>
                            <Input label="Email Address" value={pageUser?.email ?? ''} disabled readOnly />
                            <Input label="Mobile Number" value={pageUser?.phone ?? ''} disabled readOnly />
                            <div className="sm:col-span-2">
                                <Input label="Applied Programme" value={pageUser?.course_name ?? ''} disabled readOnly />
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Personal Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[var(--text-primary)]">
                                        Gender <span className="text-[var(--error)]">*</span>
                                    </label>
                                    <select
                                        value={form.gender}
                                        onChange={e => update('gender', e.target.value)}
                                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 ${errors.gender ? 'border-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--brand-primary)]'}`}
                                    >
                                        <option value="">Select gender</option>
                                        {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                    </select>
                                    {errors.gender && <p className="text-xs text-[var(--error)]">{errors.gender}</p>}
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

                    {/* Address */}
                    <Card>
                        <div className="pb-4 mb-4 border-b border-[var(--border)]">
                            <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                Address Details
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    {/* Eligibility Criteria */}
                    <Card>
                        <div className="pb-4 mb-4 border-b border-[var(--border)]">
                            <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                Eligibility Criteria
                            </h2>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            <p className="font-semibold mb-1">General Eligibility</p>
                            <ul className="list-disc pl-4 space-y-1 text-xs">
                                <li>Must have passed 10+2 or equivalent examination</li>
                                <li>Minimum aggregate: 50% marks in qualifying examination</li>
                                <li>Must be a citizen of India or eligible NRI/OCI</li>
                            </ul>
                        </div>
                        <div className="mt-3 flex items-start gap-2">
                            <input type="checkbox" id="elig" required className="mt-0.5 w-4 h-4 rounded" />
                            <label htmlFor="elig" className="text-sm text-[var(--text-primary)]">
                                I confirm that I meet the eligibility criteria for the selected programme.
                            </label>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/dashboard">
                            <Button type="button" variant="secondary">Save for later</Button>
                        </Link>
                        <Button type="submit" loading={saving}>Save & Continue</Button>
                    </div>
                </form>

                {/* Application Fee Block — revealed only after save */}
                {showFeeBlock && (
                    <Card>
                        <div className="pb-4 mb-5 border-b border-[var(--border)]">
                            <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                Application Fee
                            </h2>
                        </div>
                        {appFeeAlreadyPaid ? (
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">✓</div>
                                <div>
                                    <p className="font-semibold text-green-700">Application Fee Paid</p>
                                    <p className="text-sm text-green-600">₹500 — Payment successful</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        A non-refundable application fee of{' '}
                                        <span className="text-2xl font-bold text-[var(--text-primary)]">₹500</span>{' '}
                                        is required to proceed.
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        This is a mock payment. No real transaction will occur.
                                    </p>
                                </div>
                                <Button onClick={handlePayFee} loading={paying} size="lg">
                                    Pay ₹500 Now
                                </Button>
                            </div>
                        )}
                    </Card>
                )}
            </main>
        </div>
    )
}
