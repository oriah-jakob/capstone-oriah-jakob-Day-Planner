import { recordAuditEvent } from '../_lib/audit.ts'
import { defineHandler } from '../_lib/handler.ts'
import { assertMethod, HttpError, sendJson } from '../_lib/http.ts'
import { buildSessionPayload } from '../_lib/profile.ts'
import { clearRefreshCookie, getRefreshToken, setRefreshCookie } from '../_lib/session.ts'
import { createAnonClient } from '../_lib/supabase.ts'

/**
 * Exchange the HttpOnly refresh cookie for a fresh access token.
 *
 * This is what makes the session survive a page reload (F1-06) without ever
 * putting a long-lived credential somewhere script can read it. The browser
 * calls this on startup and again whenever an access token is about to expire.
 */
export default defineHandler('auth/refresh', async (req, res) => {
  assertMethod(req, 'POST')

  const refreshToken = getRefreshToken(req)
  if (!refreshToken) {
    // Not an error worth logging: every signed-out visitor hits this path once.
    throw new HttpError(401, 'Not signed in.')
  }

  const supabase = createAnonClient()
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

  if (error || !data.session) {
    // Expired, revoked, or already rotated. Drop the cookie so the browser
    // stops retrying with a token that will never work again.
    clearRefreshCookie(res)
    await recordAuditEvent({
      event: 'session_refresh_failure',
      severity: 'warn',
      description: 'Refresh token rejected',
    })
    throw new HttpError(401, 'Your session has expired. Please sign in again.')
  }

  // Supabase rotates the refresh token on every use, so the cookie has to be
  // replaced or the next refresh will present a spent token.
  setRefreshCookie(res, data.session.refresh_token)
  sendJson(res, 200, await buildSessionPayload(data.session))
})
