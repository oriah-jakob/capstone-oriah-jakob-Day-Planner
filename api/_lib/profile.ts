import { createClient, type Session } from '@supabase/supabase-js'
import { getServerEnv } from './env.ts'
import { HttpError } from './http.ts'
import type { SessionPayload } from './session.ts'

/**
 * Build the response body the browser keeps in memory after signing in.
 *
 * Names come from public.profiles rather than the auth user metadata, because
 * from week 4 the profile is what the edit form writes to. Reading the metadata
 * instead would show a stale name after the first profile update.
 */
export async function buildSessionPayload(session: Session): Promise<SessionPayload> {
  const { supabaseUrl, supabaseAnonKey } = getServerEnv()

  // Scoped to the signed-in user, so row level security applies exactly as it
  // would for a request made from the browser.
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  })

  const { data, error } = await client
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', session.user.id)
    .single<{ first_name: string; last_name: string; email: string }>()

  if (error || !data) {
    // The signup trigger guarantees a profile exists, so this means something
    // is genuinely wrong rather than a missing-row edge case.
    throw new HttpError(500, 'Your profile could not be loaded.')
  }

  return {
    accessToken: session.access_token,
    expiresAt: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
    user: {
      id: session.user.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
    },
  }
}
