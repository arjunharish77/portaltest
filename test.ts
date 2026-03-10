import { supabaseAdmin } from './src/lib/supabase/admin'

async function testFlow() {
    console.log("Fetching test user...")
    const { data: user } = await supabaseAdmin.from('portal_users').select('*').limit(1).single()
    if (!user) return console.log("No user found.")

    const userId = user.id
    console.log("Simulating Registration Flow for", user.email)

    // 1. Delete existing app for fresh start
    console.log("Cleaning up old application data...")
    const { data: oldApp } = await supabaseAdmin.from('applications').select('id').eq('user_id', userId).single()
    if (oldApp) {
        await supabaseAdmin.from('application_basic_details').delete().eq('application_id', oldApp.id)
        await supabaseAdmin.from('application_education_work_details').delete().eq('application_id', oldApp.id)
        await supabaseAdmin.from('applications').delete().eq('id', oldApp.id)
    }

    // 2. Simulate what `register-verify-phone-otp` does now
    console.log("Simulating OTP verification application create...")
    const { generateApplicationNumber } = require('./src/lib/utils/id')
    const { data: app, error: appError } = await supabaseAdmin.from('applications').insert({
        user_id: user.id,
        application_number: generateApplicationNumber(user.course_name),
        applied_course: user.course_name,
        application_status: 'draft',
        current_step: 'basic_details',
        updated_at: new Date().toISOString()
    }).select('*').single()

    if (appError) console.error("Error creating app:", appError)
    else console.log("✅ Created blank application:", app.id, app.application_number, app.applied_course)

    // Create a mock session token
    console.log("Creating active session...")
    const { generateSessionToken, getSessionExpiry } = require('./src/lib/session')
    const token = generateSessionToken()
    await supabaseAdmin.from('portal_sessions').insert({
        user_id: user.id,
        session_token: token,
        status: 'active',
        expires_at: getSessionExpiry()
    })

    console.log("Test Session Token generated:", token)
    console.log(`Open browser and run this in console: \ndocument.cookie = "portal_session=${token}; path=/"; \nwindow.location.href = "/dashboard";`)
}

testFlow().catch(console.error)
