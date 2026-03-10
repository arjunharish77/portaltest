'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/ui/OtpInput'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

interface OtpContext {
    otp_request_id: string
    masked_target: string
    channel: 'sms' | 'email'
    purpose: 'register' | 'login'
    flow: 'register' | 'login'
}

const OTP_RESEND_COOLDOWN = 30

export default function VerifyOtpPage() {
    const router = useRouter()
    const [ctx, setCtx] = useState<OtpContext | null>(null)
    const [otp, setOtp] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const [cooldown, setCooldown] = useState(0)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        const raw = sessionStorage.getItem('otp_context')
        if (!raw) {
            router.replace('/login')
            return
        }
        try {
            setCtx(JSON.parse(raw))
            setCooldown(OTP_RESEND_COOLDOWN) // start initial cooldown
        } catch {
            router.replace('/login')
        }
        setLoaded(true)
    }, [router])

    // Cooldown countdown
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    const getVerifyEndpoint = useCallback((context: OtpContext) => {
        if (context.flow === 'register') {
            return context.channel === 'sms'
                ? '/api/auth/register-verify-phone-otp'
                : '/api/auth/verify-email-otp'
        }
        return '/api/auth/login-verify-otp'
    }, [])

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault()
        if (!ctx || otp.length < 6) return

        setVerifying(true)
        setError('')

        try {
            const endpoint = getVerifyEndpoint(ctx)
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp_request_id: ctx.otp_request_id, otp_code: otp }),
            })
            const json = await res.json()

            if (!json.success) {
                setError(json.error ?? 'OTP verification failed')
                if (json.code === 'OTP_EXPIRED') setOtp('')
                return
            }

            const redirectTo = (json.data?.redirect_to as string | undefined) ?? '/dashboard'
            setSuccess('Verification successful! Redirecting…')
            sessionStorage.removeItem('otp_context')
            setTimeout(() => router.push(redirectTo), 800)
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setVerifying(false)
        }
    }

    async function handleResend() {
        if (!ctx || cooldown > 0) return

        setResending(true)
        setError('')
        setOtp('')

        try {
            const res = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp_request_id: ctx.otp_request_id }),
            })
            const json = await res.json()

            if (!json.success) {
                setError(json.error ?? 'Failed to resend OTP')
                return
            }

            setCtx((prev) => prev
                ? { ...prev, otp_request_id: json.data.otp_request_id }
                : prev
            )
            sessionStorage.setItem('otp_context', JSON.stringify({
                ...ctx,
                otp_request_id: json.data.otp_request_id,
            }))
            setCooldown(OTP_RESEND_COOLDOWN)
            setError('')
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setResending(false)
        }
    }

    if (!loaded || !ctx) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        )
    }

    const channelLabel = ctx.channel === 'sms' ? 'SMS' : 'email'

    return (
        <AuthLayout
            title="Verify your OTP"
            subtitle={`We sent a 6-digit code via ${channelLabel}`}
        >
            <form onSubmit={handleVerify} className="flex flex-col gap-6">
                <div className="text-center">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">
                        OTP sent to
                    </p>
                    <p className="font-semibold text-[var(--text-primary)]">{ctx.masked_target}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Valid for 5 minutes</p>
                </div>

                <OtpInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={verifying}
                />

                {error && <Alert variant="error">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Button
                    type="submit"
                    fullWidth
                    loading={verifying}
                    disabled={otp.replace(/\s/g, '').length < 6}
                    size="lg"
                >
                    Verify OTP
                </Button>

                <div className="text-center">
                    {cooldown > 0 ? (
                        <p className="text-sm text-[var(--text-muted)]">
                            Resend OTP in <span className="font-semibold text-[var(--text-secondary)]">{cooldown}s</span>
                        </p>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resending}
                            className="text-sm font-medium text-[var(--brand-primary)] hover:underline disabled:opacity-50"
                        >
                            {resending ? 'Resending…' : 'Resend OTP'}
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => { sessionStorage.removeItem('otp_context'); router.push('/login') }}
                    className="text-sm text-[var(--text-muted)] text-center hover:underline"
                >
                    ← Back to login
                </button>
            </form>
        </AuthLayout>
    )
}
