import { supabase } from '@/lib/supabase'
import type { TaskValues } from '@/lib/validation/task'

const TASK_COLUMNS =
  'id, title, note, task_date, start_time, end_time, completion_status, task_type_id, task_types(type_name)'

export async function fetchTaskTypes() {
  const { data, error } = await supabase.from('task_types').select('id, type_name').order('id')
  if (error) throw error
  return data
}

/** Filtered by owner as well as RLS, since family members will be able to read other timelines. */
export async function fetchDayTasks(ownerId: string, date: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('owner_user_id', ownerId)
    .eq('task_date', date)
    .order('start_time')
    .order('end_time')
  if (error) throw error
  return data
}

export async function createTask(values: TaskValues) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: values.title,
      note: values.note,
      task_date: values.taskDate,
      start_time: values.startTime,
      end_time: values.endTime,
      task_type_id: values.taskTypeId,
      completion_status: values.completionStatus,
    })
    .select(TASK_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export type TaskType = Awaited<ReturnType<typeof fetchTaskTypes>>[number]
export type Task = Awaited<ReturnType<typeof fetchDayTasks>>[number]
