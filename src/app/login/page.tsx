'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

type LoginMode = 'sms' | 'email'

interface UserFound {
    user_id: string
    full_name: string
    phone: string
    email: string
}

export default function LoginPage() {
    const router = useRouter()
    const [mode, setMode] = useState<LoginMode>('sms')
    const [identifier, setIdentifier] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'identify' | 'choose-channel'>('identify')
    const [userFound, setUserFound] = useState<UserFound | null>(null)
    const [sendingOtp, setSendingOtp] = useState(false)

    async function handleCheck(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: identifier.trim(), channel: mode }),
            })
            const json = await res.json()

            if (!json.success) {
                setError(json.error ?? 'Login failed')
                return
            }

            setUserFound(json.data)
            setStep('choose-channel')
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    async function handleSendOtp(channel: 'sms' | 'email') {
        if (!userFound) return
        setSendingOtp(true)
        setError('')

        try {
            const res = await fetch('/api/auth/login-start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userFound.user_id, channel }),
            })
            const json = await res.json()

            if (!json.success) {
                setError(json.error ?? 'Failed to send OTP')
                return
            }

            sessionStorage.setItem(
                'otp_context',
                JSON.stringify({
                    otp_request_id: json.data.otp_request_id,
                    masked_target: json.data.masked_target,
                    channel,
                    purpose: 'login',
                    flow: 'login',
                })
            )

            router.push('/verify-otp')
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setSendingOtp(false)
        }
    }

    return (
        <AuthLayout
            title="Login to your portal"
            subtitle="Welcome back. Please enter your details."
        >
            {step === 'identify' && (
                <form onSubmit={handleCheck} className="flex flex-col gap-5">
                    {/* Mode toggle */}
                    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden bg-gray-50 p-1 gap-1">
                        <button
                            type="button"
                            onClick={() => { setMode('sms'); setIdentifier('') }}
                            className={[
                                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                                mode === 'sms'
                                    ? 'bg-white shadow-sm text-[var(--brand-primary)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                            ].join(' ')}
                        >
                            Mobile Number
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('email'); setIdentifier('') }}
                            className={[
                                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                                mode === 'email'
                                    ? 'bg-white shadow-sm text-[var(--brand-primary)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                            ].join(' ')}
                        >
                            Email Address
                        </button>
                    </div>

                    <Input
                        label={mode === 'sms' ? 'Mobile Number' : 'Email Address'}
                        type={mode === 'sms' ? 'tel' : 'email'}
                        placeholder={mode === 'sms' ? 'e.g. 9876543210' : 'you@example.com'}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                    />

                    {error && <Alert variant="error">{error}</Alert>}

                    <Button type="submit" fullWidth loading={loading} disabled={!identifier.trim()}>
                        Continue
                    </Button>

                    <p className="text-center text-sm text-[var(--text-secondary)]">
                        New user?{' '}
                        <Link href="/signup" className="font-medium text-[var(--brand-primary)]">
                            Create an account
                        </Link>
                    </p>
                </form>
            )}

            {step === 'choose-channel' && userFound && (
                <div className="flex flex-col gap-5">
                    <div className="text-center">
                        <div
                            className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white"
                            style={{ background: 'var(--brand-primary)' }}
                        >
                            {userFound.full_name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-[var(--text-primary)]">{userFound.full_name}</p>
                        <p className="text-sm text-[var(--text-secondary)]">Select where to receive your OTP</p>
                    </div>

                    {error && <Alert variant="error">{error}</Alert>}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => handleSendOtp('sms')}
                            disabled={sendingOtp}
                            className={[
                                'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors',
                                'border-[var(--border)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]',
                                sendingOtp ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                            ].join(' ')}
                        >
                            <span className="text-2xl">📱</span>
                            <div>
                                <p className="font-medium text-sm text-[var(--text-primary)]">Send OTP to Mobile</p>
                                <p className="text-xs text-[var(--text-secondary)]">{userFound.phone}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleSendOtp('email')}
                            disabled={sendingOtp}
                            className={[
                                'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors',
                                'border-[var(--border)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]',
                                sendingOtp ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                            ].join(' ')}
                        >
                            <span className="text-2xl">✉️</span>
                            <div>
                                <p className="font-medium text-sm text-[var(--text-primary)]">Send OTP to Email</p>
                                <p className="text-xs text-[var(--text-secondary)]">{userFound.email}</p>
                            </div>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => { setStep('identify'); setUserFound(null); setError('') }}
                        className="text-sm text-[var(--text-secondary)] underline text-center"
                    >
                        ← Use a different account
                    </button>
                </div>
            )}
        </AuthLayout>
    )
}
