/** Thin wrapper over fetch for the /api endpoints. */

export type FieldErrors = Record<string, string>

export class ApiError extends Error {
  status: number
  fieldErrors: FieldErrors | undefined

  constructor(status: number, message: string, fieldErrors?: FieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/** Shown when the server is unreachable or returns something unreadable. */
const NETWORK_ERROR = 'We could not reach the server. Check your connection and try again.'

type ErrorBody = { error?: unknown; fieldErrors?: unknown }

function readErrorBody(body: unknown, status: number): ApiError {
  if (typeof body === 'object' && body !== null) {
    const { error, fieldErrors } = body as ErrorBody
    return new ApiError(
      status,
      typeof error === 'string' ? error : NETWORK_ERROR,
      typeof fieldErrors === 'object' && fieldErrors !== null
        ? (fieldErrors as FieldErrors)
        : undefined,
    )
  }
  return new ApiError(status, NETWORK_ERROR)
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  let response: Response

  try {
    response = await fetch(path, {
      method: 'POST',
      // The refresh cookie is same-origin; this keeps it attached even if the
      // app is ever served from a different origin than the API.
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, NETWORK_ERROR)
  }

  if (response.status === 204) {
    return undefined as T
  }

  let parsed: unknown
  try {
    parsed = (await response.json()) as unknown
  } catch {
    if (response.ok) return undefined as T
    throw new ApiError(response.status, NETWORK_ERROR)
  }

  if (!response.ok) {
    throw readErrorBody(parsed, response.status)
  }

  return parsed as T
}
