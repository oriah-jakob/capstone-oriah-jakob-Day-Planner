import { expect, test, type Page } from '@playwright/test'

import { expectNoAccessibilityViolations } from './utils/a11y'
import { makeTestUser, registerUser } from './utils/auth'

/** FR-2 profile management, covering test cases F2-01 through F2-03. */

/** The value shown under a profile detail heading. */
function detail(page: Page, term: string) {
  return page.locator(`dt:text-is("${term}") + dd`)
}

async function openProfile(page: Page, firstName = 'Nick', lastName = 'Lawson') {
  const user = makeTestUser({ firstName, lastName })
  await registerUser(page, user)
  await page.goto('/profile')
  await expect(page.getByRole('heading', { level: 1, name: 'User profile' })).toBeVisible()
  return user
}

test.describe('F2-01 view profile', () => {
  test('renders every profile field (FR-6.1)', async ({ page }) => {
    const user = await openProfile(page)

    await expect(page.getByRole('heading', { level: 2, name: 'Nick Lawson' })).toBeVisible()
    await expect(detail(page, 'Display name')).toHaveText('Nick Lawson')
    await expect(detail(page, 'Email address')).toHaveText(user.email)
    await expect(detail(page, 'Account type')).toHaveText('Personal account')
    await expect(detail(page, 'Default reminder')).toHaveText('15 minutes before task start')
  })
})

test.describe('F2-02 update profile fields', () => {
  test('saves the new names and keeps them after a refresh', async ({ page }) => {
    await openProfile(page)

    await page.getByRole('button', { name: 'Edit Profile' }).click()
    await page.getByLabel('First name').fill('Nicholas')
    await page.getByLabel('Last name').fill('Lawson-Reid')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await expect(page.getByRole('alert')).toHaveText('Profile updated.')
    await expect(
      page.getByRole('heading', { level: 2, name: 'Nicholas Lawson-Reid' }),
    ).toBeVisible()
    await expect(page.getByText('Signed in as Nicholas Lawson-Reid')).toBeVisible()

    await page.reload()

    await expect(detail(page, 'Display name')).toHaveText('Nicholas Lawson-Reid')
    await expect(page.getByText('Signed in as Nicholas Lawson-Reid')).toBeVisible()
  })

  test('rejects an empty name without saving', async ({ page }) => {
    await openProfile(page)

    await page.getByRole('button', { name: 'Edit Profile' }).click()
    await page.getByLabel('First name').fill('   ')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await expect(page.getByRole('alert')).toHaveText('First name is required.')

    await page.reload()
    await expect(detail(page, 'Display name')).toHaveText('Nick Lawson')
  })

  test('does not allow the email address to be edited (FR-7.1)', async ({ page }) => {
    const user = await openProfile(page)

    await page.getByRole('button', { name: 'Edit Profile' }).click()

    const email = page.getByLabel('Email address')
    await expect(email).toHaveValue(user.email)
    await expect(email).toHaveAttribute('readonly', '')
  })
})

test.describe('F2-03 cancel profile edit', () => {
  test('discards the edits and restores the original values', async ({ page }) => {
    await openProfile(page)

    await page.getByRole('button', { name: 'Edit Profile' }).click()
    await page.getByLabel('First name').fill('Changed')
    await page.getByLabel('Last name').fill('Discarded')
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(detail(page, 'Display name')).toHaveText('Nick Lawson')
    await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeFocused()

    await page.reload()
    await expect(detail(page, 'Display name')).toHaveText('Nick Lawson')
    await expect(page.getByText('Signed in as Nick Lawson')).toBeVisible()
  })
})

test.describe('accessibility', () => {
  test('the profile page has no violations while viewing or editing', async ({ page }) => {
    await openProfile(page)
    await expectNoAccessibilityViolations(page)

    await page.getByRole('button', { name: 'Edit Profile' }).click()
    await expect(page.getByLabel('First name')).toBeFocused()
    await expectNoAccessibilityViolations(page)
  })
})
