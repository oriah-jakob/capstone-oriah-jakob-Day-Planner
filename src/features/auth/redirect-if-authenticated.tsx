import { Navigate, Outlet } from 'react-router'

import { useAuth } from '@/features/auth/use-auth'

/** Keeps signed-in users off the sign-in and registration pages. */
export function RedirectIfAuthenticated() {
  const { status } = useAuth()

  if (status === 'loading') return null
  if (status === 'authenticated') return <Navigate to="/" replace />

  return <Outlet />
}
