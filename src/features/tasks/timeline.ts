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
