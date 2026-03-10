import React from 'react'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
    variant: AlertVariant
    title?: string
    children: React.ReactNode
    className?: string
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
    success: {
        bg: 'var(--success-bg)',
        border: '#bbf7d0',
        text: '#166534',
        icon: '✓',
    },
    error: {
        bg: 'var(--error-bg)',
        border: '#fecaca',
        text: '#991b1b',
        icon: '✕',
    },
    warning: {
        bg: 'var(--warning-bg)',
        border: '#fde68a',
        text: '#92400e',
        icon: '⚠',
    },
    info: {
        bg: '#eff6ff',
        border: '#bfdbfe',
        text: '#1e40af',
        icon: 'ℹ',
    },
}

export function Alert({ variant, title, children, className = '' }: AlertProps) {
    const config = variantConfig[variant]
    return (
        <div
            className={['rounded-lg border p-4 text-sm', className].filter(Boolean).join(' ')}
            style={{ backgroundColor: config.bg, borderColor: config.border, color: config.text }}
        >
            <div className="flex gap-2.5">
                <span className="font-bold mt-0.5 shrink-0">{config.icon}</span>
                <div>
                    {title && <p className="font-semibold mb-0.5">{title}</p>}
                    <div>{children}</div>
                </div>
            </div>
        </div>
    )
}
