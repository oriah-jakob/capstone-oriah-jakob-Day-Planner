import { registerAccountSchema } from '../../src/lib/validation/auth.ts'
import { recordAuditEvent } from '../_lib/audit.ts'
import { defineHandler, sendValidationError, type ValidationErrors } from '../_lib/handler.ts'
import { assertMethod, HttpError, readJsonBody, sendJson } from '../_lib/http.ts'
import { buildSessionPayload } from '../_lib/profile.ts'
import { setRefreshCookie } from '../_lib/session.ts'
import { createAnonClient } from '../_lib/supabase.ts'

/** FR-1: register a Personal account. */
export default defineHandler('auth/register', async (req, res) => {
  assertMethod(req, 'POST')

  const parsed = registerAccountSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    const fieldErrors: ValidationErrors = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !(field in fieldErrors)) {
        fieldErrors[field] = issue.message
      }
    }
    sendValidationError(res, fieldErrors)
    return
  }

  const { firstName, lastName, email, password } = parsed.data
  const supabase = createAnonClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Consumed by the handle_new_user trigger to populate public.profiles.
    options: { data: { first_name: firstName, last_name: lastName } },
  })

  if (error) {
    await recordAuditEvent({
      event: 'register_failure',
      severity: 'warn',
      description: `Registration rejected (${error.status ?? 'unknown'})`,
    })

    // FR-1.2: emails are unique. Saying so is an enumeration signal, but a
    // registration form that refuses without explaining is unusable, and the
    // same fact is already discoverable through the reset flow.
    if (error.code === 'user_already_exists' || /already registered/i.test(error.message)) {
      throw new HttpError(409, 'An account with that email address already exists.')
    }

    // Supabase enforces the password policy independently of our schema.
    if (error.code === 'weak_password') {
      sendValidationError(res, {
        password: 'Password does not meet the minimum requirements.',
      })
      return
    }

    throw new HttpError(400, 'We could not create your account. Please try again.')
  }

  if (!data.session) {
    // Only reachable if email confirmations get switched on in the hosted
    // project; there is then no session until the user clicks the link.
    throw new HttpError(500, 'Your account was created but could not be signed in.')
  }

  const payload = await buildSessionPayload(data.session)

  await recordAuditEvent({
    event: 'register_success',
    userId: payload.user.id,
    description: 'Personal account created',
  })

  setRefreshCookie(res, data.session.refresh_token)
  sendJson(res, 201, payload)
})
