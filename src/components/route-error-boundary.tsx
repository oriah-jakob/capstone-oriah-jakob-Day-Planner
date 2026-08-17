import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NotFoundPage from '@/routes/not-found-page'

/**
 * NFR-8: errors are handled without exposing internal detail. The user always
 * sees a fixed, generic message — never a stack trace, SQL error, file path, or
 * configuration value. The real error is logged to the console in development
 * only; from week 3 it is also posted to the server-side audit log (NFR-9).
 */
export function RouteErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  if (import.meta.env.DEV) {
    console.error('Unhandled route error:', error)
  }

  const status = isRouteErrorResponse(error) ? error.status : 500

  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <p className="text-5xl font-bold text-primary">{status}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Something went wrong</h1>

      <Card className="mt-6 text-left">
        <CardHeader>
          <CardTitle className="text-base">We could not complete that request</CardTitle>
          <CardDescription>
            The problem has been recorded. Nothing you entered has been lost.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Try again in a moment. If it keeps happening, sign out and back in.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/">Return to Dashboard</Link>
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    </div>
  )
}
