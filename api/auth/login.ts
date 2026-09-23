import { loginSchema } from '../../src/lib/validation/auth.ts'
import { recordAuditEvent } from '../_lib/audit.ts'
import { defineHandler, INVALID_CREDENTIALS } from '../_lib/handler.ts'
import { assertMethod, HttpError, readJsonBody, sendJson } from '../_lib/http.ts'
import { buildSessionPayload } from '../_lib/profile.ts'
import { setRefreshCookie } from '../_lib/session.ts'
import { createAnonClient } from '../_lib/supabase.ts'

/** FR-2: log in with email address and password. */
export default defineHandler('auth/login', async (req, res) => {
  assertMethod(req, 'POST')

  const parsed = loginSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    // A malformed email is still just a failed login as far as the response is
    // concerned; naming the field would confirm the address does not exist.
    throw new HttpError(401, INVALID_CREDENTIALS)
  }

  const { email, password } = parsed.data
  const supabase = createAnonClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    await recordAuditEvent({
      event: 'login_failure',
      severity: 'warn',
      // No email address here: the audit table would otherwise become a list of
      // addresses someone tried, which is exactly the data an attacker wants.
      description: 'Failed sign-in attempt',
    })
    throw new HttpError(401, INVALID_CREDENTIALS)
  }

  const payload = await buildSessionPayload(data.session)

  await recordAuditEvent({
    event: 'login_success',
    userId: payload.user.id,
    description: 'Successful sign-in',
  })

  setRefreshCookie(res, data.session.refresh_token)
  sendJson(res, 200, payload)
})
