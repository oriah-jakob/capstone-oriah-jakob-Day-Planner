import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Minimal request/response helpers shared by the auth endpoints.
 *
 * Typed against Node's own http types rather than @vercel/node so the same
 * handlers run unchanged under Vercel, under the Vite dev server, and under the
 * preview server used by the end-to-end tests.
 */

export type ApiRequest = IncomingMessage & {
  /** Vercel pre-parses JSON bodies; the plain Node servers do not. */
  body?: unknown
}

export type ApiResponse = ServerResponse

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void

/** Refuse bodies large enough to be an abuse attempt rather than a form post. */
const MAX_BODY_BYTES = 16 * 1024

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export function sendJson(res: ApiResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  // Auth responses carry tokens; never let a proxy or the browser keep them.
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(body)
}

export function sendNoContent(res: ApiResponse): void {
  res.statusCode = 204
  res.setHeader('Cache-Control', 'no-store')
  res.end()
}

/** Reject anything but the expected method, with a correct Allow header. */
export function assertMethod(req: ApiRequest, method: string): void {
  if (req.method !== method) {
    throw new HttpError(405, `Method ${req.method ?? 'unknown'} is not allowed.`)
  }
}

export async function readJsonBody(req: ApiRequest): Promise<unknown> {
  // Vercel populates req.body for JSON content types.
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'string') {
      return parseJson(req.body)
    }
    return req.body
  }

  const raw = await readRawBody(req)
  if (raw === '') return {}
  return parseJson(raw)
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.')
  }
}

function readRawBody(req: ApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'Request body is too large.'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', () => {
      reject(new HttpError(400, 'Could not read the request body.'))
    })
  })
}

// Cookies -------------------------------------------------------------------

export type CookieOptions = {
  maxAgeSeconds?: number
  path?: string
  sameSite?: 'Strict' | 'Lax' | 'None'
  httpOnly?: boolean
  secure?: boolean
}

/**
 * Serialise a Set-Cookie header.
 *
 * Defaults satisfy NFR-3: HttpOnly so script cannot read it, Secure so it never
 * crosses a plaintext connection, and SameSite=Lax so it is not attached to
 * cross-site requests. Secure is set unconditionally — browsers treat
 * http://localhost as a secure context, so development still works.
 */
export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const { maxAgeSeconds, path = '/', sameSite = 'Lax', httpOnly = true, secure = true } = options

  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, `SameSite=${sameSite}`]

  if (httpOnly) parts.push('HttpOnly')
  if (secure) parts.push('Secure')
  if (maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${Math.floor(maxAgeSeconds)}`)
    parts.push(`Expires=${new Date(Date.now() + maxAgeSeconds * 1000).toUTCString()}`)
  }

  return parts.join('; ')
}

export function appendCookie(res: ApiResponse, cookie: string): void {
  const existing = res.getHeader('Set-Cookie')
  if (existing === undefined) {
    res.setHeader('Set-Cookie', [cookie])
    return
  }
  const list = Array.isArray(existing) ? existing : [String(existing)]
  res.setHeader('Set-Cookie', [...list, cookie])
}

export function readCookie(req: ApiRequest, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined

  for (const pair of header.split(';')) {
    const index = pair.indexOf('=')
    if (index === -1) continue

    if (pair.slice(0, index).trim() === name) {
      return decodeURIComponent(pair.slice(index + 1).trim())
    }
  }
  return undefined
}
