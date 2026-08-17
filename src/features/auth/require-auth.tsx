import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '@/features/auth/use-auth'

/**
 * Route guard for everything behind sign-in.
 *
 * This is a usability control, not a security boundary: it stops signed-out
 * users from landing on an empty page. The actual enforcement is row level
 * security in Postgres, which applies no matter what the browser renders.
 */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    // The refresh cookie is still being exchanged. Rendering the login page
    // here would flash it in front of users who are already signed in.
    return (
      <output aria-live="polite" className="grid min-h-dvh place-items-center">
        <span className="text-sm text-muted-foreground">Loading your schedule…</span>
      </output>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
