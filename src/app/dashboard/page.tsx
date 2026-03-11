'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
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

    const step = app.current_step ?? ''
    const appFeePaid = app.application_fee_status === 'success'
    const admFeePaid = app.admission_fee_status === 'success'
    const docDone = app.document_upload_status === 'completed'

    if (step === 'dashboard_split' || appFeePaid) {
        return { phase: 'split_journey' as const, admFeePaid, docDone }
    }
    if (step === 'document_upload') {
        return { phase: 'document_upload' as const, admFeePaid, docDone }
    }
    // basic_details / application_fee / default
    return { phase: 'basic_details' as const }
}

export default function DashboardPage() {
    const router = useRouter()
    const [data, setData] = useState<DashboardData | null>(null)
    const [error, setError] = useState('')
    const [loggingOut, setLoggingOut] = useState(false)

    useEffect(() => {
        async function load() {
            const res = await fetch('/api/application/dashboard')
            const json = await res.json()
            if (!json.success) {
                if (res.status === 401) { router.replace('/login'); return }
                setError(json.error ?? 'Failed to load dashboard')
                return
            }
            setData(json.data)
        }
        load()
    }, [router])

    async function handleLogout() {
        setLoggingOut(true)
        await fetch('/api/auth/logout', { method: 'POST' })
        router.replace('/login')
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                {error ? <Alert variant="error">{error}</Alert> : <Spinner size="lg" />}
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
            <header className="border-b px-6 py-4 flex items-center justify-between"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: 'var(--brand-primary)' }}>M</div>
                    <span className="font-semibold text-[var(--text-primary)]">Online Manipal</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-[var(--text-secondary)] hidden sm:block">{data.user.email}</span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} loading={loggingOut}>Logout</Button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
                {/* Welcome card */}
                <Card>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-[var(--text-secondary)] mb-1">Welcome back</p>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{data.user.full_name}</h1>
                        </div>
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
                            style={{ background: 'var(--brand-primary)' }}>
                            {data.user.full_name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </Card>

                {/* Application Summary */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">Application Overview</h2>
                        {statusInfo && (
                            <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                style={{ background: `${statusInfo.color}18`, color: statusInfo.color, border: `1px solid ${statusInfo.color}35` }}>
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

                {/* ── PHASE: Basic Details / App Fee ── */}
                {nav.phase === 'start' || nav.phase === 'basic_details' ? (
                    <Card>
                        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                            {nav.phase === 'start' ? 'Start Your Application' : 'Continue Your Application'}
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-5">
                            {nav.phase === 'start'
                                ? 'Fill in your personal details and pay the ₹500 application fee to proceed.'
                                : 'Complete your Basic Details and pay the Application Fee to unlock your journey.'}
                        </p>
                        <Link href="/application/basic-details">
                            <Button fullWidth>
                                {nav.phase === 'start' ? 'Start Application' : 'Continue — Basic Details'}
                            </Button>
                        </Link>
                    </Card>
                ) : null}

                {/* ── PHASE: Split Journey ── */}
                {nav.phase === 'split_journey' && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">
                            Complete Both Steps Below
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Admission Fee Card */}
                            <div className={`relative flex flex-col p-5 rounded-2xl border-2 ${nav.admFeePaid ? 'border-green-300 bg-green-50' : 'border-[var(--border)] bg-[var(--bg-card)]'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm ${nav.admFeePaid ? 'bg-green-500' : ''}`}
                                        style={!nav.admFeePaid ? { background: 'var(--brand-primary)' } : {}}>
                                        {nav.admFeePaid ? '✓' : '₹'}
                                    </div>
                                    <h3 className={`text-sm font-bold ${nav.admFeePaid ? 'text-green-700' : 'text-[var(--text-primary)]'}`}>
                                        Admission Fee Payment
                                    </h3>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mb-4">
                                    {nav.admFeePaid
                                        ? `Paid ₹${(app?.admission_fee_amount ?? 0).toLocaleString('en-IN')} (${app?.admission_fee_plan === 'semester' ? 'Semester' : app?.admission_fee_plan === 'annual' ? 'Annual' : 'Full Course'})`
                                        : 'Choose a fee plan and complete payment.'}
                                </p>
                                {nav.admFeePaid ? (
                                    <span className="text-xs font-semibold text-green-600">✓ Completed</span>
                                ) : (
                                    <Link href="/application/admission-fee">
                                        <Button size="sm" fullWidth>Pay Now →</Button>
                                    </Link>
                                )}
                            </div>

                            {/* Education & Work Card */}
                            <div className={`relative flex flex-col p-5 rounded-2xl border-2 ${app?.education_details_status === 'completed' ? 'border-green-300 bg-green-50' : 'border-[var(--border)] bg-[var(--bg-card)]'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm ${app?.education_details_status === 'completed' ? 'bg-green-500' : ''}`}
                                        style={app?.education_details_status !== 'completed' ? { background: 'var(--brand-primary)' } : {}}>
                                        {app?.education_details_status === 'completed' ? '✓' : '🎓'}
                                    </div>
                                    <h3 className={`text-sm font-bold ${app?.education_details_status === 'completed' ? 'text-green-700' : 'text-[var(--text-primary)]'}`}>
                                        Education &amp; Work Details
                                    </h3>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mb-4">
                                    {app?.education_details_status === 'completed'
                                        ? 'Details saved.'
                                        : 'Fill in academic and work history.'}
                                </p>
                                {app?.education_details_status === 'completed' ? (
                                    <span className="text-xs font-semibold text-green-600">✓ Completed</span>
                                ) : (
                                    <Link href="/application/education-work">
                                        <Button size="sm" fullWidth>Fill Details →</Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PHASE: Document Upload ── */}
                {nav.phase === 'document_upload' && (
                    <Card>
                        <div className="flex items-start gap-3">
                            {nav.admFeePaid ? null : (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-4 w-full">
                                    ⚠️ Admission fee not yet paid. You can upload documents, but final submission requires payment.
                                </div>
                            )}
                        </div>
                        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Upload Documents</h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-5">
                            {nav.docDone
                                ? 'Documents submitted. Check approval status below.'
                                : 'Submit your document list to complete the application.'}
                        </p>
                        {!nav.docDone && (
                            <Link href="/application/document-upload">
                                <Button fullWidth>Upload Documents →</Button>
                            </Link>
                        )}
                        {nav.docDone && !nav.admFeePaid && (
                            <Link href="/application/admission-fee">
                                <Button fullWidth variant="secondary">Pay Admission Fee →</Button>
                            </Link>
                        )}
                    </Card>
                )}

                {/* ── APPROVAL SECTION ── */}
                {approvalEligible && data.approvals && data.approvals.length > 0 && (
                    <Card>
                        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Approval Status</h2>
                        <div className="flex flex-col gap-3">
                            {data.approvals.map(approval => (
                                <div key={approval.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{approval.level}</p>
                                        {approval.remarks && approval.remarks !== 'NA' && (
                                            <p className="text-xs text-[var(--text-muted)] mt-0.5">{approval.remarks}</p>
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                        style={{ background: `${approvalStatusColors[approval.status] ?? '#6b7280'}18`, color: approvalStatusColors[approval.status] ?? '#6b7280', border: `1px solid ${approvalStatusColors[approval.status] ?? '#6b7280'}35` }}>
                                        {approval.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <p className="text-center text-xs text-[var(--text-muted)]">
                    Need help? Email <a href="mailto:admissions@manipal.edu" className="text-[var(--brand-primary)]">admissions@manipal.edu</a>
                </p>
            </main>
        </div>
    )
}
