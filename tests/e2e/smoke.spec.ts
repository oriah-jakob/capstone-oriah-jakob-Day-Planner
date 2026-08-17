import { expect, test } from '@playwright/test'

import { expectNoAccessibilityViolations } from './utils/a11y'

const PAGES = [
  { link: 'My Tasks', heading: 'My Tasks', path: '/tasks' },
  { link: 'Profile', heading: 'User profile', path: '/profile' },
  { link: 'Family Access', heading: 'Family Access', path: '/family' },
  { link: 'Settings', heading: 'Settings', path: '/settings' },
  { link: 'Dashboard', heading: 'Dashboard', path: '/' },
]

test.describe('application shell', () => {
  test('serves the app and renders a single top-level heading', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Remmi/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  })

  test('navigates between every section from the sidebar', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Main' })

    for (const { link, heading, path } of PAGES) {
      await nav.getByRole('link', { name: link, exact: true }).click()

      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`))
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      await expect(page).toHaveTitle(new RegExp('Remmi'))
    }
  })

  test('marks the current section for assistive technology', async ({ page }) => {
    await page.goto('/tasks')

    const current = page.getByRole('navigation', { name: 'Main' }).getByRole('link', {
      name: 'My Tasks (current page)',
    })
    await expect(current).toHaveAttribute('aria-current', 'page')
  })

  test('exposes a skip link as the first focusable element', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeVisible()
  })

  test('has no accessibility violations on first paint', async ({ page }) => {
    await page.goto('/')

    await expectNoAccessibilityViolations(page)
  })
})
