import { expect, test } from '@playwright/test'

// Traces record request bodies; the report on this public repo must never hold the credentials.
test.use({ trace: 'off' })

test('signs in, loads the timeline and signs out', async ({ page }) => {
  const email = process.env.SMOKE_EMAIL
  const password = process.env.SMOKE_PASSWORD
  test.skip(!email || !password, 'Set SMOKE_EMAIL and SMOKE_PASSWORD to run.')

  // Typed values show up in the report's step titles, so sign in through the API instead.
  const login = await page.request.post('/api/auth/login', { data: { email, password } })
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
