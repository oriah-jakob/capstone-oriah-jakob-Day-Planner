import { z } from 'zod'

import { passwordSchema } from '../../src/lib/validation/auth.ts'
import { recordAuditEvent } from '../_lib/audit.ts'
import { defineHandler, sendValidationError } from '../_lib/handler.ts'
import { assertMethod, HttpError, readJsonBody, sendJson } from '../_lib/http.ts'
import { clearRefreshCookie } from '../_lib/session.ts'
import { createAnonClient } from '../_lib/supabase.ts'

/**
 * FR-4.2: set a new password after following a valid reset link.
 *
 * The recovery link lands on /reset-password with tokens in the URL fragment.
 * The page posts them here rather than holding a session, so the browser never
 * gains a durable credential from the reset flow.
 */
const bodySchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  password: passwordSchema,
})

export default defineHandler('auth/reset-password', async (req, res) => {
  assertMethod(req, 'POST')

  const parsed = bodySchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.find((issue) => issue.path[0] === 'password')
    if (passwordIssue) {
      sendValidationError(res, { password: passwordIssue.message })
      return
    }
    throw new HttpError(400, 'This reset link is invalid or has expired.')
  }

  const { accessToken, refreshToken, password } = parsed.data
  const supabase = createAnonClient()

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (sessionError || !sessionData.session) {
    await recordAuditEvent({
      event: 'password_reset_failure',
      severity: 'warn',
      description: 'Reset link rejected',
    })
    throw new HttpError(401, 'This reset link is invalid or has expired.')
  }

  const userId = sessionData.session.user.id
  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    await recordAuditEvent({
      event: 'password_reset_failure',
      severity: 'warn',
      userId,
      description: 'Password update rejected',
    })

    if (updateError.code === 'weak_password') {
      sendValidationError(res, { password: 'Password does not meet the minimum requirements.' })
      return
    }
    if (updateError.code === 'same_password') {
      sendValidationError(res, { password: 'Choose a password you have not used before.' })
      return
    }

    throw new HttpError(400, 'We could not update your password. Please request a new link.')
  }

  // Revoke the recovery session and make sure no stale cookie survives, so the
  // new password has to be used to get back in.
  await supabase.auth.signOut()
  clearRefreshCookie(res)

  await recordAuditEvent({
    event: 'password_reset_success',
    userId,
    description: 'Password changed via reset link',
  })

  sendJson(res, 200, { message: 'Your password has been updated. Please sign in.' })
})
