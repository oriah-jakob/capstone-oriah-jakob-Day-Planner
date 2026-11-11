import { supabase } from '@/lib/supabase'
import type { CompletionStatus, TaskValues } from '@/lib/validation/task'

const TASK_COLUMNS =
  'id, owner_user_id, title, note, task_date, start_time, end_time, completion_status, task_type_id, task_types(type_name)'

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

/** Null when the task does not exist or RLS hides it. */
export async function fetchTask(id: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

function toRow(values: TaskValues) {
  return {
    title: values.title,
    note: values.note,
    task_date: values.taskDate,
    start_time: values.startTime,
    end_time: values.endTime,
    task_type_id: values.taskTypeId,
    completion_status: values.completionStatus,
  }
}

export async function createTask(values: TaskValues) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(toRow(values))
    .select(TASK_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, values: TaskValues) {
  const { data, error } = await supabase
    .from('tasks')
    .update(toRow(values))
    .eq('id', id)
    .select(TASK_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function setTaskStatus(id: string, status: CompletionStatus) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ completion_status: status })
    .eq('id', id)
    .select(TASK_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export class TaskNotDeletedError extends Error {
  constructor() {
    super('The task was not deleted.')
    this.name = 'TaskNotDeletedError'
  }
}

/** RLS turns a forbidden delete into "0 rows", so an empty result is treated as a failure. */
export async function deleteTask(id: string) {
  const { data, error } = await supabase.from('tasks').delete().eq('id', id).select('id')
  if (error) throw error
  if (data.length === 0) throw new TaskNotDeletedError()
}

export type TaskType = Awaited<ReturnType<typeof fetchTaskTypes>>[number]
export type Task = Awaited<ReturnType<typeof fetchDayTasks>>[number]
