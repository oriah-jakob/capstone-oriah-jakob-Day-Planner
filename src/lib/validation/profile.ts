import { z } from 'zod'

import { nameSchema } from '@/lib/validation/auth'

export const NOTIFICATION_TIMER_MIN_MINUTES = 0
export const NOTIFICATION_TIMER_MAX_MINUTES = 1440

/** FR-7.1: the profile fields a user may change themselves. */
export const profileSchema = z.object({
  firstName: nameSchema('First name'),
  lastName: nameSchema('Last name'),
})

/** FR-20.1: reminder lead time; bounds mirror the profiles CHECK constraint. */
export const notificationTimerSchema = z.object({
  notificationTimerMinutes: z
    .number({ error: 'Enter how many minutes before a task starts.' })
    .int('Enter a whole number of minutes.')
    .min(NOTIFICATION_TIMER_MIN_MINUTES, 'Lead time cannot be negative.')
    .max(
      NOTIFICATION_TIMER_MAX_MINUTES,
      `Lead time must be ${NOTIFICATION_TIMER_MAX_MINUTES} minutes or fewer.`,
    ),
})

export type ProfileInput = z.input<typeof profileSchema>
export type NotificationTimerInput = z.input<typeof notificationTimerSchema>
