import { forgotPasswordSchema } from '../../src/lib/validation/auth.ts'
import { recordAuditEvent } from '../_lib/audit.ts'
import { defineHandler } from '../_lib/handler.ts'
import { getServerEnv } from '../_lib/env.ts'
import { assertMethod, readJsonBody, sendJson } from '../_lib/http.ts'
import { createAnonClient } from '../_lib/supabase.ts'

/**
 * FR-4.1: send a password reset email.
 *
 * The response is identical whether or not the address is registered, and is
 * sent even when the address is malformed. Anything else turns this endpoint
 * into a way to test which email addresses have accounts.
 */
const ALWAYS_OK = {
  message: 'If that email address has an account, a reset link is on its way.',
}

export default defineHandler('auth/request-password-reset', async (req, res) => {
  assertMethod(req, 'POST')

  const parsed = forgotPasswordSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    sendJson(res, 200, ALWAYS_OK)
    return
  }

  const { email } = parsed.data
  const { appUrl } = getServerEnv()

  const supabase = createAnonClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Must appear in auth.additional_redirect_urls or Supabase refuses it.
    redirectTo: `${appUrl.replace(/\/$/, '')}/reset-password`,
  })

  await recordAuditEvent({
    event: 'password_reset_request',
    severity: error ? 'warn' : 'info',
    description: error
      ? 'Password reset email could not be sent'
      : 'Password reset email requested',
  })

  sendJson(res, 200, ALWAYS_OK)
})
