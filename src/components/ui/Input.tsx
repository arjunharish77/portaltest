'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">
                    {label}
                    {props.required && <span className="text-[var(--error)] ml-0.5">*</span>}
                </label>
            )}
            <input
                id={inputId}
                className={[
                    'w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors duration-150',
                    'bg-white placeholder:text-[var(--text-muted)]',
                    error
                        ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-2 focus:ring-red-200'
                        : 'border-[var(--border)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-blue-100',
                    'focus:outline-none',
                    props.disabled ? 'bg-gray-50 text-[var(--text-muted)] cursor-not-allowed' : '',
                    className,
                ]
                    .filter(Boolean)
                    .join(' ')}
                {...props}
            />
            {error && <p className="text-xs text-[var(--error)] mt-0.5">{error}</p>}
            {hint && !error && <p className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</p>}
        </div>
    )
}
