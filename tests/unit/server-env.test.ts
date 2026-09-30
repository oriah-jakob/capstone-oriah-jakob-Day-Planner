// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getServerEnv } from '../../api/_lib/env.ts'

const VARIABLES = [
  'APP_URL',
  'VITE_APP_URL',
  'VERCEL_ENV',
  'VERCEL_PROJECT_PRODUCTION_URL',
  'VERCEL_BRANCH_URL',
  'VERCEL_URL',
]

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key')
  for (const name of VARIABLES) vi.stubEnv(name, '')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getServerEnv app url', () => {
  it('prefers an explicit APP_URL', () => {
    vi.stubEnv('APP_URL', 'https://remmi.example.com')
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'remmi.vercel.app')

    expect(getServerEnv().appUrl).toBe('https://remmi.example.com')
  })

  it('falls back to the local VITE_APP_URL', () => {
    vi.stubEnv('VITE_APP_URL', 'http://localhost:5173')
    expect(getServerEnv().appUrl).toBe('http://localhost:5173')
  })

  it('uses the production domain on a production deployment', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'remmi.vercel.app')
    vi.stubEnv('VERCEL_URL', 'remmi-abc123.vercel.app')

    expect(getServerEnv().appUrl).toBe('https://remmi.vercel.app')
  })

  it('uses the branch url on a preview deployment', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_BRANCH_URL', 'remmi-git-feat-x.vercel.app')
    vi.stubEnv('VERCEL_URL', 'remmi-abc123.vercel.app')

    expect(getServerEnv().appUrl).toBe('https://remmi-git-feat-x.vercel.app')
  })

  it('falls back to the deployment url when there is no branch url', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_URL', 'remmi-abc123.vercel.app')

    expect(getServerEnv().appUrl).toBe('https://remmi-abc123.vercel.app')
  })

  it('fails clearly when nothing provides it', () => {
    expect(() => getServerEnv()).toThrow('Missing required environment variable: APP_URL')
  })
})
