import { Outlet } from 'react-router'

import { AppSidebar } from '@/components/layout/app-sidebar'

export function AppLayout() {
  return (
    <div className="min-h-dvh md:flex">
      {/*
       * Keyboard users land here first and can jump past the navigation.
       * Visible only once focused (WCAG 2.4.1).
       */}
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to main content
      </a>

      <AppSidebar />

      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
