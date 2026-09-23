import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
  type RegisterArgs,
} from '@/features/auth/auth-context'
import { apiPost } from '@/lib/api-client'
import {
  clearSession,
  ensureFreshSession,
  getSession,
  setSession,
  subscribe,
  type Session,
} from '@/lib/auth/session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSession, () => null)

  // Distinguishes "no session yet" from "checked, and there is none", so the
  // app does not flash the login page for an already-signed-in user (F1-06).
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    let active = true

    void ensureFreshSession().finally(() => {
      if (active) setRestored(true)
    })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const next = await apiPost<Session>('/api/auth/login', { email, password })
    setSession(next)
    return next
  }, [])

  const register = useCallback(async (values: RegisterArgs) => {
    const next = await apiPost<Session>('/api/auth/register', values)
    setSession(next)
    return next
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiPost<void>('/api/auth/logout')
    } finally {
      // Sign out locally even if the request failed; leaving the user looking
      // signed in after they asked to leave is the worse outcome.
      clearSession()
    }
  }, [])

  const status: AuthStatus = !restored ? 'loading' : session ? 'authenticated' : 'anonymous'

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: session?.user ?? null, login, register, logout }),
    [status, session, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
