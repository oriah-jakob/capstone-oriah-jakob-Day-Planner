import { createServiceClient } from './supabase.ts'

/**
 * Audit trail for NFR-9.
 *
 * Writes are best effort and never block or fail the request they describe:
 * a logging outage must not lock users out. Descriptions are fixed strings
 * chosen at the call site, never interpolated user input, so credentials and
 * tokens cannot end up in the log (NFR-9.1).
 */

export type AuditEvent =
  | 'register_success'
  | 'register_failure'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_refresh_failure'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'password_reset_failure'
  | 'unhandled_error'

export type AuditSeverity = 'info' | 'warn' | 'error'

export type AuditEntry = {
  event: AuditEvent
  description: string
  severity?: AuditSeverity
  userId?: string | null
}

export async function recordAuditEvent(entry: AuditEntry): Promise<void> {
  const { event, description, severity = 'info', userId = null } = entry

  const client = createServiceClient()
  if (!client) {
    // No service role key configured. Fall back to stderr so the event is not
    // lost in local development.
    console.warn(`[audit:${severity}] ${event} user=${userId ?? '-'} ${description}`)
    return
  }

  const { error } = await client.from('audit_logs').insert({
    event_type: event,
    description: description.slice(0, 500),
    severity,
    user_id: userId,
  })

  if (error) {
    console.error(`[audit] failed to record ${event}: ${error.message}`)
  }
}
