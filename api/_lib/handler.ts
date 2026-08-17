import { recordAuditEvent } from './audit.ts'
import { HttpError, sendJson, type ApiHandler, type ApiRequest, type ApiResponse } from './http.ts'

/**
 * NFR-8: errors are handled without exposing internal detail.
 *
 * Every message that can reach a user is written here or thrown as an
 * HttpError with a message chosen by hand. Anything unexpected collapses to a
 * single fixed string — no stack trace, no SQL text, no file path, no config
 * value ever crosses the wire. The real error goes to the server log and the
 * audit table instead.
 */

export const GENERIC_ERROR = 'Something went wrong. Please try again.'

/**
 * Deliberately identical for "no such account" and "wrong password". Telling
 * the two apart turns the login form into an account enumeration oracle.
 */
export const INVALID_CREDENTIALS = 'Email address or password is incorrect.'

export type ValidationErrors = Record<string, string>

export function sendValidationError(res: ApiResponse, fieldErrors: ValidationErrors): void {
  sendJson(res, 400, { error: 'Please correct the highlighted fields.', fieldErrors })
}

export function defineHandler(routeName: string, handler: ApiHandler): ApiHandler {
  return async (req: ApiRequest, res: ApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message })
        return
      }

      // Unexpected. Keep the detail server-side.
      console.error(`[${routeName}] unhandled error:`, error)
      await recordAuditEvent({
        event: 'unhandled_error',
        severity: 'error',
        description: `Unhandled error in ${routeName}`,
      })

      if (!res.headersSent) {
        sendJson(res, 500, { error: GENERIC_ERROR })
      }
    }
  }
}
