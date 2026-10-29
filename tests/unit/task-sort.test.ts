import { describe, expect, it } from 'vitest'

import { sortTasks } from '@/features/tasks/timeline'

const task = (
  title: string,
  task_date: string,
  start_time: string,
  type_name: string,
  completed = false,
) => ({
  title,
  task_date,
  start_time,
  end_time: '23:59:00',
  completion_status: completed ? 'completed' : 'not_completed',
  task_types: { type_name },
})

const tasks = [
  task('write essay', '2026-09-15', '09:00:00', 'Study'),
  task('Read chapter', '2026-09-16', '19:00:00', 'Study', true),
  task('Gym', '2026-09-16', '07:00:00', 'Health'),
  task('Clean kitchen', '2026-09-16', '21:00:00', 'Chore', true),
  task('Groceries', '2026-09-17', '17:30:00', 'Errand'),
]

const titles = (list: { title: string }[]) => list.map((t) => t.title)

describe('sortTasks (FR-23)', () => {
  it('sorts by date, then start time (F7-06)', () => {
    expect(titles(sortTasks(tasks, 'date'))).toEqual([
      'write essay',
      'Gym',
      'Read chapter',
      'Clean kitchen',
      'Groceries',
    ])
  })

  it('sorts by title alphabetically, ignoring case (F7-05)', () => {
    expect(titles(sortTasks(tasks, 'title'))).toEqual([
      'Clean kitchen',
      'Groceries',
      'Gym',
      'Read chapter',
      'write essay',
    ])
  })

  it('sorts by type, then by date and time within a type', () => {
    expect(titles(sortTasks(tasks, 'type'))).toEqual([
      'Clean kitchen',
      'Groceries',
      'Gym',
      'write essay',
      'Read chapter',
    ])
  })

  it('puts not completed before completed, then date and time', () => {
    expect(titles(sortTasks(tasks, 'status'))).toEqual([
      'write essay',
      'Gym',
      'Groceries',
      'Read chapter',
      'Clean kitchen',
    ])
  })

  it('does not mutate the input', () => {
    const copy = [...tasks]
    sortTasks(tasks, 'title')
    expect(tasks).toEqual(copy)
  })
})
