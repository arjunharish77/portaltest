'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
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

import type { Variants } from 'framer-motion'

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function AdmissionFeePage() {
    const router = useRouter()
    const [summary, setSummary] = useState<Summary | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedPlan, setSelectedPlan] = useState<AdmissionFeePlan | null>(null)
    const [paying, setPaying] = useState(false)
    const [error, setError] = useState('')

    // Prefetch specific next steps
    useEffect(() => {
        router.prefetch('/dashboard')
    }, [router])

    useEffect(() => {
        async function load() {
            try {
                // Fetch core state from dashboard API
                const dashRes = await fetch('/api/application/dashboard')
                if (dashRes.status === 401) { router.replace('/login'); return }
                const dashJson = await dashRes.json()

                if (!dashJson.success) {
                    router.replace('/dashboard')
                    return
                }

                const u = dashJson.data.user
                const a = dashJson.data.application

                setSummary({
                    full_name: u?.full_name ?? '',
                    email: u?.email ?? '',
                    phone: u?.phone ?? '',
                    application_number: a?.application_number ?? null,
                    applied_course: a?.applied_course || u?.course_name || null,
                    admission_fee_status: a?.admission_fee_status ?? null,
                    admission_fee_plan: a?.admission_fee_plan ?? null,
                    admission_fee_amount: a?.admission_fee_amount ?? null,
                })
            } catch {
                setError('Failed to load application details')
            } finally {
                setLoading(false)
            }
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

            // Immediate optimistic UI push
            router.push('/dashboard')
        } catch {
            setError('Network error. Try again.')
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
                <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
                    <Card><div className="h-48 bg-gray-100 rounded animate-pulse"></div></Card>
                    <Card><div className="h-48 bg-gray-100 rounded animate-pulse"></div></Card>
                </main>
            </div>
        )
    }

    const alreadyPaid = summary?.admission_fee_status === 'success'

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
                    {summary?.application_number && (
                        <span className="text-sm text-[var(--text-muted)] hidden sm:block">
                            App: <span className="font-mono font-semibold text-[var(--text-primary)]">{summary.application_number}</span>
                        </span>
                    )}
                    <Link href="/dashboard" className="text-sm text-[var(--brand-primary)] font-medium hover:underline">← Dashboard</Link>
                </div>
            </header>

            {/* Stepper */}
            <div className="border-b bg-white/50 backdrop-blur-sm" style={{ borderColor: 'var(--border)' }}>
                <div className="max-w-3xl mx-auto px-6 py-3">
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400 flex items-center gap-2 cursor-pointer hover:text-gray-600 transition-colors" onClick={() => router.push('/application/basic-details')}>
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center">✓</span>
                            Basic Details
                        </span>
                        <span className="text-gray-300">›</span>
                        <span className="font-semibold text-[var(--brand-primary)] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white text-[10px] flex items-center justify-center">2</span>
                            Admission Fee
                        </span>
                        <span className="text-gray-300">›</span>
                        <span className="text-gray-400">Docs Upload</span>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-8">
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
                    <motion.div variants={itemVariants}>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Admission Fee Payment</h1>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">Select a payment plan to secure your admission.</p>
                    </motion.div>

                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <Alert variant="error">{error}</Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Applicant Summary */}
                    <motion.div variants={itemVariants}>
                        <Card className="shadow-sm border-0 ring-1 ring-black/5">
                            <div className="pb-4 mb-4 border-b border-[var(--border)]">
                                <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                    Applicant Summary
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                                {[
                                    { label: 'Full Name', value: summary?.full_name },
                                    { label: 'Mobile Number', value: summary?.phone },
                                    { label: 'Email Address', value: summary?.email },
                                    { label: 'Application No.', value: summary?.application_number ?? '—', mono: true },
                                    { label: 'Applied Programme', value: summary?.applied_course ?? '—' },
                                ].map(r => (
                                    <div key={r.label} className="flex flex-col gap-1">
                                        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">{r.label}</span>
                                        <span className={`text-sm font-semibold text-[var(--text-primary)] ${r.mono ? 'font-mono' : ''}`}>{r.value}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Payment Plans */}
                    <motion.div variants={itemVariants}>
                        <Card className="shadow-sm border-0 ring-1 ring-black/5">
                            <div className="pb-4 mb-5 border-b border-[var(--border)]">
                                <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                    Select Payment Type
                                </h2>
                            </div>

                            {alreadyPaid ? (
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-2xl shadow-sm">✓</div>
                                    <div>
                                        <p className="font-semibold text-green-700 text-lg">Admission Fee Paid</p>
                                        <p className="text-sm text-green-600 mt-0.5">
                                            ₹{(summary?.admission_fee_amount ?? 0).toLocaleString('en-IN')} —{' '}
                                            {summary?.admission_fee_plan === 'semester' ? 'Semester Fee' :
                                                summary?.admission_fee_plan === 'annual' ? 'Annual Fee' : 'Full Course Fee'}
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col gap-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {(Object.entries(ADMISSION_FEE_PLANS) as [AdmissionFeePlan, { label: string; amount: number }][]).map(([plan, info]) => (
                                            <motion.button
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                key={plan}
                                                type="button"
                                                onClick={() => setSelectedPlan(plan)}
                                                className={`relative overflow-hidden flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${selectedPlan === plan
                                                    ? 'border-[var(--brand-primary)] bg-brand-primary/[0.03] shadow-md ring-4 ring-brand-primary/10'
                                                    : 'border-[var(--border)] bg-white hover:border-[var(--brand-primary)] hover:shadow-sm'
                                                    }`}
                                            >
                                                {selectedPlan === plan && (
                                                    <div className="absolute top-0 right-0 p-3">
                                                        <div className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center text-xs shadow-sm">✓</div>
                                                    </div>
                                                )}
                                                <span className={`text-sm font-bold ${selectedPlan === plan ? 'text-[var(--brand-primary)]' : 'text-[var(--text-primary)]'}`}>{info.label}</span>
                                                <span className="text-2xl font-black mt-1 tracking-tight" style={{ color: selectedPlan === plan ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                                                    ₹{info.amount.toLocaleString('en-IN')}
                                                </span>
                                                <span className={`text-xs mt-1 ${selectedPlan === plan ? 'text-brand-primary/70' : 'text-[var(--text-muted)]'}`}>
                                                    {plan === 'semester' ? 'Billed per semester' :
                                                        plan === 'annual' ? 'Billed annually' : 'One-time payment'}
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>

                                    <AnimatePresence>
                                        {selectedPlan && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-4 bg-blue-50/80 border border-blue-100 rounded-xl text-sm flex items-center gap-3 shadow-inner"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">i</div>
                                                <div>
                                                    <span className="font-semibold text-blue-900 block mb-0.5">Selection Summary</span>
                                                    <span className="text-blue-800">
                                                        You have selected the <strong>{ADMISSION_FEE_PLANS[selectedPlan].label}</strong> for{' '}
                                                        <strong>₹{ADMISSION_FEE_PLANS[selectedPlan].amount.toLocaleString('en-IN')}</strong>.
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex gap-3 justify-end mt-2 pt-5 border-t border-[var(--border)]">
                                        <Link href="/dashboard">
                                            <Button type="button" variant="secondary" className="shadow-sm">Cancel</Button>
                                        </Link>
                                        <Button onClick={handlePay} loading={paying} disabled={!selectedPlan} className="shadow-sm px-6">
                                            Pay ₹{selectedPlan ? ADMISSION_FEE_PLANS[selectedPlan].amount.toLocaleString('en-IN') : 'Now'} (Mock)
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {alreadyPaid && (
                                <div className="mt-6 pt-5 border-t border-[var(--border)] flex justify-end">
                                    <Link href="/dashboard"><Button className="shadow-sm">Back to Dashboard</Button></Link>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    )
}
