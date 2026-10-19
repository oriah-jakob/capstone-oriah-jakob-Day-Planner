import { describe, expect, it } from 'vitest'

import { TASK_NOTE_MAX_LENGTH, TASK_TITLE_MAX_LENGTH, taskSchema } from '@/lib/validation/task'

function firstError(result: {
  success: boolean
  error?: { issues: { message: string; path: PropertyKey[] }[] }
}) {
  return result.success ? null : (result.error?.issues[0] ?? null)
}

const valid = {
  title: 'Gym',
  note: '',
  taskDate: '2026-09-16',
  startTime: '07:00',
  endTime: '08:00',
  taskTypeId: 2,
  completionStatus: 'not_completed' as const,
}

describe('taskSchema (FR-11.1)', () => {
  it('accepts a minimal task and stores an empty note as null', () => {
    const result = taskSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.note).toBeNull()
  })

  it('trims the title and note', () => {
    const result = taskSchema.safeParse({ ...valid, title: '  Gym  ', note: '  Leg day ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Gym')
      expect(result.data.note).toBe('Leg day')
    }
  })

  it('treats a whitespace-only note as no note', () => {
    const result = taskSchema.safeParse({ ...valid, note: '   ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.note).toBeNull()
  })

  it.each([
    [{ title: '   ' }, 'Title is required.'],
    [
      { title: 'a'.repeat(TASK_TITLE_MAX_LENGTH + 1) },
      `Title must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`,
    ],
    [
      { note: 'a'.repeat(TASK_NOTE_MAX_LENGTH + 1) },
      `Note must be ${TASK_NOTE_MAX_LENGTH} characters or fewer.`,
    ],
    [{ taskDate: '' }, 'Date is required.'],
    [{ taskDate: '2026-02-30' }, 'Enter a valid date.'],
    [{ startTime: '' }, 'Start time is required.'],
    [{ endTime: '24:00' }, 'Enter a valid end time.'],
    [{ taskTypeId: Number.NaN }, 'Choose a task type.'],
    [{ taskTypeId: undefined }, 'Choose a task type.'],
    [{ completionStatus: 'done' }, 'Choose a status.'],
  ])('rejects %j', (override, message) => {
    expect(firstError(taskSchema.safeParse({ ...valid, ...override }))?.message).toBe(message)
  })

  it('accepts a title of exactly the maximum length', () => {
    const title = 'a'.repeat(TASK_TITLE_MAX_LENGTH)
    expect(taskSchema.safeParse({ ...valid, title }).success).toBe(true)
  })
})

describe('end after start (F4-03)', () => {
  it('blocks an end time before the start time, on the end time field', () => {
    const issue = firstError(
      taskSchema.safeParse({ ...valid, startTime: '09:00', endTime: '08:00' }),
    )
    expect(issue?.message).toBe('End time must be after the start time.')
    expect(issue?.path).toEqual(['endTime'])
  })

  it('blocks a task that ends when it starts', () => {
    expect(taskSchema.safeParse({ ...valid, endTime: '07:00' }).success).toBe(false)
  })

  it.each([
    ['00:00', '00:01'],
    ['11:59', '12:00'],
    ['09:30', '23:59'],
  ])('accepts %s to %s', (startTime, endTime) => {
    expect(taskSchema.safeParse({ ...valid, startTime, endTime }).success).toBe(true)
  })
})
