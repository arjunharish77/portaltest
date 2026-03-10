'use client'

import React, { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'

interface OtpInputProps {
    length?: number
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function OtpInput({ length = 6, value, onChange, disabled = false }: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const digits = value.padEnd(length, '').slice(0, length).split('')

    function updateValue(index: number, char: string) {
        const newDigits = [...digits]
        newDigits[index] = char
        onChange(newDigits.join('').replace(/\s/g, ''))
    }

    function handleChange(e: ChangeEvent<HTMLInputElement>, index: number) {
        const val = e.target.value.replace(/\D/g, '').slice(-1)
        updateValue(index, val)
        if (val && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                updateValue(index - 1, '')
                inputRefs.current[index - 1]?.focus()
            } else {
                updateValue(index, '')
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
        onChange(pasted.padEnd(length, ' ').slice(0, length).trimEnd())
        const nextFocus = Math.min(pasted.length, length - 1)
        inputRefs.current[nextFocus]?.focus()
    }

    return (
        <div className="flex gap-3 justify-center">
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[i] === ' ' ? '' : (digits[i] ?? '')}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    disabled={disabled}
                    className={[
                        'w-12 h-12 text-center text-xl font-semibold rounded-lg border-2 transition-colors duration-150',
                        'focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-blue-100',
                        digits[i] && digits[i] !== ' '
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-secondary)]'
                            : 'border-[var(--border)] bg-white',
                        disabled ? 'opacity-50 cursor-not-allowed' : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                />
            ))}
        </div>
    )
}
