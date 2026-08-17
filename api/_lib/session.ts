import {
  appendCookie,
  readCookie,
  serializeCookie,
  type ApiRequest,
  type ApiResponse,
} from './http.ts'

/**
 * Session handling for the split-token design (NFR-3).
 *
 * The refresh token is the only credential that outlives a page load, so it is
 * the one that has to be protected: it goes in a cookie marked HttpOnly, Secure
 * and SameSite=Lax, scoped to /api/auth so it is never sent anywhere else.
 * Script cannot read it, which is what makes an XSS token theft ineffective.
 *
 * The access token is returned in the response body and held only in a module
 * variable in the browser. It expires in an hour and dies when the tab closes,
 * so there is nothing durable for an attacker to lift out of storage.
 */

export const REFRESH_COOKIE_NAME = 'remmi_rt'

/** Scoped so the browser only attaches it to the endpoints that need it. */
export const REFRESH_COOKIE_PATH = '/api/auth'

/** Supabase rotates refresh tokens; this is the idle window before re-login. */
const REFRESH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export function setRefreshCookie(res: ApiResponse, refreshToken: string): void {
  appendCookie(
    res,
    serializeCookie(REFRESH_COOKIE_NAME, refreshToken, {
      path: REFRESH_COOKIE_PATH,
      maxAgeSeconds: REFRESH_COOKIE_MAX_AGE_SECONDS,
      sameSite: 'Lax',
      httpOnly: true,
      secure: true,
    }),
  )
}

export function clearRefreshCookie(res: ApiResponse): void {
  appendCookie(
    res,
    serializeCookie(REFRESH_COOKIE_NAME, '', {
      path: REFRESH_COOKIE_PATH,
      maxAgeSeconds: 0,
      sameSite: 'Lax',
      httpOnly: true,
      secure: true,
    }),
  )
}

export function getRefreshToken(req: ApiRequest): string | undefined {
  return readCookie(req, REFRESH_COOKIE_NAME)
}

export type SessionPayload = {
  accessToken: string
  /** Unix seconds. Lets the client refresh before a request fails. */
  expiresAt: number
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}
