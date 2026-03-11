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

interface DocEntry {
    document_type: string
    file_name: string
}

interface DocSection {
    title: string
    documents: string[]
}

const DOC_SECTIONS: DocSection[] = [
    {
        title: 'Identity Documents',
        documents: ['Aadhaar Card', 'PAN Card', 'Passport'],
    },
    {
        title: 'Qualification Documents',
        documents: ['10th Marksheet', '12th Marksheet', 'Graduation Certificate / Degree'],
    },
    {
        title: 'Work Experience Details',
        documents: ['Experience Letter', 'Offer Letter'],
    },
    {
        title: 'Benefit Category Details',
        documents: ['Caste / Category Certificate', 'Disability Certificate (if applicable)'],
    },
    {
        title: 'Affidavits',
        documents: ['Gap Year Affidavit (if applicable)'],
    },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocumentUploadPage() {
    const router = useRouter()
    const [appNumber, setAppNumber] = useState<string | null>(null)
    const [userName, setUserName] = useState('')
    const [docEntries, setDocEntries] = useState<Record<string, DocEntry>>({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [serverError, setServerError] = useState('')
    const [declarationChecked, setDeclarationChecked] = useState(false)

    useEffect(() => {
        async function load() {
            const res = await fetch('/api/application/document-upload')
            if (res.status === 401) { router.replace('/login'); return }
            const json = await res.json()
            if (!json.success) return
            setAppNumber(json.data?.application?.application_number ?? null)
            setUserName(json.data?.user?.full_name ?? '')
            setLoading(false)
        }
        load()
    }, [router])

    function setDocFileName(docType: string, fileName: string) {
        setDocEntries(p => ({
            ...p,
            [docType]: { document_type: docType, file_name: fileName },
        }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!declarationChecked) {
            setServerError('Please check the declaration before submitting.')
            return
        }
        setSubmitting(true)
        setServerError('')

        // Collect only docs with file names entered
        const documents = Object.values(docEntries).filter(d => d.file_name.trim())

        try {
            const res = await fetch('/api/application/document-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents }),
            })
            const json = await res.json()
            if (!json.success) { setServerError(json.error ?? 'Failed to submit'); return }
            router.push('/dashboard')
        } catch {
            setServerError('Network error. Try again.')
        } finally {
            setSubmitting(false)
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
                    {appNumber && (
                        <span className="text-sm text-[var(--text-muted)] hidden sm:block">
                            App: <span className="font-mono font-semibold text-[var(--text-primary)]">{appNumber}</span>
                        </span>
                    )}
                    <Link href="/dashboard" className="text-sm text-[var(--brand-primary)] hover:underline font-medium">← Dashboard</Link>
                </div>
            </header>

            {/* Stepper */}
            <div className="border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-6 overflow-x-auto text-xs">
                    {['Basic Details & Application Fee', 'Admission Fee / Education', 'Document Upload'].map((s, i) => (
                        <div key={i} className={`flex items-center gap-2 shrink-0 ${i === 2 ? 'text-[var(--brand-primary)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 2 ? 'text-white' : 'bg-green-500 text-white'}`}
                                style={i === 2 ? { background: 'var(--brand-primary)' } : {}}>{i < 2 ? '✓' : i + 1}</div>
                            {s}{i < 2 && <span className="text-[var(--border)] ml-2">›</span>}
                        </div>
                    ))}
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Document Upload</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Enter the file name for each document you are submitting. No file upload is required at this stage.
                    </p>
                </div>

                {serverError && <Alert variant="error" className="mb-6">{serverError}</Alert>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {DOC_SECTIONS.map(section => (
                        <Card key={section.title}>
                            <div className="pb-3 mb-4 border-b border-[var(--border)]">
                                <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                    {section.title}
                                </h2>
                            </div>
                            <div className="flex flex-col gap-4">
                                {section.documents.map(docType => (
                                    <div key={docType} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                        <div className="w-full sm:w-56 shrink-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)]">{docType}</p>
                                            <p className="text-xs text-[var(--text-muted)]">Optional — enter file name if available</p>
                                        </div>
                                        <div className="flex-1 w-full">
                                            <Input
                                                placeholder="e.g. aadhaar_front.pdf"
                                                value={docEntries[docType]?.file_name ?? ''}
                                                onChange={e => setDocFileName(docType, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}

                    {/* Declaration */}
                    <Card>
                        <div className="pb-3 mb-4 border-b border-[var(--border)]">
                            <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>Declaration</h2>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-4">
                            I, <span className="font-semibold">{userName || 'the applicant'}</span>, hereby declare that all information
                            provided in this application is true and correct to the best of my knowledge. I understand that any
                            misrepresentation may result in cancellation of my admission.
                        </div>
                        <div className="flex items-start gap-2">
                            <input type="checkbox" id="declaration" checked={declarationChecked}
                                onChange={e => setDeclarationChecked(e.target.checked)} className="mt-0.5 w-4 h-4 rounded" />
                            <label htmlFor="declaration" className="text-sm text-[var(--text-primary)]">
                                I have read and agree to the above declaration. <span className="text-[var(--error)]">*</span>
                            </label>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/dashboard"><Button type="button" variant="secondary">Save & Exit</Button></Link>
                        <Button type="submit" loading={submitting}>Submit Documents</Button>
                    </div>
                </form>
            </main>
        </div>
    )
}
