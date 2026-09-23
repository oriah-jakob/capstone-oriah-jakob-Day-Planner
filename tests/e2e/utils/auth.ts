import { randomUUID } from 'node:crypto'

import { expect, type Page } from '@playwright/test'

/** Meets FR-1.3: length, upper, lower, digit, and a symbol Supabase accepts. */
export const TEST_PASSWORD = 'Str0ng!Pass'

export type TestUser = {
  firstName: string
  lastName: string
  email: string
  password: string
}

/**
 * A fresh account per test. Tests run in parallel against one local database,
 * so sharing a fixed account would make them interfere with each other.
 */
export function makeTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `test-${randomUUID()}@example.com`,
    password: TEST_PASSWORD,
    ...overrides,
  }
}

/** Register through the UI and land on the dashboard. */
export async function registerUser(page: Page, user: TestUser = makeTestUser()): Promise<TestUser> {
  await page.goto('/register')

  await page.getByLabel('First name').fill(user.firstName)
  await page.getByLabel('Last name').fill(user.lastName)
  await page.getByLabel('Email address').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(user.password)
  await page.getByLabel('Confirm password').fill(user.password)
  await page.getByRole('button', { name: 'Create Account' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  return user
}

/** Fill and submit the sign-in form. Does not assert the outcome. */
export async function submitLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
}

export async function signIn(page: Page, user: TestUser): Promise<void> {
  await submitLogin(page, user.email, user.password)
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
}

/**
 * Sign out and wait for it to land.
 *
 * Navigating away without waiting races the logout request: the cookie clear
 * may never arrive, and the next page load silently restores the session.
 */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Log Out' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible()
}

/** Register a user and return them already signed in. */
export async function signedInUser(page: Page): Promise<TestUser> {
  return registerUser(page)
}
