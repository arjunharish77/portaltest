import React from 'react'

interface CardProps {
    children: React.ReactNode
    className?: string
    padding?: 'sm' | 'md' | 'lg'
}

const paddingMap = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
    return (
        <div
            className={[
                'bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-[var(--shadow)]',
                paddingMap[padding],
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </div>
    )
}
