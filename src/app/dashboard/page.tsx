'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import type { DashboardData } from '@/types/application'

const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: '#6b7280' },
    submitted: { label: 'Submitted', color: '#1a4f9c' },
    under_review: { label: 'Under Review', color: '#d97706' },
    accepted: { label: 'Accepted', color: '#16a34a' },
    rejected: { label: 'Rejected', color: '#dc2626' },
}

const stepLabels: Record<string, string> = {
    'basic_details': 'Basic details saved',
    'education_work_details': 'Education details saved',
    'document_upload': 'Application Submitted'
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
                if (res.status === 401) {
                    router.replace('/login')
                    return
                }
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
                {error ? (
                    <Alert variant="error">{error}</Alert>
                ) : (
                    <Spinner size="lg" />
                )}
            </div>
        )
    }

    const app = data.application
    const status = app ? (statusLabels[app.application_status] ?? statusLabels.draft) : null
    const step = app && app.current_step ? (stepLabels[app.current_step] ?? 'In progress') : 'Not started'

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
            {/* Nav bar */}
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
                    <span className="text-sm text-[var(--text-secondary)] hidden sm:block">
                        {data.user.email}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} loading={loggingOut}>
                        Logout
                    </Button>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
                {/* Welcome card */}
                <Card>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-[var(--text-secondary)] mb-1">Welcome back</p>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{data.user.full_name}</h1>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                Programme: <span className="font-medium text-[var(--text-primary)]">{data.user.course_name}</span>
                            </p>
                        </div>
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
                            style={{ background: 'var(--brand-primary)' }}
                        >
                            {data.user.full_name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </Card>

                {/* Application status card */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">Application Status</h2>
                        {status && (
                            <span
                                className="text-xs font-semibold px-3 py-1 rounded-full"
                                style={{
                                    background: `${status.color}15`,
                                    color: status.color,
                                    border: `1px solid ${status.color}30`,
                                }}
                            >
                                {status.label}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 py-3 border-b border-[var(--border)]">
                            <div className="text-[var(--text-muted)] text-sm w-32 shrink-0">Current Step</div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">{step ?? '—'}</div>
                        </div>
                        <div className="flex items-center gap-3 py-3">
                            <div className="text-[var(--text-muted)] text-sm w-32 shrink-0">Application No.</div>
                            <div className="text-sm font-mono text-[var(--text-secondary)]">
                                {app?.application_number || '—'}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* CTA card */}
                <Card>
                    <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                        {!app || !app.current_step ? 'Start Your Application' : 'Continue Your Application'}
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mb-5">
                        {!app || !app.current_step
                            ? 'Fill in your personal and contact details to begin.'
                            : 'Your application is in progress. Continue where you left off.'}
                    </p>
                    <Link href="/application">
                        <Button fullWidth>
                            {!app || !app.current_step ? 'Start Application' : 'Continue Application'}
                        </Button>
                    </Link>
                </Card>

                {/* Contact info */}
                <p className="text-center text-xs text-[var(--text-muted)]">
                    Need help? Email{' '}
                    <a href="mailto:admissions@manipal.edu" className="text-[var(--brand-primary)]">
                        admissions@manipal.edu
                    </a>
                </p>
            </main>
        </div>
    )
}
