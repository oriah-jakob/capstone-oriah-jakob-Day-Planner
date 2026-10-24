import { describe, expect, it } from 'vitest'

import { toTaskInput, withStatus } from '@/features/tasks/cache'

const task = (id: string, completion_status = 'not_completed') => ({
  id,
  completion_status,
  title: id,
})

describe('withStatus', () => {
  it('changes only the matching task in a list', () => {
    const list = [task('a'), task('b')]
    expect(withStatus(list, 'b', 'completed')).toEqual([task('a'), task('b', 'completed')])
  })

  it('does not mutate the cached list', () => {
    const list = [task('a')]
    withStatus(list, 'a', 'completed')
    expect(list[0]?.completion_status).toBe('not_completed')
  })

  it('updates a single cached task', () => {
    expect(withStatus(task('a', 'completed'), 'a', 'not_completed')).toEqual(task('a'))
  })

  it('leaves a different single task alone', () => {
    const other = task('b')
    expect(withStatus(other, 'a', 'completed')).toBe(other)
  })

  it.each([undefined, null])('passes %s through for queries that have not loaded', (empty) => {
    expect(withStatus(empty, 'a', 'completed')).toBe(empty)
  })
})

describe('toTaskInput', () => {
  const stored = {
    title: 'Gym',
    note: null,
    task_date: '2026-09-16',
    start_time: '07:30:00',
    end_time: '08:15:00',
    task_type_id: 2,
    completion_status: 'completed',
  }

  it('maps a stored task onto the form fields', () => {
    expect(toTaskInput(stored)).toEqual({
      title: 'Gym',
      note: '',
      taskDate: '2026-09-16',
      startTime: '07:30',
      endTime: '08:15',
      taskTypeId: 2,
      completionStatus: 'completed',
    })
  })

  it('keeps an existing note', () => {
    expect(toTaskInput({ ...stored, note: 'Leg day' }).note).toBe('Leg day')
  })

  it('treats an unknown status as not completed', () => {
    expect(toTaskInput({ ...stored, completion_status: 'unknown' }).completionStatus).toBe(
      'not_completed',
    )
  })
})
