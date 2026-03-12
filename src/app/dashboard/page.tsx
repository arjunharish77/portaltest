'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import type { DashboardData } from '@/types/application'

const statusColors: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: '#6b7280' },
    application_fee_pending: { label: 'Fee Pending', color: '#d97706' },
    split_journey: { label: 'In Progress', color: '#1a4f9c' },
    document_pending: { label: 'Docs Pending', color: '#7c3aed' },
    in_progress: { label: 'In Progress', color: '#1a4f9c' },
    submitted: { label: 'Submitted', color: '#16a34a' },
    under_review: { label: 'Under Review', color: '#d97706' },
    accepted: { label: 'Accepted', color: '#16a34a' },
    rejected: { label: 'Rejected', color: '#dc2626' },
}

const approvalStatusColors: Record<string, string> = {
    Pending: '#d97706',
    Approved: '#16a34a',
    Rejected: '#dc2626',
}

/** Compute which primary CTA to show based on application state */
function resolveNavigationState(app: DashboardData['application']) {
    if (!app) return { phase: 'start' as const }

    const appFeePaid = app.application_fee_status === 'success'
    const admFeePaid = app.admission_fee_status === 'success'
    const eduDone = app.education_details_status === 'completed'
    const docDone = app.document_upload_status === 'completed'

    if (!appFeePaid) {
        return { phase: 'basic_details' as const, admFeePaid, eduDone, docDone }
    }

    if (!admFeePaid || !docDone) {
        return { phase: 'split_journey' as const, admFeePaid, eduDone, docDone }
    }

    return { phase: 'completed' as const, admFeePaid, eduDone, docDone }
}

// ── Animation Variants ────────────────────────────────────────────────────────
import type { Variants } from 'framer-motion'

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function DashboardPage() {
    const router = useRouter()
    const [data, setData] = useState<DashboardData | null>(null)
    const [error, setError] = useState('')
    const [loggingOut, setLoggingOut] = useState(false)
    const [loading, setLoading] = useState(true)

    // Prefetch key routes
    useEffect(() => {
        router.prefetch('/application/admission-fee')
        router.prefetch('/application/education-work')
        router.prefetch('/application/basic-details')
        router.prefetch('/application/document-upload')
    }, [router])

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/application/dashboard')
                const json = await res.json()
                if (!json.success) {
                    if (res.status === 401) { router.replace('/login'); return }
                    setError(json.error ?? 'Failed to load dashboard')
                } else {
                    setData(json.data)
                }
            } catch {
                setError('Network error loading dashboard.')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [router])

    async function handleLogout() {
        setLoggingOut(true)
        await fetch('/api/auth/logout', { method: 'POST' })
        router.replace('/login')
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
                <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
                    <Card><div className="h-24 w-full bg-gray-100 rounded animate-pulse"></div></Card>
                    <Card><div className="h-40 w-full bg-gray-100 rounded animate-pulse"></div></Card>
                    <Card><div className="h-32 w-full bg-gray-100 rounded animate-pulse"></div></Card>
                </main>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                {error && <Alert variant="error">{error}</Alert>}
            </div>
        )
    }

    const app = data.application
    const statusInfo = app ? (statusColors[app.application_status] ?? statusColors.draft) : null
    const nav = resolveNavigationState(app)
    const approvalEligible = app?.admission_fee_status === 'success' && app?.document_upload_status === 'completed'

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
                    <span className="text-sm text-[var(--text-secondary)] hidden sm:block">{data.user.email}</span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} loading={loggingOut}>Logout</Button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col gap-6"
                >
                    {/* Welcome card */}
                    <motion.div variants={itemVariants}>
                        <Card className="shadow-sm border-0 ring-1 ring-black/5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)] mb-1">Welcome back</p>
                                    <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{data.user.full_name}</h1>
                                </div>
                                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-sm"
                                    style={{ background: 'var(--brand-primary)' }}>
                                    {data.user.full_name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Application Summary */}
                    <motion.div variants={itemVariants}>
                        <Card className="shadow-sm border-0 ring-1 ring-black/5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">Application Overview</h2>
                                {statusInfo && (
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                                        style={{ background: `${statusInfo.color}10`, color: statusInfo.color, border: `1px solid ${statusInfo.color}35` }}>
                                        {statusInfo.label}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-0">
                                {[
                                    { label: 'Application No.', value: app?.application_number || '—', mono: true },
                                    { label: 'Applied Programme', value: app?.applied_course || data.user.course_name || '—' },
                                    { label: 'Last Edited', value: app?.last_edited_at ? new Date(app.last_edited_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—' },
                                ].map((row, i, arr) => (
                                    <div key={row.label} className={`flex items-center gap-3 py-3 ${i < arr.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                                        <div className="text-[var(--text-muted)] text-sm w-36 shrink-0">{row.label}</div>
                                        <div className={`text-sm font-medium text-[var(--text-primary)] ${row.mono ? 'font-mono' : ''}`}>{row.value}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    {/* ── PHASE: Basic Details / App Fee ── */}
                    <AnimatePresence mode="wait">
                        {(nav.phase === 'start' || nav.phase === 'basic_details') && (
                            <motion.div key="basic-details" variants={itemVariants} exit={{ opacity: 0, y: -10 }}>
                                <Card className="shadow-sm border-0 ring-1 ring-brand-primary/20 bg-brand-primary/[0.02]">
                                    <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight mb-2">
                                        {nav.phase === 'start' ? 'Start Your Application' : 'Continue Your Application'}
                                    </h2>
                                    <p className="text-sm text-[var(--text-secondary)] mb-5">
                                        {nav.phase === 'start'
                                            ? 'Fill in your personal details and pay the ₹500 application fee to proceed.'
                                            : 'Complete your Basic Details and pay the Application Fee to unlock your journey.'}
                                    </p>
                                    <Link href="/application/basic-details" prefetch={true}>
                                        <Button fullWidth className="shadow-sm">
                                            {nav.phase === 'start' ? 'Start Application' : 'Continue — Basic Details'}
                                        </Button>
                                    </Link>
                                </Card>
                            </motion.div>
                        )}

                        {/* ── PHASE: Split Journey ── */}
                        {nav.phase === 'split_journey' && (
                            <motion.div key="split-journey" variants={itemVariants} className="flex flex-col gap-4">
                                <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight px-1">
                                    Next Steps
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Admission Fee Card (Always visible until everything is complete) */}
                                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                        <div className={`relative flex flex-col h-full p-5 rounded-2xl border ${nav.admFeePaid ? 'border-green-300 bg-green-50 shadow-sm' : 'border-[var(--border)] bg-white shadow-sm hover:shadow-md transition-all'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm ${nav.admFeePaid ? 'bg-green-500 shadow-sm' : 'shadow-sm'}`}
                                                    style={!nav.admFeePaid ? { background: 'var(--brand-primary)' } : {}}>
                                                    {nav.admFeePaid ? '✓' : '₹'}
                                                </div>
                                                <h3 className={`text-sm font-bold tracking-tight ${nav.admFeePaid ? 'text-green-700' : 'text-[var(--text-primary)]'}`}>
                                                    Admission Fee Payment
                                                </h3>
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)] mb-5 flex-grow">
                                                {nav.admFeePaid
                                                    ? `Paid ₹${(app?.admission_fee_amount ?? 0).toLocaleString('en-IN')} (${app?.admission_fee_plan === 'semester' ? 'Semester' : app?.admission_fee_plan === 'annual' ? 'Annual' : 'Full Course'})`
                                                    : 'Choose a fee plan and complete payment.'}
                                            </p>
                                            {nav.admFeePaid ? (
                                                <span className="text-xs font-semibold text-green-600 bg-green-100/50 px-2.5 py-1 rounded inline-flex w-fit items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>Completed</span>
                                            ) : (
                                                <Link href="/application/admission-fee" prefetch={true}>
                                                    <Button size="sm" fullWidth variant="secondary" className="shadow-sm bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700">Pay Now →</Button>
                                                </Link>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Education OR Document Upload Card (Disappears after doc upload is done) */}
                                    {!nav.docDone && (!nav.eduDone ? (
                                        <motion.div key="edu-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                            <div className="relative flex flex-col h-full p-5 rounded-2xl border border-[var(--border)] bg-white shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ background: 'var(--brand-primary)' }}>
                                                        🎓
                                                    </div>
                                                    <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                                                        Education &amp; Work
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-[var(--text-muted)] mb-5 flex-grow">
                                                    Fill in academic and work history.
                                                </p>
                                                <Link href="/application/education-work" prefetch={true}>
                                                    <Button size="sm" fullWidth variant="secondary" className="shadow-sm bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700">Fill Details →</Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="doc-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                            <div className="relative flex flex-col h-full p-5 rounded-2xl border border-[var(--border)] bg-white shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ background: 'var(--brand-primary)' }}>
                                                        📄
                                                    </div>
                                                    <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                                                        Document Upload
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-[var(--text-muted)] mb-5 flex-grow">
                                                    Submit required documents.
                                                </p>
                                                <Link href="/application/document-upload" prefetch={true}>
                                                    <Button size="sm" fullWidth variant="secondary" className="shadow-sm bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700">Upload Now →</Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ── APPROVAL SECTION ── */}
                        {approvalEligible && data.approvals && data.approvals.length > 0 && (
                            <motion.div key="approvals" variants={itemVariants}>
                                <Card className="shadow-sm border-0 ring-1 ring-black/5">
                                    <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight mb-4">Approval Status</h2>
                                    <div className="flex flex-col gap-3">
                                        {data.approvals.map(approval => (
                                            <div key={approval.id} className="flex items-center justify-between p-3.5 border border-[var(--border)] rounded-xl bg-gray-50/50 transition-colors">
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{approval.level}</p>
                                                    {approval.remarks && approval.remarks !== 'NA' && (
                                                        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[200px] truncate">{approval.remarks}</p>
                                                    )}
                                                </div>
                                                <span className="text-xs font-semibold px-2.5 py-1 rounded shadow-sm"
                                                    style={{ background: `${approvalStatusColors[approval.status] ?? '#6b7280'}18`, color: approvalStatusColors[approval.status] ?? '#6b7280', border: `1px solid ${approvalStatusColors[approval.status] ?? '#6b7280'}35` }}>
                                                    {approval.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.p variants={itemVariants} className="text-center text-xs text-[var(--text-muted)] mt-4">
                        Need help? Email <a href="mailto:admissions@manipal.edu" className="text-[var(--brand-primary)] hover:underline font-medium">admissions@manipal.edu</a>
                    </motion.p>
                </motion.div>
            </main>
        </div>
    )
}

