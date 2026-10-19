import { randomUUID } from 'node:crypto'

import { expect, type APIRequestContext } from '@playwright/test'

export const PASSWORD = 'Str0ng!Pass'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set; copy .env.example to .env.local`)
  return value
}

const SUPABASE_URL = requireEnv('VITE_SUPABASE_URL')
const ANON_KEY = requireEnv('VITE_SUPABASE_ANON_KEY')

export type Session = {
  accessToken: string
  user: { id: string; email: string; firstName: string; lastName: string }
}

export async function registerAccount(request: APIRequestContext) {
  const email = `api-${randomUUID()}@example.com`
  const response = await request.post('/api/auth/register', {
    data: { firstName: 'Api', lastName: 'Tester', email, password: PASSWORD },
  })
  expect(response.status()).toBe(201)
  return { email, session: (await response.json()) as Session }
}

/** A PostgREST URL for a table, e.g. rest('tasks', 'select=id'). */
export function rest(table: string, query?: string) {
  return `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`
}

export function headers(accessToken?: string) {
  return {
    apikey: ANON_KEY,
    Prefer: 'return=representation',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }
}
