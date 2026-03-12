// src/lib/utils/verification.ts

/**
 * Utility functions for Performance Verification, UAT Logging, and Vercel compute estimation.
 * These functions silently exit in production to ensure zero overhead.
 */

const IS_DEV = process.env.NODE_ENV !== 'production'

export function logDbDebug(route: string, queryCount: number, durationMs: number, columnsStr: string) {
    if (!IS_DEV) return
    console.log(`\n[DB DEBUG] \nroute: ${route} \nqueries: ${queryCount} \nduration: ${durationMs.toFixed(2)}ms \ncolumns: ${columnsStr}\n`)
}

export function logVercelSimulation(endpoint: string, estimatedInvocations: number) {
    if (!IS_DEV) return
    console.log(`[VERCEL SIMULATION] endpoint: ${endpoint} | estimated invocation: ${estimatedInvocations} | time: ${new Date().toISOString()}`)
}

export function logPayloadSize(endpoint: string, payloadBytes: number, durationMs: number, maxKbLimit: number = 5) {
    if (!IS_DEV) return
    const kb = payloadBytes / 1024
    console.log(`[PAYLOAD] endpoint: ${endpoint} | size: ${kb.toFixed(2)} KB | duration: ${durationMs.toFixed(2)}ms`)
    if (kb > maxKbLimit) {
        console.warn(`[WARNING: PAYLOAD LIMIT EXCEEDED] ${endpoint} payload is ${kb.toFixed(2)} KB (limit: ${maxKbLimit} KB)`)
    }
}

// ----------------------------------------------------
// FRONTEND UTILS
// ----------------------------------------------------

export function logFrontendNetworkAudit(route: string, endpoints: string[], requestCount: number, actionName: string = 'Page Load', payloadSizeBytes: number = 0, durationMs: number = 0) {
    if (!IS_DEV) return

    console.log(`\n[NETWORK AUDIT - ${actionName}] \nroute: ${route} \nendpoints: ${endpoints.join(', ')} \nrequests: ${requestCount} \ntime: ${durationMs.toFixed(2)}ms \npayload: ${(payloadSizeBytes / 1024).toFixed(2)} KB`)

    if (requestCount > 1 && actionName === 'Page Load') {
        // We expect mostly 1 request per page load now with ApplicationProvider
        console.warn(`[WARNING: DUPLICATE CALLS] Route ${route} triggered ${requestCount} requests on load! Check for redundant fetches.`)
    }
}

export function logActionFlow(actionName: string, endpoint: string, durationMs: number, statusText: string, payloadSizeBytes: number) {
    if (!IS_DEV) return
    console.log(`[ACTION VERIFICATION] action: ${actionName} | endpoint: ${endpoint} | duration: ${durationMs.toFixed(2)}ms | status: ${statusText} | payload: ${(payloadSizeBytes / 1024).toFixed(2)} KB`)
}

export function logStateMismatchWarning(scenarioId: string, expectedPattern: string, actualDesc: string) {
    if (!IS_DEV) return
    console.warn(`[STATE MISMATCH] Scenario: ${scenarioId}\nExpected: ${expectedPattern}\nActual: ${actualDesc}`)
}

export function validateStateIntegrity(appData: any) {
    if (!IS_DEV || !appData?.application) return
    const app = appData.application

    // Scenario 8 check: If doc & admission fee done, must be in approval
    const docDone = app.document_upload_status === 'completed'
    const feeDone = app.admission_fee_status === 'success'

    if (docDone && feeDone && appData.approvals?.length === 0) {
        logStateMismatchWarning('Dashboard State Transitions & Approval Eligibility', 'Should generate approval rows if doc/fee completed', 'approvals length 0')
    }
}

export function trackTime() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
}
