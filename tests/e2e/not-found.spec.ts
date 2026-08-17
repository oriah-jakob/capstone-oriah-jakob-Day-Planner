import { expect, test } from '@playwright/test'

import { expectNoAccessibilityViolations } from './utils/a11y'
import { registerUser } from './utils/auth'

// Unknown routes render inside the app shell, which is behind the route guard.
// An anonymous visitor is sent to the login page instead (covered in
// fr1-auth.spec.ts).
test.beforeEach(async ({ page }) => {
  await registerUser(page)
})

test.describe('not found page', () => {
  test('renders for an unknown route and keeps navigation available', async ({ page }) => {
    await page.goto('/family/shared-calendar')

    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    await expect(page.getByText('/family/shared-calendar')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  })

  test('offers a route back to the dashboard', async ({ page }) => {
    await page.goto('/nope')
    await page.getByRole('link', { name: 'Open Dashboard' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  })

  test('does not leak internals into the page', async ({ page }) => {
    await page.goto('/definitely-not-a-page')

    // NFR-8.1: no stack traces, file paths, or configuration values.
    const body = (await page.locator('body').textContent()) ?? ''
    expect(body).not.toMatch(/at\s+\w+\s+\(/)
    expect(body).not.toMatch(/\.tsx?:\d+/)
    expect(body).not.toMatch(/node_modules/i)
  })

  test('has no accessibility violations', async ({ page }) => {
    await page.goto('/missing')

    await expectNoAccessibilityViolations(page)
  })
})
