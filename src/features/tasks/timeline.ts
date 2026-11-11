import type { SortKey } from '@/features/tasks/search'

type TimelineTask = {
  title: string
  start_time: string
  end_time: string
  completion_status: string
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** FR-12.1: by start time, then end time, then title so equal slots stay stable. */
export function sortChronologically<T extends TimelineTask>(tasks: readonly T[]): T[] {
  return [...tasks].sort(
    (a, b) =>
      compare(a.start_time, b.start_time) ||
      compare(a.end_time, b.end_time) ||
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  )
}

export function summarizeDay(tasks: readonly TimelineTask[]) {
  const completed = tasks.filter((task) => task.completion_status === 'completed').length
  return { total: tasks.length, completed, remaining: tasks.length - completed }
}

type ListTask = TimelineTask & { task_date: string; task_types: { type_name: string } }

const byText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' })

const byWhen = (a: ListTask, b: ListTask) =>
  compare(a.task_date, b.task_date) ||
  compare(a.start_time, b.start_time) ||
  compare(a.end_time, b.end_time) ||
  byText(a.title, b.title)

const STATUS_ORDER: Record<string, number> = { not_completed: 0, completed: 1 }

const BY_KEY: Record<SortKey, (a: ListTask, b: ListTask) => number> = {
  date: () => 0,
  title: (a, b) => byText(a.title, b.title),
  type: (a, b) => byText(a.task_types.type_name, b.task_types.type_name),
  status: (a, b) =>
    (STATUS_ORDER[a.completion_status] ?? 0) - (STATUS_ORDER[b.completion_status] ?? 0),
}

/** FR-23.1: ties fall back to date and time so the order never jumps around. */
export function sortTasks<T extends ListTask>(tasks: readonly T[], key: SortKey): T[] {
  const primary = BY_KEY[key]
  return [...tasks].sort((a, b) => primary(a, b) || byWhen(a, b))
}
