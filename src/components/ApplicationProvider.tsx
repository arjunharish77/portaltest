'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { DashboardData } from '@/types/application'
import { trackTime, logFrontendNetworkAudit, validateStateIntegrity } from '@/lib/utils/verification'

interface ApplicationContextValue {
    appState: DashboardData | null
    loading: boolean
    error: string | null
    refreshAppState: () => Promise<void>
    updateAppStateLocally: (partialState: Partial<DashboardData['application']>) => void
}

const ApplicationContext = createContext<ApplicationContextValue | undefined>(undefined)

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
    const [appState, setAppState] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const pathname = usePathname()

    // Protected routes that need application context
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/application')

    const fetchDashboard = async () => {
        if (!isProtectedRoute) return

        try {
            setLoading(true)
            const start = trackTime()
            const res = await fetch('/api/application/dashboard')
            const text = await res.text()

            const duration = trackTime() - start
            const sizeBytes = new Blob([text]).size

            logFrontendNetworkAudit(pathname, ['/api/application/dashboard'], 1, 'Provider Fetch', sizeBytes, duration)

            const json = JSON.parse(text)

            if (!json.success) {
                if (res.status === 401) {
                    router.replace('/login')
                    return
                }
                setError(json.error ?? 'Failed to load application data')
            } else {
                validateStateIntegrity(json.data)
                setAppState(json.data)
                setError(null)
            }
        } catch (err) {
            setError('Network error loading dashboard.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isProtectedRoute && !appState) {
            fetchDashboard()
        } else if (!isProtectedRoute) {
            // Optional: clear state on logout/public pages
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, isProtectedRoute])

    const refreshAppState = async () => {
        await fetchDashboard()
    }

    const updateAppStateLocally = (partialApp: Partial<DashboardData['application']>) => {
        setAppState(prev => {
            if (!prev) return prev
            return {
                ...prev,
                application: {
                    ...prev.application,
                    ...partialApp
                } as DashboardData['application']
            }
        })
    }

    return (
        <ApplicationContext.Provider value={{ appState, loading, error, refreshAppState, updateAppStateLocally }}>
            {children}
        </ApplicationContext.Provider>
    )
}

export function useApplicationContext() {
    const context = useContext(ApplicationContext)
    if (context === undefined) {
        throw new Error('useApplicationContext must be used within an ApplicationProvider')
    }
    return context
}
