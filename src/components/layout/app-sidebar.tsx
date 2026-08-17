import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'

import { NAV_GROUPS } from '@/app/nav-items'
import { useAuth } from '@/features/auth/use-auth'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  return (
    <nav
      aria-label="Main"
      className="shrink-0 border-b border-border bg-card md:h-dvh md:w-60 md:border-e md:border-b-0"
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
        >
          R
        </span>
        <span className="text-base font-semibold">Remmi</span>
      </div>

      <div className="flex gap-6 overflow-x-auto px-4 pb-3 md:flex-col md:gap-5 md:overflow-visible md:pb-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="min-w-max md:min-w-0">
            <h2 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {group.heading}
            </h2>
            <ul className="flex gap-1 md:flex-col">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className="size-4" aria-hidden />
                        <span>{item.label}</span>
                        {/* Screen readers get the active state that colour alone conveys. */}
                        {isActive && <span className="sr-only">(current page)</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="min-w-max md:min-w-0 md:pt-2">
          <SignOutButton />
        </div>
      </div>
    </nav>
  )
}

/** FR-3: log out. */
function SignOutButton() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const onSignOut = async () => {
    setSigningOut(true)
    await logout()
    // replace so the back button cannot return to a signed-in screen.
    await navigate('/login', { replace: true })
  }

  return (
    <>
      {user && (
        <p className="mb-1 hidden truncate text-xs text-muted-foreground md:block">
          Signed in as {user.firstName} {user.lastName}
        </p>
      )}
      <button
        type="button"
        onClick={() => void onSignOut()}
        disabled={signingOut}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="size-4" aria-hidden />
        <span>{signingOut ? 'Signing out…' : 'Log Out'}</span>
      </button>
    </>
  )
}
