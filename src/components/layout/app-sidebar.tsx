import { NavLink } from 'react-router'

import { NAV_GROUPS } from '@/app/nav-items'
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
      </div>
    </nav>
  )
}
