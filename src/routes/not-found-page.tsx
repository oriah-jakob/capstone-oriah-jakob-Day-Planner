import { Link, useLocation } from 'react-router'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'

const DESTINATIONS = [
  {
    to: '/tasks',
    title: 'My Tasks',
    description: 'Review every scheduled task, upcoming items, and reminders.',
  },
  {
    to: '/profile',
    title: 'User Profile',
    description: 'Manage account details, reminder lead time, and family sharing.',
  },
  {
    to: '/family',
    title: 'Family Access',
    description: 'Control who can view your schedule in read-only mode.',
  },
]

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  const { pathname } = useLocation()

  return (
    <div className="mx-auto max-w-3xl py-10 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mx-auto mt-2 max-w-prose text-sm text-muted-foreground">
        The page you were trying to open does not exist, may have been moved, or the link may be out
        of date. Return to your dashboard or use one of the common destinations below.
      </p>

      <Card className="mt-6 text-left">
        <CardHeader>
          <CardDescription className="text-xs font-semibold tracking-wide uppercase">
            Requested page
          </CardDescription>
          {/* React escapes this, so a crafted path cannot inject markup (NFR-2). */}
          <CardTitle className="font-mono text-sm break-all">{pathname}</CardTitle>
        </CardHeader>
      </Card>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/">Open Dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/tasks">View My Tasks</Link>
        </Button>
      </div>

      <ul className="mt-8 grid gap-4 text-left sm:grid-cols-3">
        {DESTINATIONS.map((destination) => (
          <li key={destination.to}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">
                  <Link to={destination.to} className="hover:underline">
                    {destination.title}
                  </Link>
                </CardTitle>
                <CardDescription>{destination.description}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
