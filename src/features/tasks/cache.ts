import type { CompletionStatus, TaskInput } from '@/lib/validation/task'

type StatusTask = { id: string; completion_status: string }

/** Applies a status change to whatever a task query cached: one task, a list, or nothing. */
export function withStatus<T>(data: T, id: string, status: CompletionStatus): T {
  const apply = (task: StatusTask) =>
    task.id === id ? { ...task, completion_status: status } : task

  if (Array.isArray(data)) return data.map((item: StatusTask) => apply(item)) as T
  if (data && typeof data === 'object' && 'id' in data)
    return apply(data as unknown as StatusTask) as T
  return data
}

type StoredTask = {
  title: string
  note: string | null
  task_date: string
  start_time: string
  end_time: string
  task_type_id: number
  completion_status: string
}

/** Database row to form values; times drop their seconds for `<input type="time">`. */
export function toTaskInput(task: StoredTask): TaskInput {
  return {
    title: task.title,
    note: task.note ?? '',
    taskDate: task.task_date,
    startTime: task.start_time.slice(0, 5),
    endTime: task.end_time.slice(0, 5),
    taskTypeId: task.task_type_id,
    completionStatus: task.completion_status === 'completed' ? 'completed' : 'not_completed',
  }
}
