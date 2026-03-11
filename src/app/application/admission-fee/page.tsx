'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { ADMISSION_FEE_PLANS, type AdmissionFeePlan } from '@/types/application'

interface Summary {
    full_name: string
    email: string
    phone: string
    application_number: string | null
    applied_course: string | null
    admission_fee_status: string | null
    admission_fee_plan: string | null
    admission_fee_amount: number | null
}

export default function AdmissionFeePage() {
    const router = useRouter()
    const [summary, setSummary] = useState<Summary | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedPlan, setSelectedPlan] = useState<AdmissionFeePlan | null>(null)
    const [paying, setPaying] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        async function load() {
            const res = await fetch('/api/payment/admission-fee')
            if (res.status === 401) { router.replace('/login'); return }
            const json = await res.json()
            if (!json.success) { router.replace('/dashboard'); return }
            const u = json.data.user
            const a = json.data.application
            setSummary({
                full_name: u?.full_name ?? '',
                email: u?.email ?? '',
                phone: u?.phone ?? '',
                application_number: a?.application_number ?? null,
                applied_course: a?.applied_course ?? null,
                admission_fee_status: a?.admission_fee_status ?? null,
                admission_fee_plan: a?.admission_fee_plan ?? null,
                admission_fee_amount: a?.admission_fee_amount ?? null,
            })
            setLoading(false)
        }
        load()
    }, [router])

    async function handlePay() {
        if (!selectedPlan) { setError('Please select a payment plan'); return }
        setPaying(true)
        setError('')
        try {
            const res = await fetch('/api/payment/admission-fee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: selectedPlan }),
            })
            const json = await res.json()
            if (!json.success) { setError(json.error ?? 'Payment failed'); setPaying(false); return }
            router.push('/dashboard')
        } catch {
            setError('Network error. Try again.')
            setPaying(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                <Spinner size="lg" />
            </div>
        )
    }

    const alreadyPaid = summary?.admission_fee_status === 'success'

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
                    {summary?.application_number && (
                        <span className="text-sm text-[var(--text-muted)] hidden sm:block">
                            App: <span className="font-mono font-semibold text-[var(--text-primary)]">{summary.application_number}</span>
                        </span>
                    )}
                    <Link href="/dashboard" className="text-sm text-[var(--brand-primary)] font-medium hover:underline">← Dashboard</Link>
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

            <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admission Fee Payment</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Select a payment plan to continue your application.</p>
                </div>

                {error && <Alert variant="error">{error}</Alert>}

                {/* Applicant Summary */}
                <Card>
                    <div className="pb-4 mb-4 border-b border-[var(--border)]">
                        <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                            Applicant Summary
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                        {[
                            { label: 'Full Name', value: summary?.full_name },
                            { label: 'Mobile Number', value: summary?.phone },
                            { label: 'Email Address', value: summary?.email },
                            { label: 'Application No.', value: summary?.application_number ?? '—', mono: true },
                            { label: 'Applied Programme', value: summary?.applied_course ?? '—' },
                        ].map(r => (
                            <div key={r.label} className="flex flex-col gap-0.5">
                                <span className="text-xs text-[var(--text-muted)]">{r.label}</span>
                                <span className={`text-sm font-semibold text-[var(--text-primary)] ${r.mono ? 'font-mono' : ''}`}>{r.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Payment Plans */}
                <Card>
                    <div className="pb-4 mb-4 border-b border-[var(--border)]">
                        <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                            Select Payment Type
                        </h2>
                    </div>

                    {alreadyPaid ? (
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">✓</div>
                            <div>
                                <p className="font-semibold text-green-700">Admission Fee Paid</p>
                                <p className="text-sm text-green-600">
                                    ₹{(summary?.admission_fee_amount ?? 0).toLocaleString('en-IN')} —{' '}
                                    {summary?.admission_fee_plan === 'semester' ? 'Semester Fee' :
                                        summary?.admission_fee_plan === 'annual' ? 'Annual Fee' : 'Full Course Fee'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {(Object.entries(ADMISSION_FEE_PLANS) as [AdmissionFeePlan, { label: string; amount: number }][]).map(([plan, info]) => (
                                    <button
                                        key={plan}
                                        type="button"
                                        onClick={() => setSelectedPlan(plan)}
                                        className={`flex flex-col p-4 rounded-xl border-2 text-left transition-all ${selectedPlan === plan
                                            ? 'border-[var(--brand-primary)] bg-blue-50'
                                            : 'border-[var(--border)] hover:border-[var(--brand-primary)] hover:bg-blue-50/50'
                                            }`}
                                    >
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">{info.label}</span>
                                        <span className="text-2xl font-bold mt-1" style={{ color: 'var(--brand-primary)' }}>
                                            ₹{info.amount.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)] mt-1">
                                            {plan === 'semester' ? 'Billed per semester' :
                                                plan === 'annual' ? 'Billed annually' : 'One-time payment'}
                                        </span>
                                        {selectedPlan === plan && (
                                            <span className="mt-2 text-xs font-bold text-[var(--brand-primary)]">✓ Selected</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {selectedPlan && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                    <span className="font-semibold text-blue-800">Summary: </span>
                                    <span className="text-blue-700">
                                        {ADMISSION_FEE_PLANS[selectedPlan].label} — ₹{ADMISSION_FEE_PLANS[selectedPlan].amount.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end">
                                <Link href="/dashboard">
                                    <Button type="button" variant="secondary">Cancel</Button>
                                </Link>
                                <Button onClick={handlePay} loading={paying} disabled={!selectedPlan}>
                                    Pay Now (Mock)
                                </Button>
                            </div>
                        </div>
                    )}

                    {alreadyPaid && (
                        <div className="mt-4 flex justify-end">
                            <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    )
}
