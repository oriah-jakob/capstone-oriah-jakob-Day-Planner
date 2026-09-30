/**
 * Server-side environment access.
 *
 * Nothing here is prefixed VITE_, because VITE_ variables are compiled into the
 * browser bundle. The service role key in particular must never reach a client.
 * Reads are lazy so a missing variable surfaces as a handled 500 on one route
 * rather than crashing the whole server at import time.
 */

function read(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]
    if (value !== undefined && value.trim() !== '') {
      return value.trim()
    }
  }
  return undefined
}

function require_(primary: string, ...fallbacks: string[]): string {
  const value = read(primary, ...fallbacks)
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${primary}`)
  }
  return value
}

export type ServerEnv = {
  supabaseUrl: string
  supabaseAnonKey: string
  /** Absent in local setups that have not configured audit logging yet. */
  supabaseServiceRoleKey: string | undefined
  /** Base URL used to build the password reset link. */
  appUrl: string
}

/** Vercel knows each deployment's URL, so APP_URL is only needed to override it. */
function vercelAppUrl(): string | undefined {
  const host =
    read('VERCEL_ENV') === 'production'
      ? read('VERCEL_PROJECT_PRODUCTION_URL')
      : read('VERCEL_BRANCH_URL', 'VERCEL_URL')
  return host ? `https://${host}` : undefined
}

export function getServerEnv(): ServerEnv {
  const appUrl = read('APP_URL', 'VITE_APP_URL') ?? vercelAppUrl()
  if (appUrl === undefined) {
    throw new Error('Missing required environment variable: APP_URL')
  }

  return {
    // The URL and publishable key are identical to the browser's, so falling
    // back to the VITE_ names keeps local setup to a single .env.local.
    supabaseUrl: require_('SUPABASE_URL', 'VITE_SUPABASE_URL'),
    supabaseAnonKey: require_('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'),
    supabaseServiceRoleKey: read('SUPABASE_SERVICE_ROLE_KEY'),
    appUrl,
  }
}

export function isProduction(): boolean {
  return read('VERCEL_ENV') === 'production' || read('NODE_ENV') === 'production'
}
