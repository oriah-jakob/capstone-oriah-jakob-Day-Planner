import { changePasswordBodySchema } from '../../src/lib/validation/auth.ts'
import { recordAuditEvent } from '../_lib/audit.ts'
import { defineHandler, sendValidationError, toFieldErrors } from '../_lib/handler.ts'
import { assertMethod, HttpError, readJsonBody, sendJson } from '../_lib/http.ts'
import { buildSessionPayload } from '../_lib/profile.ts'
import { clearRefreshCookie, getRefreshToken, setRefreshCookie } from '../_lib/session.ts'
import { createAnonClient } from '../_lib/supabase.ts'

/** FR-7.2: change the password after confirming the current one. */
export default defineHandler('auth/change-password', async (req, res) => {
  assertMethod(req, 'POST')

  const refreshToken = getRefreshToken(req)
  if (!refreshToken) {
    throw new HttpError(401, 'Not signed in.')
  }

  const parsed = changePasswordBodySchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    sendValidationError(res, toFieldErrors(parsed.error))
    return
  }
  const { currentPassword, newPassword } = parsed.data

  // Updating on the caller's own session keeps it alive; Supabase revokes every other one.
  const supabase = createAnonClient()
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
  if (error || !data.session) {
    clearRefreshCookie(res)
    throw new HttpError(401, 'Your session has expired. Please sign in again.')
  }
  // The refresh token rotated; replace the cookie before anything below can fail.
  setRefreshCookie(res, data.session.refresh_token)

  const { id: userId, email } = data.session.user
  if (!email) {
    throw new HttpError(500, 'Your profile could not be loaded.')
  }

  const verifier = createAnonClient()
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email,
    password: currentPassword,
  })
  if (verifyError) {
    await recordAuditEvent({
      event: 'password_change_failure',
      severity: 'warn',
      userId,
      description: 'Current password rejected',
    })
    sendValidationError(res, { currentPassword: 'Current password is incorrect.' })
    return
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  await verifier.auth.signOut({ scope: 'local' })

  if (updateError) {
    await recordAuditEvent({
      event: 'password_change_failure',
      severity: 'warn',
      userId,
      description: 'New password rejected',
    })

    if (updateError.code === 'weak_password') {
      sendValidationError(res, { newPassword: 'Password does not meet the minimum requirements.' })
      return
    }
    if (updateError.code === 'same_password') {
      sendValidationError(res, { newPassword: 'Choose a password you have not used before.' })
      return
    }
    throw new HttpError(400, 'We could not update your password. Please try again.')
  }

  await recordAuditEvent({
    event: 'password_change_success',
    userId,
    description: 'Password changed from settings',
  })

  sendJson(res, 200, await buildSessionPayload(data.session))
})
