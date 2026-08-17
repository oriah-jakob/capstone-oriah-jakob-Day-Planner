import { recordAuditEvent } from '../_lib/audit.ts'
import { defineHandler } from '../_lib/handler.ts'
import { assertMethod, sendNoContent } from '../_lib/http.ts'
import { clearRefreshCookie, getRefreshToken } from '../_lib/session.ts'
import { createAnonClient } from '../_lib/supabase.ts'

/** FR-3: log out. */
export default defineHandler('auth/logout', async (req, res) => {
  assertMethod(req, 'POST')

  const refreshToken = getRefreshToken(req)

  // Clear first and unconditionally. Even if revocation fails upstream, the
  // browser must end up signed out — a logout that can fail is not a logout.
  clearRefreshCookie(res)

  if (refreshToken) {
    try {
      const supabase = createAnonClient()

      // Revoke server-side too, so a copy of the cookie captured earlier is
      // useless. refreshSession loads the session onto this client; signOut
      // then invalidates it upstream.
      const { data } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
      if (data.session) {
        await supabase.auth.signOut()
        await recordAuditEvent({
          event: 'logout',
          userId: data.session.user.id,
          description: 'Signed out',
        })
      }
    } catch {
      // Already expired or revoked. The cookie is gone either way.
    }
  }

  sendNoContent(res)
})
