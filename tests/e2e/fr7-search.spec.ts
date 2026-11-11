import { expect, test, type Page } from '@playwright/test'

import { headers, PASSWORD, registerAccount, rest } from '../api/utils'
import { expectNoAccessibilityViolations } from './utils/a11y'

/** FR-7 search, filter and sort: F7-01 to F7-07. */

const SEED = [
  ['Gym', 'Health', '2026-09-16', '07:00', '08:00', 'Leg day', 'not_completed'],
  ['Gym class', 'Health', '2026-09-18', '18:00', '19:00', null, 'completed'],
  [
    'Read chapter',
    'Study',
    '2026-09-16',
    '19:00',
    '20:00',
    'Ch 5, then the questions',
    'completed',
  ],
  ['Groceries', 'Errand', '2026-09-17', '17:30', '18:15', 'Milk, eggs', 'not_completed'],
  ['Write essay', 'Study', '2026-09-15', '09:00', '11:00', 'Intro and outline', 'not_completed'],
  ['Clean kitchen', 'Chore', '2026-09-16', '21:00', '21:30', null, 'completed'],
] as const

const TYPE_IDS: Record<string, number> = { Health: 2, Study: 3, Errand: 4, Chore: 5 }

const BY_TIME = ['Write essay', 'Gym', 'Read chapter', 'Clean kitchen', 'Groceries', 'Gym class']

test.beforeEach(async ({ page, request }) => {
  const { email, session } = await registerAccount(request)
  const created = await request.post(rest('tasks'), {
    headers: headers(session.accessToken),
    data: SEED.map(([title, type, task_date, start_time, end_time, note, completion_status]) => ({
      title,
      task_type_id: TYPE_IDS[type],
      task_date,
      start_time,
      end_time,
      note,
      completion_status,
    })),
  })
  expect(created.status()).toBe(201)

  await page.request.post('/api/auth/login', { data: { email, password: PASSWORD } })
  await page.goto('/tasks')
  await expect(results(page)).toHaveCount(SEED.length)
})

const results = (page: Page) =>
  page.getByRole('list', { name: 'Matching tasks' }).getByRole('heading')

test.describe('F7-01 search by title', () => {
  test('shows only the tasks whose title matches', async ({ page }) => {
    await page.getByLabel('Search tasks').fill('gym')
    await expect(results(page)).toHaveText(['Gym', 'Gym class'])
    await expect(page.getByText('2 tasks', { exact: true })).toBeVisible()
  })
})

test.describe('F7-02 search by note text', () => {
  test('finds a task by the words in its note, commas included', async ({ page }) => {
    await page.getByLabel('Search tasks').fill('Ch 5, then')
    await expect(results(page)).toHaveText(['Read chapter'])
  })
})

test.describe('F7-03 filter by completion', () => {
  test('shows only completed tasks', async ({ page }) => {
    await page.getByLabel('Status').selectOption({ label: 'Completed' })
    await expect(results(page)).toHaveText(['Read chapter', 'Clean kitchen', 'Gym class'])
  })

  test('shows only tasks that are not completed', async ({ page }) => {
    await page.getByLabel('Status').selectOption({ label: 'Not completed' })
    await expect(results(page)).toHaveText(['Write essay', 'Gym', 'Groceries'])
  })
})

test.describe('F7-04 filter by type', () => {
  test('shows only Study tasks', async ({ page }) => {
    await page.getByLabel('Task type').selectOption({ label: 'Study' })
    await expect(results(page)).toHaveText(['Write essay', 'Read chapter'])
  })
})

test.describe('filter by date (FR-22.1)', () => {
  test('shows only the tasks on the chosen day', async ({ page }) => {
    await page.getByLabel('Date', { exact: true }).fill('2026-09-16')
    await expect(results(page)).toHaveText(['Gym', 'Read chapter', 'Clean kitchen'])
  })

  test('combines with the other filters', async ({ page }) => {
    await page.getByLabel('Date', { exact: true }).fill('2026-09-16')
    await page.getByLabel('Status').selectOption({ label: 'Completed' })
    await page.getByLabel('Search tasks').fill('kitchen')
    await expect(results(page)).toHaveText(['Clean kitchen'])
  })
})

test.describe('F7-05 sort by title', () => {
  test('lists tasks alphabetically', async ({ page }) => {
    await page.getByLabel('Sort by').selectOption({ label: 'Title' })
    await expect(results(page)).toHaveText([
      'Clean kitchen',
      'Groceries',
      'Gym',
      'Gym class',
      'Read chapter',
      'Write essay',
    ])
  })
})

test.describe('F7-06 sort by start time', () => {
  test('lists tasks by date and start time by default', async ({ page }) => {
    await expect(results(page)).toHaveText(BY_TIME)
  })

  test('can also sort by type and by status', async ({ page }) => {
    await page.getByLabel('Sort by').selectOption({ label: 'Task type' })
    await expect(results(page)).toHaveText([
      'Clean kitchen',
      'Groceries',
      'Gym',
      'Gym class',
      'Write essay',
      'Read chapter',
    ])

    await page.getByLabel('Sort by').selectOption({ label: 'Status' })
    await expect(results(page)).toHaveText([
      'Write essay',
      'Gym',
      'Groceries',
      'Read chapter',
      'Clean kitchen',
      'Gym class',
    ])
  })
})

test.describe('F7-07 clear filters and search', () => {
  test('restores the full list', async ({ page }) => {
    await page.getByLabel('Search tasks').fill('gym')
    await page.getByLabel('Status').selectOption({ label: 'Completed' })
    await expect(results(page)).toHaveText(['Gym class'])

    await page.getByRole('button', { name: 'Clear filters' }).first().click()

    await expect(results(page)).toHaveText(BY_TIME)
    await expect(page.getByLabel('Search tasks')).toHaveValue('')
    await expect(page).toHaveURL(/\/tasks$/)
  })

  test('offers to clear when nothing matches', async ({ page }) => {
    await page.getByLabel('Search tasks').fill('no such task')
    await expect(page.getByText('No tasks match these filters.')).toBeVisible()

    await page.getByRole('button', { name: 'Clear filters' }).last().click()
    await expect(results(page)).toHaveCount(SEED.length)
  })
})

test.describe('state and actions', () => {
  test('keeps the filters in the URL across a reload', async ({ page }) => {
    await page.getByLabel('Task type').selectOption({ label: 'Health' })
    await page.getByLabel('Sort by').selectOption({ label: 'Title' })
    await expect(results(page)).toHaveText(['Gym', 'Gym class'])

    await page.reload()
    await expect(results(page)).toHaveText(['Gym', 'Gym class'])
    await expect(page.getByLabel('Task type')).toHaveValue(String(TYPE_IDS.Health))
  })

  test('completes a task from the list', async ({ page }) => {
    await page.getByLabel('Status').selectOption({ label: 'Not completed' })
    await page.getByRole('checkbox', { name: 'Done: Groceries' }).check()

    await expect(results(page)).toHaveText(['Write essay', 'Gym'])
    await page.getByLabel('Status').selectOption({ label: 'Completed' })
    await expect(results(page)).toContainText(['Groceries'])
  })

  test('has no accessibility violations', async ({ page }) => {
    await page.getByLabel('Search tasks').fill('gym')
    await expect(results(page)).toHaveCount(2)
    await expectNoAccessibilityViolations(page)
  })
})
