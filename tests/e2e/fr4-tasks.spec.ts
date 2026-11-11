import { expect, test, type Page } from '@playwright/test'

import { expectNoAccessibilityViolations } from './utils/a11y'
import { registerUser } from './utils/auth'

/** FR-4 timeline and tasks: F4-01 to F4-08. */

const DAY = '2026-09-16'
const NEXT_DAY = '2026-09-17'

type NewTask = {
  title: string
  start: string
  end: string
  date?: string
  type?: string
  status?: 'Completed' | 'Not completed'
  note?: string
}

async function fillTask(page: Page, task: NewTask) {
  await page.goto(`/tasks/new?date=${task.date ?? DAY}`)
  await page.getByLabel('Task title').fill(task.title)
  await page.getByLabel('Start time').fill(task.start)
  await page.getByLabel('End time').fill(task.end)
  if (task.type) await page.getByLabel('Task type').selectOption({ label: task.type })
  if (task.status) await page.getByLabel('Status').selectOption({ label: task.status })
  if (task.note) await page.getByLabel('Notes (optional)').fill(task.note)
}

async function createTask(page: Page, task: NewTask) {
  await fillTask(page, task)
  await page.getByRole('button', { name: 'Create Task' }).click()
  await expect(page).toHaveURL(new RegExp(`\\?date=${task.date ?? DAY}$`))
}

const timelineItems = (page: Page) => page.getByRole('main').getByRole('listitem')
const timelineItem = (page: Page, title: string) => timelineItems(page).filter({ hasText: title })
const dayLabel = (page: Page, text: string) => page.getByText(text, { exact: true })

test.beforeEach(async ({ page }) => {
  await registerUser(page)
})

test.describe('F4-01 create a minimal task', () => {
  test('appears on the timeline at its time and survives a refresh', async ({ page }) => {
    await createTask(page, { title: 'Morning walk', start: '07:30', end: '08:15' })

    const item = timelineItem(page, 'Morning walk')
    await expect(item).toContainText('7:30 AM')
    await expect(item).toContainText('8:15 AM')
    await expect(item).toContainText('Personal')
    await expect(item).toContainText('Not completed')

    await page.reload()
    await expect(timelineItem(page, 'Morning walk')).toBeVisible()
  })

  test('opens on the day being viewed', async ({ page }) => {
    await page.goto(`/?date=${DAY}`)
    await page.getByRole('link', { name: 'Add Task' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Create a new task' })).toBeVisible()

    await expect(page.getByLabel('Date', { exact: true })).toHaveValue(DAY)
  })
})

test.describe('F4-02 create a task with a note and type', () => {
  test('shows the note, type and status on the timeline', async ({ page }) => {
    await createTask(page, {
      title: 'Read chapter',
      start: '19:00',
      end: '20:00',
      type: 'Study',
      status: 'Completed',
      note: 'Ch 5, then the review questions',
    })

    const item = timelineItem(page, 'Read chapter')
    await expect(item).toContainText('Ch 5, then the review questions')
    await expect(item).toContainText('Study')
    await expect(item).toContainText('Completed')
    await expect(page.getByText('1 task scheduled, 1 completed.')).toBeVisible()
  })
})

test.describe('F4-03 create an invalid task', () => {
  test('blocks an end time before the start time', async ({ page }) => {
    await fillTask(page, { title: 'Backwards', start: '10:00', end: '09:00' })
    await page.getByRole('button', { name: 'Create Task' }).click()

    await expect(page.getByRole('alert')).toHaveText('End time must be after the start time.')
    await expect(page).toHaveURL(/\/tasks\/new/)

    await page.goto(`/?date=${DAY}`)
    await expect(page.getByText('Nothing is scheduled for this day.')).toBeVisible()
  })

  test('requires a title and both times', async ({ page }) => {
    await page.goto(`/tasks/new?date=${DAY}`)
    await page.getByRole('button', { name: 'Create Task' }).click()

    await expect(page.getByText('Title is required.')).toBeVisible()
    await expect(page.getByText('Start time is required.')).toBeVisible()
    await expect(page.getByText('End time is required.')).toBeVisible()
  })

  test('cancel leaves the timeline untouched', async ({ page }) => {
    await fillTask(page, { title: 'Never saved', start: '10:00', end: '11:00' })
    await page.getByRole('link', { name: 'Cancel' }).click()

    await expect(page).toHaveURL(new RegExp(`\\?date=${DAY}$`))
    await expect(page.getByText('Nothing is scheduled for this day.')).toBeVisible()
  })
})

test.describe('F4-04 edit a task', () => {
  test('saves a new title, time and note that survive a refresh', async ({ page }) => {
    await createTask(page, { title: 'Gym', start: '07:00', end: '08:00' })

    await page.getByRole('link', { name: 'Edit Gym' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Edit task' })).toBeVisible()
    await expect(page.getByLabel('Task title')).toHaveValue('Gym')
    await expect(page.getByLabel('Start time')).toHaveValue('07:00')

    await page.getByLabel('Task title').fill('Evening gym')
    await page.getByLabel('Start time').fill('18:00')
    await page.getByLabel('End time').fill('19:15')
    await page.getByLabel('Notes (optional)').fill('Upper body')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page).toHaveURL(new RegExp(`\\?date=${DAY}$`))

    await page.reload()
    await expect(timelineItems(page)).toHaveCount(1)
    const item = timelineItem(page, 'Evening gym')
    await expect(item).toContainText('6:00 PM')
    await expect(item).toContainText('7:15 PM')
    await expect(item).toContainText('Upper body')
  })

  test('moves a task to another day', async ({ page }) => {
    await createTask(page, { title: 'Dentist', start: '10:00', end: '11:00' })

    await page.getByRole('link', { name: 'Edit Dentist' }).click()
    await page.getByLabel('Date', { exact: true }).fill(NEXT_DAY)
    await page.getByRole('button', { name: 'Save changes' }).click()

    await expect(page).toHaveURL(new RegExp(`\\?date=${NEXT_DAY}$`))
    await expect(timelineItem(page, 'Dentist')).toBeVisible()
    await page.getByRole('button', { name: 'Previous day' }).click()
    await expect(page.getByText('Nothing is scheduled for this day.')).toBeVisible()
  })

  test('blocks an invalid edit and keeps what was typed (NFR-12)', async ({ page }) => {
    await createTask(page, { title: 'Gym', start: '07:00', end: '08:00' })

    await page.getByRole('link', { name: 'Edit Gym' }).click()
    await page.getByLabel('Task title').fill('Gym, but later')
    await page.getByLabel('End time').fill('06:00')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await expect(page.getByRole('alert')).toHaveText('End time must be after the start time.')
    await expect(page.getByLabel('Task title')).toHaveValue('Gym, but later')

    await page.goto(`/?date=${DAY}`)
    await expect(timelineItem(page, 'Gym')).toContainText('8:00 AM')
    await expect(page.getByText('Gym, but later')).toHaveCount(0)
  })
})

test.describe('F4-05 delete a task', () => {
  test('removes the task once confirmed, and it does not come back', async ({ page }) => {
    await createTask(page, { title: 'Laundry', start: '10:00', end: '11:00' })

    await page.getByRole('button', { name: 'Delete Laundry' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Delete this task?' })
    await expect(dialog).toContainText('Laundry')
    await dialog.getByRole('button', { name: 'Delete task' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText('Nothing is scheduled for this day.')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Nothing is scheduled for this day.')).toBeVisible()
  })

  test('keeps the task when the delete is cancelled', async ({ page }) => {
    await createTask(page, { title: 'Laundry', start: '10:00', end: '11:00' })

    await page.getByRole('button', { name: 'Delete Laundry' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()

    await page.reload()
    await expect(timelineItem(page, 'Laundry')).toBeVisible()
  })
})

test.describe('F4-06 mark complete and incomplete', () => {
  test('saves the status and keeps it after a refresh', async ({ page }) => {
    await createTask(page, { title: 'Read', start: '20:00', end: '21:00' })
    const done = page.getByRole('checkbox', { name: 'Done: Read' })

    await done.check()
    await expect(timelineItem(page, 'Read')).toContainText('Completed')
    await expect(page.getByText('1 task scheduled, 1 completed.')).toBeVisible()
    await page.reload()
    await expect(done).toBeChecked()

    await done.uncheck()
    await expect(timelineItem(page, 'Read')).toContainText('Not completed')
    await page.reload()
    await expect(done).not.toBeChecked()
  })

  test('puts the status back when the save fails (NFR-12)', async ({ page }) => {
    await createTask(page, { title: 'Read', start: '20:00', end: '21:00' })
    await page.route('**/rest/v1/tasks?**', (route) =>
      route.request().method() === 'PATCH'
        ? route.fulfill({ status: 500, body: '{}' })
        : route.continue(),
    )

    await page.getByRole('checkbox', { name: 'Done: Read' }).click()

    await expect(page.getByRole('alert')).toHaveText('We could not save that change.')
    await expect(page.getByRole('checkbox', { name: 'Done: Read' })).not.toBeChecked()
    await page.unroute('**/rest/v1/tasks?**')
    await page.reload()
    await expect(timelineItem(page, 'Read')).toContainText('Not completed')
  })
})

test.describe('F4-07 day navigation', () => {
  test('moves between days and keeps the day across a refresh', async ({ page }) => {
    await createTask(page, { title: 'Wednesday task', start: '09:00', end: '10:00' })
    await createTask(page, { title: 'Thursday task', date: NEXT_DAY, start: '09:00', end: '10:00' })

    await page.getByRole('button', { name: 'Previous day' }).click()
    await expect(dayLabel(page, 'Wednesday, September 16')).toBeVisible()
    await expect(timelineItem(page, 'Wednesday task')).toBeVisible()
    await expect(timelineItem(page, 'Thursday task')).toHaveCount(0)

    await page.getByRole('button', { name: 'Next day' }).click()
    await expect(page).toHaveURL(new RegExp(`\\?date=${NEXT_DAY}$`))
    await expect(timelineItem(page, 'Thursday task')).toBeVisible()
    await expect(timelineItem(page, 'Wednesday task')).toHaveCount(0)

    await page.reload()
    await expect(dayLabel(page, 'Thursday, September 17')).toBeVisible()
    await expect(timelineItem(page, 'Thursday task')).toBeVisible()
  })

  test('jumps to a chosen date and back to today', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Go to date').fill(DAY)

    await expect(page).toHaveURL(new RegExp(`\\?date=${DAY}$`))
    await expect(dayLabel(page, 'Wednesday, September 16')).toBeVisible()

    await page.getByRole('button', { name: 'Today' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Today' })).toBeDisabled()
  })
})

test.describe('F4-08 chronological ordering', () => {
  test('lists tasks created at 18:00, 7:00 and 9:00 by start time', async ({ page }) => {
    await createTask(page, { title: 'Dinner', start: '18:00', end: '19:00' })
    await createTask(page, { title: 'Gym', start: '07:00', end: '08:00' })
    await createTask(page, { title: 'Work', start: '09:00', end: '17:00' })

    await expect(timelineItems(page).getByRole('heading')).toHaveText(['Gym', 'Work', 'Dinner'])
  })
})

test.describe('security (NFR-2, SEC-02)', () => {
  test('renders markup in a note as text instead of running it', async ({ page }) => {
    let dialogOpened = false
    page.on('dialog', (dialog) => {
      dialogOpened = true
      void dialog.dismiss()
    })

    await createTask(page, {
      title: 'Injection attempt',
      start: '12:00',
      end: '12:30',
      note: '<script>alert(1)</script><img src=x onerror=alert(2)>',
    })

    await expect(timelineItem(page, 'Injection attempt')).toContainText('<script>alert(1)</script>')
    await expect(page.locator('main img')).toHaveCount(0)
    expect(dialogOpened).toBe(false)
  })
})

test.describe('accessibility', () => {
  test('the create form has no violations, including with errors', async ({ page }) => {
    await page.goto(`/tasks/new?date=${DAY}`)
    await expect(page.getByLabel('Task title')).toBeVisible()
    await expectNoAccessibilityViolations(page)

    await page.getByRole('button', { name: 'Create Task' }).click()
    await expect(page.getByText('Title is required.')).toBeVisible()
    await expectNoAccessibilityViolations(page)
  })

  test('the edit page and the delete dialog have no violations', async ({ page }) => {
    await createTask(page, { title: 'Gym', start: '07:00', end: '08:00' })

    await page.getByRole('button', { name: 'Delete Gym' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expectNoAccessibilityViolations(page)
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()

    await page.getByRole('link', { name: 'Edit Gym' }).click()
    await expect(page.getByLabel('Task title')).toHaveValue('Gym')
    await expectNoAccessibilityViolations(page)
  })

  test('the timeline has no violations with tasks on it', async ({ page }) => {
    await createTask(page, {
      title: 'Done already',
      start: '08:00',
      end: '09:00',
      status: 'Completed',
    })
    await createTask(page, { title: 'Still to do', start: '10:00', end: '11:00', note: 'A note' })

    await expectNoAccessibilityViolations(page)
  })
})
