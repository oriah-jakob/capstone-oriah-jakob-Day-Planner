import { z } from 'zod'

import { isIsoDate } from '@/lib/datetime'

export const TASK_TITLE_MAX_LENGTH = 120
export const TASK_NOTE_MAX_LENGTH = 1000

export const COMPLETION_STATUSES = ['not_completed', 'completed'] as const
export type CompletionStatus = (typeof COMPLETION_STATUSES)[number]

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/

const timeSchema = (label: string) =>
  z.string().min(1, `${label} is required.`).regex(HH_MM, `Enter a valid ${label.toLowerCase()}.`)

/** FR-11.1: what the create task form collects. Bounds mirror the tasks table checks. */
export const taskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required.')
      .max(TASK_TITLE_MAX_LENGTH, `Title must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`),
    note: z
      .string()
      .trim()
      .max(TASK_NOTE_MAX_LENGTH, `Note must be ${TASK_NOTE_MAX_LENGTH} characters or fewer.`)
      .transform((value) => (value === '' ? null : value)),
    taskDate: z.string().min(1, 'Date is required.').refine(isIsoDate, 'Enter a valid date.'),
    startTime: timeSchema('Start time'),
    endTime: timeSchema('End time'),
    taskTypeId: z
      .number({ error: 'Choose a task type.' })
      .int('Choose a task type.')
      .positive('Choose a task type.'),
    completionStatus: z.enum(COMPLETION_STATUSES, { error: 'Choose a status.' }),
  })
  .refine((task) => task.endTime > task.startTime, {
    message: 'End time must be after the start time.',
    path: ['endTime'],
  })

export type TaskInput = z.input<typeof taskSchema>
export type TaskValues = z.output<typeof taskSchema>
