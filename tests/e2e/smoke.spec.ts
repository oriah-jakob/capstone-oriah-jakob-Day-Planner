import { expect, test } from '@playwright/test'

import { expectNoAccessibilityViolations } from './utils/a11y'

test.describe('application shell', () => {
  test('serves the app and renders a single top-level heading', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Remmi/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('has no accessibility violations on first paint', async ({ page }) => {
    await page.goto('/')

    await expectNoAccessibilityViolations(page)
  })
})
