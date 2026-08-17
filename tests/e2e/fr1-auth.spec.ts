import { expect, test } from '@playwright/test'

import { expectNoAccessibilityViolations } from './utils/a11y'
import {
  makeTestUser,
  registerUser,
  signIn,
  signOut,
  submitLogin,
  TEST_PASSWORD,
} from './utils/auth'

/**
 * FR-1 authentication, covering test cases F1-01 through F1-06 from the
 * project proposal's test plan.
 */

test.describe('F1-01 register new user', () => {
  test('creates the account and lands on the app', async ({ page }) => {
    const user = makeTestUser()
    await registerUser(page, user)

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(`Signed in as ${user.firstName} ${user.lastName}`)).toBeVisible()
  })

  test('rejects a password that does not meet the rules (FR-1.3)', async ({ page }) => {
    await page.goto('/register')

    const user = makeTestUser()
    await page.getByLabel('First name').fill(user.firstName)
    await page.getByLabel('Last name').fill(user.lastName)
    await page.getByLabel('Email address').fill(user.email)
    await page.getByLabel('Password', { exact: true }).fill('alllowercase')
    await page.getByLabel('Confirm password').fill('alllowercase')
    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page.getByRole('alert')).toContainText('uppercase letter')
    await expect(page).toHaveURL(/\/register$/)
  })

  test('refuses a duplicate email address (FR-1.2)', async ({ page }) => {
    const user = makeTestUser()
    await registerUser(page, user)

    // Sign out, then try to register the same address again.
    await signOut(page)

    await page.goto('/register')
    await page.getByLabel('First name').fill('Someone')
    await page.getByLabel('Last name').fill('Else')
    await page.getByLabel('Email address').fill(user.email)
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel('Confirm password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page.getByRole('alert')).toContainText('already exists')
  })
})

test.describe('F1-02 login success', () => {
  test('signs in and shows the timeline', async ({ page }) => {
    const user = makeTestUser()
    await registerUser(page, user)
    await signOut(page)

    await signIn(page, user)
    await expect(page.getByText("Today's timeline")).toBeVisible()
  })
})

test.describe('F1-03 login failure', () => {
  test('shows an error and does not sign in on a wrong password', async ({ page }) => {
    const user = makeTestUser()
    await registerUser(page, user)
    await signOut(page)

    await submitLogin(page, user.email, 'Wr0ng!Password')

    await expect(page.getByRole('alert')).toHaveText('Email address or password is incorrect.')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('gives the same message for an unknown address, to avoid enumeration', async ({ page }) => {
    await submitLogin(page, 'definitely-not-registered@example.com', 'Wr0ng!Password')

    await expect(page.getByRole('alert')).toHaveText('Email address or password is incorrect.')
  })
})

test.describe('F1-04 logout', () => {
  test('returns to the login screen and blocks the protected pages', async ({ page }) => {
    await registerUser(page)

    await signOut(page)

    // Going back to a protected route must not restore the session.
    await page.goto('/tasks')
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('F1-05 forgot password request', () => {
  test('accepts the request and confirms without revealing the account', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()

    await page.getByLabel('Email address').fill('someone@example.com')
    await page.getByRole('button', { name: 'Send reset link' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Check your email' })).toBeVisible()
    await expect(page.getByText('If that email address has an account')).toBeVisible()
  })
})

test.describe('F1-06 session persistence', () => {
  test('stays signed in across a full page reload', async ({ page }) => {
    const user = makeTestUser()
    await registerUser(page, user)

    await page.reload()

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText(`Signed in as ${user.firstName} ${user.lastName}`)).toBeVisible()
  })

  test('survives navigating straight to a deep link', async ({ page }) => {
    await registerUser(page)

    await page.goto('/settings')
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
  })
})

test.describe('route protection', () => {
  test('redirects an anonymous visitor and returns them after signing in', async ({ page }) => {
    const user = makeTestUser()
    await registerUser(page, user)
    await signOut(page)

    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login$/)

    await page.getByLabel('Email address').fill(user.email)
    await page.getByLabel('Password', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: 'Log in' }).click()

    // Sent back to what they originally asked for, not the dashboard.
    await expect(page).toHaveURL(/\/profile$/)
  })

  test('keeps a signed-in user off the login page', async ({ page }) => {
    await registerUser(page)

    await page.goto('/login')
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('session storage (NFR-3)', () => {
  test('keeps the refresh token in an HttpOnly, Secure, SameSite cookie', async ({ page }) => {
    await registerUser(page)

    const cookies = await page.context().cookies()
    const refresh = cookies.find((cookie) => cookie.name === 'remmi_rt')

    expect(refresh, 'refresh cookie should be set').toBeDefined()
    expect(refresh?.httpOnly, 'must not be readable by script').toBe(true)
    expect(refresh?.secure, 'must not cross a plaintext connection').toBe(true)
    expect(refresh?.sameSite, 'must not ride along on cross-site requests').toBe('Lax')
    expect(refresh?.path, 'scoped to the auth endpoints only').toBe('/api/auth')
  })

  test('leaves no session credential in web storage', async ({ page }) => {
    await registerUser(page)

    const stored = await page.evaluate(() => ({
      local: JSON.stringify(window.localStorage),
      session: JSON.stringify(window.sessionStorage),
    }))

    // The access token is held in a module variable and nowhere else, so an
    // injected script has no persisted credential to read.
    expect(stored.local).not.toMatch(/token/i)
    expect(stored.session).not.toMatch(/token/i)
    expect(stored.local).toBe('{}')
  })

  test('cannot read the refresh cookie from script', async ({ page }) => {
    await registerUser(page)

    const visible = await page.evaluate(() => document.cookie)
    expect(visible).not.toContain('remmi_rt')
  })
})

test.describe('accessibility', () => {
  for (const path of ['/login', '/register', '/forgot-password']) {
    test(`${path} has no accessibility violations`, async ({ page }) => {
      await page.goto(path)
      await expectNoAccessibilityViolations(page)
    })
  }

  test('a failed sign-in announces the error', async ({ page }) => {
    await submitLogin(page, 'nobody@example.com', 'Wr0ng!Password')

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expectNoAccessibilityViolations(page)
  })
})
