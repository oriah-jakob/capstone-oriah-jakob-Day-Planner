import { apiPost, ApiError } from '@/lib/api-client'

/**
 * The browser half of the split-token session (see api/_lib/session.ts).
 *
 * The access token lives here, in a module variable, and nowhere else. It is
 * never written to localStorage, sessionStorage, or a readable cookie, so an
 * injected script has no persisted credential to steal and a closed tab ends
 * the session. Durability comes from the HttpOnly refresh cookie, which this
 * module can trigger but never read.
 */

export type SessionUser = {
  id: string
  email: string
  firstName: string
  lastName: string
}

export type Session = {
  accessToken: string
  /** Unix seconds. */
  expiresAt: number
  user: SessionUser
}

/** Refresh this long before expiry so an in-flight request never races it. */
const EXPIRY_MARGIN_SECONDS = 60

let current: Session | null = null
let inFlightRefresh: Promise<Session | null> | null = null

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSession(): Session | null {
  return current
}

export function setSession(session: Session): void {
  current = session
  emit()
}

export function clearSession(): void {
  if (current === null) return
  current = null
  emit()
}

function isUsable(session: Session | null): session is Session {
  if (!session) return false
  return session.expiresAt - EXPIRY_MARGIN_SECONDS > Date.now() / 1000
}

async function refresh(): Promise<Session | null> {
  try {
    const session = await apiPost<Session>('/api/auth/refresh')
    setSession(session)
    return session
  } catch (error) {
    // A 401 just means "not signed in", which is the normal state for a
    // visitor. Anything else is already a generic message from the server.
    if (!(error instanceof ApiError) || error.status !== 401) {
      console.warn('Session refresh failed.')
    }
    clearSession()
    return null
  }
}

/**
 * Return a session with a usable access token, refreshing if needed.
 *
 * Concurrent callers share one request: without this, a page that fires several
 * queries at once would send several refreshes, and because Supabase rotates
 * the token on use, the later ones would present an already-spent token.
 */
export async function ensureFreshSession(): Promise<Session | null> {
  if (isUsable(current)) return current

  inFlightRefresh ??= refresh().finally(() => {
    inFlightRefresh = null
  })

  return inFlightRefresh
}

/** Access token for the Supabase client, or null when signed out. */
export async function getAccessToken(): Promise<string | null> {
  return (await ensureFreshSession())?.accessToken ?? null
}
