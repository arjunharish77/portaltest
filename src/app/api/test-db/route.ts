import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('portal_users')
        .select('id')
        .limit(1)

    if (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }

    return NextResponse.json({
        success: true,
        message: 'Database connected',
        data,
    })
}