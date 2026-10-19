import { expect, test, type Page } from '@playwright/test'

import { expectNoAccessibilityViolations } from './utils/a11y'
import {
  makeTestUser,
  registerUser,
  signIn,
  signOut,
  submitLogin,
  type TestUser,
} from './utils/auth'

/** FR-3 user settings, covering test cases F3-01 through F3-03. */

const NEW_PASSWORD = 'N3w!Passw0rd'

async function openSettings(page: Page, user = makeTestUser()) {
  await registerUser(page, user)
  await page.goto('/settings')
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
  return user
}

async function submitPasswordChange(page: Page, currentPassword: string, newPassword: string) {
  await page.getByLabel('Current password').fill(currentPassword)
  await page.getByLabel('New password', { exact: true }).fill(newPassword)
  await page.getByLabel('Confirm new password').fill(newPassword)
  await page.getByRole('button', { name: 'Update password' }).click()
}

test.describe('F3-01 set notification timer', () => {
  test('saves the lead time and keeps it after a refresh', async ({ page }) => {
    await openSettings(page)

    const leadTime = page.getByLabel('Lead time (minutes)')
    await expect(leadTime).toHaveValue('15')

    await leadTime.fill('45')
    await page.getByRole('button', { name: 'Save lead time' }).click()
    await expect(page.getByRole('alert')).toHaveText('Reminder lead time saved.')

    await page.reload()
    await expect(page.getByLabel('Lead time (minutes)')).toHaveValue('45')

    await page.goto('/profile')
    await expect(page.locator('dt:text-is("Default reminder") + dd')).toHaveText(
      '45 minutes before task start',
    )
  })

  test('rejects a lead time outside the allowed range', async ({ page }) => {
    await openSettings(page)

    await page.getByLabel('Lead time (minutes)').fill('5000')
    await page.getByRole('button', { name: 'Save lead time' }).click()
    await expect(page.getByRole('alert')).toHaveText('Lead time must be 1440 minutes or fewer.')

    await page.reload()
    await expect(page.getByLabel('Lead time (minutes)')).toHaveValue('15')
  })
})

test.describe('F3-02 change password', () => {
  test('updates the password and only the new one signs in', async ({ page }) => {
    const user = await openSettings(page)

    await submitPasswordChange(page, user.password, NEW_PASSWORD)
    await expect(page.getByRole('alert')).toHaveText('Your password has been updated.')

    // The session that changed the password stays signed in.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()

    await signOut(page)
    await submitLogin(page, user.email, user.password)
    await expect(page.getByRole('alert')).toHaveText('Email address or password is incorrect.')

    await signIn(page, { ...user, password: NEW_PASSWORD })
  })

  test('signs out every other session', async ({ page, browser }) => {
    const user = await openSettings(page)

    const otherContext = await browser.newContext()
    const otherPage = await otherContext.newPage()
    await signIn(otherPage, user)

    await submitPasswordChange(page, user.password, NEW_PASSWORD)
    await expect(page.getByRole('alert')).toHaveText('Your password has been updated.')

    await otherPage.reload()
    await expect(otherPage).toHaveURL(/\/login$/)
    await otherContext.close()
  })

  test('rejects a new password that breaks the rules (FR-1.3)', async ({ page }) => {
    const user = await openSettings(page)

    await submitPasswordChange(page, user.password, 'alllowercase')
    await expect(page.getByRole('alert')).toHaveText('Password must include an uppercase letter.')
  })
})

test.describe('F3-03 change password with the wrong current password', () => {
  test('shows an error and leaves the password unchanged', async ({ page }) => {
    const user: TestUser = await openSettings(page)

    await submitPasswordChange(page, 'Wr0ng!Password', NEW_PASSWORD)
    await expect(page.getByRole('alert')).toHaveText('Current password is incorrect.')

    await signOut(page)
    await signIn(page, user)
  })
})

test.describe('accessibility', () => {
  test('the settings page has no violations, including with a field error', async ({ page }) => {
    await openSettings(page)
    await expectNoAccessibilityViolations(page)

    await submitPasswordChange(page, 'Wr0ng!Password', NEW_PASSWORD)
    await expect(page.getByRole('alert')).toBeVisible()
    await expectNoAccessibilityViolations(page)
  })
})
