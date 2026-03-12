'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { useApplicationContext } from '@/components/ApplicationProvider'
import { trackTime, logActionFlow } from '@/lib/utils/verification'

import type { Variants } from 'framer-motion'

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

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocumentUploadPage() {
    const router = useRouter()

    // Application Context
    const { appState, loading: contextLoading, updateAppStateLocally } = useApplicationContext()
    const appNumber = appState?.application?.application_number ?? null
    const userName = appState?.user?.full_name ?? ''

    const [docEntries, setDocEntries] = useState<Record<string, DocEntry>>({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [serverError, setServerError] = useState('')
    const [declarationChecked, setDeclarationChecked] = useState(false)

    // Prefetch next route
    useEffect(() => {
        router.prefetch('/dashboard')
    }, [router])

    useEffect(() => {
        async function load() {
            try {
                // Get pre-existing documents if any
                const res = await fetch('/api/application/document-upload')
                const json = await res.json()

                if (json.success && json.data?.documents?.length > 0) {
                    const entries: Record<string, DocEntry> = {}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    json.data.documents.forEach((d: any) => {
                        entries[d.document_type] = { document_type: d.document_type, file_name: d.file_name }
                    })
                    setDocEntries(entries)
                }
            } catch {
                setServerError('Failed to load document details.')
            } finally {
                setLoading(false)
            }
        }
        if (!contextLoading) {
            load()
        }
    }, [contextLoading])

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
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }
        setSubmitting(true)
        setServerError('')

        // Collect only docs with file names entered
        const documents = Object.values(docEntries).filter(d => d.file_name.trim())

        const start = trackTime()
        try {
            const bodyStr = JSON.stringify({ documents })
            const payloadSizeBytes = new Blob([bodyStr]).size
            const res = await fetch('/api/application/document-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyStr,
            })
            const json = await res.json()
            const duration = trackTime() - start
            logActionFlow('Submit Documents', '/api/application/document-upload', duration, json.success ? 'Success' : 'Failed', payloadSizeBytes)

            if (!json.success) { setServerError(json.error ?? 'Failed to submit'); setSubmitting(false); return }

            if (json.data?.updated_flags) {
                updateAppStateLocally(json.data.updated_flags)
            }

            // Immediate optimistic UI push
            router.push(json.data?.redirect_to || '/dashboard')
        } catch {
            setServerError('Network error. Try again.')
            setSubmitting(false)
        }
    }

    if (loading || contextLoading) return (
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
                    {appNumber && (
                        <span className="text-sm text-[var(--text-muted)] hidden sm:block">
                            App: <span className="font-mono font-semibold text-[var(--text-primary)]">{appNumber}</span>
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
                        <span className="text-gray-400 flex items-center gap-2 cursor-pointer hover:text-gray-600 transition-colors" onClick={() => router.push('/application/education-work')}>
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center">✓</span>
                            Education & Work
                        </span>
                        <span className="text-gray-300">›</span>
                        <span className="font-semibold text-[var(--brand-primary)] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white text-[10px] flex items-center justify-center shadow-sm">3</span>
                            Document Upload
                        </span>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <motion.div variants={containerVariants} initial="hidden" animate="show">
                    <motion.div variants={itemVariants} className="mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Document Upload</h1>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Enter the file name for each document you are submitting. No file upload is required at this stage.
                        </p>
                    </motion.div>

                    <AnimatePresence>
                        {serverError && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                                <Alert variant="error">{serverError}</Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {DOC_SECTIONS.map((section, idx) => (
                            <motion.div key={section.title} variants={itemVariants} custom={idx}>
                                <Card className="shadow-sm border-0 ring-1 ring-black/5 overflow-hidden">
                                    <div className="pb-4 mb-5 border-b border-[var(--border)]">
                                        <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>
                                            {section.title}
                                        </h2>
                                    </div>
                                    <div className="flex flex-col gap-5">
                                        {section.documents.map(docType => (
                                            <div key={docType} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-[var(--border)] relative group transition-colors hover:border-[var(--brand-primary)] hover:bg-blue-50/10">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl"></div>
                                                <div className="w-full sm:w-64 shrink-0 px-2 sm:px-4">
                                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{docType}</p>
                                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Optional — enter file name</p>
                                                </div>
                                                <div className="flex-1 w-full relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                                                    </div>
                                                    <Input
                                                        placeholder={`e.g. ${docType.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`}
                                                        value={docEntries[docType]?.file_name ?? ''}
                                                        onChange={e => setDocFileName(docType, e.target.value)}
                                                        className="pl-10 shadow-inner"
                                                    />
                                                </div>

                                                {docEntries[docType]?.file_name && (
                                                    <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}

                        {/* Declaration */}
                        <motion.div variants={itemVariants}>
                            <Card className="shadow-sm border-0 ring-1 ring-black/5 overflow-hidden">
                                <div className="pb-4 mb-5 border-b border-[var(--border)]">
                                    <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#c8602a' }}>Declaration</h2>
                                </div>
                                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-sm text-amber-800 mb-5 leading-relaxed shadow-inner">
                                    I, <span className="font-bold">{userName || 'the applicant'}</span>, hereby declare that all information
                                    provided in this application is true and correct to the best of my knowledge. I understand that any
                                    misrepresentation may result in cancellation of my admission.
                                </div>

                                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${declarationChecked ? 'bg-blue-50/50 border-[var(--brand-primary)]' : 'bg-white border-[var(--border)] hover:bg-gray-50'}`}>
                                    <div className="relative flex items-center mt-0.5">
                                        <input
                                            type="checkbox"
                                            id="declaration"
                                            checked={declarationChecked}
                                            onChange={e => setDeclarationChecked(e.target.checked)}
                                            className="peer w-5 h-5 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20 cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-[var(--text-primary)] select-none leading-tight">
                                        I have read and agree to the above declaration. <span className="text-[var(--error)]">*</span>
                                    </span>
                                </label>
                            </Card>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex justify-end gap-3 mt-4 pt-6 border-t border-[var(--border)]">
                            <Link href="/dashboard">
                                <Button type="button" variant="secondary" className="shadow-sm">Save & Exit</Button>
                            </Link>
                            <Button type="submit" loading={submitting} className="shadow-sm px-6">
                                Submit Final Application
                            </Button>
                        </motion.div>
                    </form>
                </motion.div>
            </main>
        </div>
    )
}
