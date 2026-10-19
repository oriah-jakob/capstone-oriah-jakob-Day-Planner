import { describe, expect, it } from 'vitest'

import { sortChronologically, summarizeDay } from '@/features/tasks/timeline'

const task = (title: string, start_time: string, end_time: string, done = false) => ({
  title,
  start_time,
  end_time,
  completion_status: done ? 'completed' : 'not_completed',
})

describe('sortChronologically (F4-08)', () => {
  it('orders tasks at 18:00, 07:00 and 09:00 by start time', () => {
    const tasks = [
      task('Dinner', '18:00:00', '19:00:00'),
      task('Gym', '07:00:00', '08:00:00'),
      task('Work', '09:00:00', '17:00:00'),
    ]

    expect(sortChronologically(tasks).map((t) => t.title)).toEqual(['Gym', 'Work', 'Dinner'])
  })

  it('compares hours numerically, not as single digits', () => {
    const tasks = [task('Late', '10:00:00', '11:00:00'), task('Early', '09:59:00', '10:00:00')]
    expect(sortChronologically(tasks).map((t) => t.title)).toEqual(['Early', 'Late'])
  })

  it('puts a midnight start first', () => {
    const tasks = [task('Morning', '06:00:00', '07:00:00'), task('Night', '00:00:00', '00:30:00')]
    expect(sortChronologically(tasks)[0]?.title).toBe('Night')
  })

  it('breaks a start time tie by end time, then title', () => {
    const tasks = [
      task('long', '09:00:00', '11:00:00'),
      task('beta', '09:00:00', '10:00:00'),
      task('Alpha', '09:00:00', '10:00:00'),
    ]
    expect(sortChronologically(tasks).map((t) => t.title)).toEqual(['Alpha', 'beta', 'long'])
  })

  it('does not mutate the input', () => {
    const tasks = [task('B', '10:00:00', '11:00:00'), task('A', '08:00:00', '09:00:00')]
    sortChronologically(tasks)
    expect(tasks.map((t) => t.title)).toEqual(['B', 'A'])
  })

  it('handles an empty day', () => {
    expect(sortChronologically([])).toEqual([])
  })
})

describe('summarizeDay', () => {
  it('counts completed and remaining tasks', () => {
    const tasks = [
      task('A', '07:00:00', '08:00:00', true),
      task('B', '09:00:00', '10:00:00'),
      task('C', '11:00:00', '12:00:00'),
    ]
    expect(summarizeDay(tasks)).toEqual({ total: 3, completed: 1, remaining: 2 })
  })

  it('is all zeros for an empty day', () => {
    expect(summarizeDay([])).toEqual({ total: 0, completed: 0, remaining: 0 })
  })
})
