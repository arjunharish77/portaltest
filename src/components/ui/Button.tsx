'use client'

import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
    loading?: boolean
    fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
    primary:
        'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2',
    secondary:
        'bg-white text-[var(--brand-primary)] border border-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2',
    ghost:
        'bg-transparent text-[var(--text-secondary)] hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2',
    danger:
        'bg-[var(--error)] text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2',
}

const sizeStyles: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-5 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    children,
    className = '',
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading

    return (
        <button
            disabled={isDisabled}
            className={[
                'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none',
                variantStyles[variant],
                sizeStyles[size],
                fullWidth ? 'w-full' : '',
                isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            {...props}
        >
            {loading ? (
                <>
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    {children}
                </>
            ) : (
                children
            )}
        </button>
    )
}
