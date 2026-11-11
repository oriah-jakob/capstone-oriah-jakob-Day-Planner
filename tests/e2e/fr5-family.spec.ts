import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test'

import { headers, PASSWORD, registerAccount, rest } from '../api/utils'
import { expectNoAccessibilityViolations } from './utils/a11y'

/** FR-5 family accounts and permissions: F5-01 to F5-05. */

type Account = Awaited<ReturnType<typeof registerAccount>>

const DAY = '2026-09-16'

async function signedIn(browser: Browser, account: Account): Promise<Page> {
  const page = await (await browser.newContext()).newPage()
  await page.request.post('/api/auth/login', {
    data: { email: account.email, password: PASSWORD },
  })
  return page
}

async function rpc(request: APIRequestContext, account: Account, name: string, args: object) {
  const response = await request.post(rest(`rpc/${name}`), {
    headers: headers(account.session.accessToken),
    data: args,
  })
  expect(response.ok()).toBe(true)
}

/** An owner with one member, and a shared and a hidden task on the owner's timeline. */
async function familyOfTwo(request: APIRequestContext) {
  const owner = await registerAccount(request)
  const member = await registerAccount(request)
  await rpc(request, owner, 'create_family', { p_family_name: 'Jakob family' })
  await rpc(request, owner, 'add_family_member', { p_email: member.email })

  const task = { task_type_id: 1, task_date: DAY, start_time: '07:00', end_time: '08:00' }
  const created = await request.post(rest('tasks'), {
    headers: headers(owner.session.accessToken),
    data: [
      { ...task, title: 'Shared gym', hidden_from_family: false },
      { ...task, title: 'Private plans', hidden_from_family: true },
    ],
  })
  const tasks = (await created.json()) as { id: string; title: string }[]
  const sharedTaskId = tasks.find((t) => t.title === 'Shared gym')!.id
  return { owner, member, sharedTaskId }
}

const members = (page: Page) => page.getByRole('list', { name: 'Family members' })
const accountType = (page: Page) => page.locator('dt:text-is("Account type") + dd')

test.describe('F5-01 create a family account', () => {
  test('makes the creator the owner', async ({ browser, request }) => {
    const owner = await registerAccount(request)
    const page = await signedIn(browser, owner)

    await page.goto('/family')
    await page.getByLabel('Family name').fill('Jakob family')
    await page.getByRole('button', { name: 'Create family' }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Jakob family' })).toBeVisible()
    await expect(page.getByText('You are the family owner.')).toBeVisible()
    await expect(members(page).getByRole('listitem')).toHaveCount(1)
    await expect(members(page)).toContainText('Owner')

    await page.goto('/profile')
    await expect(accountType(page)).toHaveText('Family owner')
  })
})

test.describe('F5-02 add a family member', () => {
  test('links an existing account by email', async ({ browser, request }) => {
    const owner = await registerAccount(request)
    const member = await registerAccount(request)
    await rpc(request, owner, 'create_family', { p_family_name: 'Jakob family' })
    const page = await signedIn(browser, owner)

    await page.goto('/family')
    await page.getByLabel("Member's email address").fill(member.email)
    await page.getByRole('button', { name: 'Add member' }).click()

    await expect(page.getByRole('alert')).toHaveText('Member added.')
    await expect(members(page).getByRole('listitem')).toHaveCount(2)
    await expect(members(page)).toContainText(member.email)

    const memberPage = await signedIn(browser, member)
    await memberPage.goto('/profile')
    await expect(accountType(memberPage)).toHaveText('Family member')
  })

  test('gives one message for an unknown email and for someone already in a family (NFR-8.1)', async ({
    browser,
    request,
  }) => {
    const owner = await registerAccount(request)
    const taken = await familyOfTwo(request)
    await rpc(request, owner, 'create_family', { p_family_name: 'Other family' })
    const page = await signedIn(browser, owner)
    await page.goto('/family')

    await page.getByLabel("Member's email address").fill('nobody-registered@example.com')
    await page.getByRole('button', { name: 'Add member' }).click()
    const unknown = await page.getByRole('alert').textContent()

    await page.getByLabel("Member's email address").fill(taken.member.email)
    await page.getByRole('button', { name: 'Add member' }).click()
    await expect(page.getByRole('alert')).toHaveText(unknown ?? '')
    expect(unknown).toContain('We could not add that person.')
    await expect(members(page).getByRole('listitem')).toHaveCount(1)
  })
})

test.describe('F5-03 remove a family member', () => {
  test('unlinks the member and ends their access', async ({ browser, request }) => {
    const { owner, member } = await familyOfTwo(request)
    const page = await signedIn(browser, owner)

    await page.goto('/family')
    await page.getByRole('button', { name: 'Remove Api Tester' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Remove member' }).click()
    await expect(members(page).getByRole('listitem')).toHaveCount(1)

    const memberPage = await signedIn(browser, member)
    await memberPage.goto(`/family/${owner.session.user.id}`)
    await expect(memberPage.getByRole('alert')).toHaveText('This timeline is not shared with you.')
    await memberPage.goto('/profile')
    await expect(accountType(memberPage)).toHaveText('Personal account')
  })
})

test.describe('F5-04 view-only enforcement', () => {
  test('shows the timeline without edit, delete or completion controls', async ({
    browser,
    request,
  }) => {
    const { owner, member } = await familyOfTwo(request)
    const page = await signedIn(browser, member)

    await page.goto('/family')
    await page.getByRole('link', { name: 'View timeline: Api Tester' }).click()
    await expect(page).toHaveURL(new RegExp(`/family/${owner.session.user.id}`))
    await page.getByLabel('Go to date').fill(DAY)

    const items = page.getByRole('main').getByRole('listitem')
    await expect(items).toHaveText([/Shared gym/])
    await expect(page.getByText('View only')).toBeVisible()
    await expect(page.getByRole('checkbox')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /^Edit/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Delete/ })).toHaveCount(0)
  })

  test('keeps tasks hidden from family off the shared view', async ({ browser, request }) => {
    const { owner, member } = await familyOfTwo(request)

    const memberPage = await signedIn(browser, member)
    await memberPage.goto(`/family/${owner.session.user.id}?date=${DAY}`)
    await expect(memberPage.getByRole('main').getByRole('listitem')).toHaveCount(1)
    await expect(memberPage.getByText('Private plans')).toHaveCount(0)

    const ownerPage = await signedIn(browser, owner)
    await ownerPage.goto(`/?date=${DAY}`)
    await expect(ownerPage.getByRole('main').getByRole('listitem')).toHaveCount(2)
    await expect(ownerPage.getByText('Hidden from family')).toBeVisible()
  })

  test('lets the owner view members too, and hides member management from members', async ({
    browser,
    request,
  }) => {
    const { member } = await familyOfTwo(request)
    const memberPage = await signedIn(browser, member)

    await memberPage.goto('/family')
    await expect(memberPage.getByText('You are a family member.')).toBeVisible()
    await expect(memberPage.getByRole('button', { name: 'Add member' })).toHaveCount(0)
    await expect(memberPage.getByRole('button', { name: /^Remove/ })).toHaveCount(0)
  })
})

test.describe('F5-05 write attempt blocked', () => {
  test('refuses to edit a task on another timeline', async ({ browser, request }) => {
    const { member, sharedTaskId } = await familyOfTwo(request)
    const page = await signedIn(browser, member)

    await page.goto(`/tasks/${sharedTaskId}/edit`)

    await expect(page.getByRole('alert')).toHaveText(
      'You can only edit tasks on your own timeline.',
    )
    await expect(page.getByRole('button', { name: 'Save changes' })).toHaveCount(0)
  })
})

test.describe('accessibility', () => {
  test('the family page and a member timeline have no violations', async ({ browser, request }) => {
    const { owner } = await familyOfTwo(request)
    const page = await signedIn(browser, owner)

    await page.goto('/family')
    await expect(members(page).getByRole('listitem')).toHaveCount(2)
    await expectNoAccessibilityViolations(page)

    await page.getByRole('button', { name: 'Remove Api Tester' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expectNoAccessibilityViolations(page)
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()

    await page.getByRole('link', { name: 'View timeline: Api Tester' }).click()
    await expect(page.getByText('View only')).toBeVisible()
    await expectNoAccessibilityViolations(page)
  })
})
