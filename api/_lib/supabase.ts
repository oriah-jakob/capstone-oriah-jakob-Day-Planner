import { createClient } from '@supabase/supabase-js'

import { getServerEnv } from './env.ts'

/**
 * Supabase clients for the serverless auth endpoints.
 *
 * Sessions are never persisted here. Each request builds a client, uses it, and
 * discards it; persisting would leak one caller's session into the next request
 * handled by the same warm instance.
 */

const NO_PERSISTENCE = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
} as const

/** Anonymous client. Row level security applies to everything it touches. */
export function createAnonClient() {
  const { supabaseUrl, supabaseAnonKey } = getServerEnv()
  return createClient(supabaseUrl, supabaseAnonKey, NO_PERSISTENCE)
}

/**
 * Service role client. Bypasses row level security entirely, so it is used only
 * for the audit log, which the browser must not be able to read or write.
 * Returns null when the key is not configured so logging can degrade instead of
 * taking authentication down with it.
 */
export function createServiceClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv()
  if (!supabaseServiceRoleKey) return null

  return createClient(supabaseUrl, supabaseServiceRoleKey, NO_PERSISTENCE)
}
