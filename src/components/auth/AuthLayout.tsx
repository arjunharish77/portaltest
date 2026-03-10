import React from 'react'

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{ background: 'var(--bg-base)' }}
        >
            {/* Portal header / branding */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 mb-3">
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                        style={{ background: 'var(--brand-primary)' }}
                    >
                        M
                    </div>
                    <span className="font-semibold text-lg text-[var(--text-primary)]">Online Manipal</span>
                </div>
                <div
                    className="h-px w-16 mx-auto mb-6"
                    style={{ background: 'var(--border)' }}
                />
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{title}</h1>
                {subtitle && <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>}
            </div>

            {/* Card */}
            <div
                className="w-full max-w-md rounded-2xl border p-8"
                style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-md)',
                }}
            >
                {children}
            </div>

            <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
                © {new Date().getFullYear()} Manipal Academy of Higher Education. All rights reserved.
            </p>
        </div>
    )
}
