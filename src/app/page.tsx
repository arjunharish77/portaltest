import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isSessionExpired } from '@/lib/session'
import type { PortalSession } from '@/types/db'

export default async function RootPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('portal_session')?.value

  if (token) {
    const { data: session } = await supabaseAdmin
      .from('portal_sessions')
      .select('user_id, status, expires_at')
      .eq('session_token', token)
      .eq('status', 'active')
      .single()

    if (session) {
      const typedSession = session as PortalSession
      if (!isSessionExpired(typedSession.expires_at)) {
        redirect('/dashboard')
      }
    }
  }

  redirect('/login')
}
