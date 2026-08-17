import { createContext } from 'react'

import type { Session, SessionUser } from '@/lib/auth/session'
import type { RegisterValues } from '@/lib/validation/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type RegisterArgs = Omit<RegisterValues, 'confirmPassword'>

export type AuthContextValue = {
  status: AuthStatus
  user: SessionUser | null
  login: (email: string, password: string) => Promise<Session>
  register: (values: RegisterArgs) => Promise<Session>
  logout: () => Promise<void>
}

/**
 * Kept in its own module so the provider file exports only components and stays
 * eligible for fast refresh.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
