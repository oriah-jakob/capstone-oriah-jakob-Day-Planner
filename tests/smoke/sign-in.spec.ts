import { randomUUID } from 'node:crypto'

import { expect, test, type APIRequestContext } from '@playwright/test'

// Traces record request bodies; the report on this public repo must never hold the credentials.
test.use({ trace: 'off' })

const LOCAL_URL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/

async function smokeAccount(request: APIRequestContext, baseURL: string | undefined) {
  const email = process.env.SMOKE_EMAIL
  const password = process.env.SMOKE_PASSWORD
  if (email && password) return { email, password }

  // Never create accounts on a deployment; a local stack gets a throwaway one.
  if (!baseURL || !LOCAL_URL.test(baseURL)) return null

  const account = { email: `smoke-${randomUUID()}@example.com`, password: 'Str0ng!Pass' }
  const response = await request.post('/api/auth/register', {
    data: { firstName: 'Smoke', lastName: 'Test', ...account },
  })
  expect(response.status()).toBe(201)
  return account
}

test('signs in, loads the timeline and signs out', async ({ page, request, baseURL }) => {
  const account = await smokeAccount(request, baseURL)
  test.skip(!account, 'Set SMOKE_EMAIL and SMOKE_PASSWORD to run against a deployment.')

  // Typed values show up in the report's step titles, so sign in through the API instead.
  const login = await page.request.post('/api/auth/login', { data: account })
  expect(login.status()).toBe(200)

  const cookie = (await page.context().cookies()).find(({ name }) => name === 'remmi_rt')
  expect(cookie?.httpOnly).toBe(true)
  expect(cookie?.secure).toBe(true)
  expect(cookie?.sameSite).toBe('Lax')

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 2, name: 'Timeline' })).toBeVisible()

  await page.getByRole('button', { name: 'Log Out' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
