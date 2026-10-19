import { describe, expect, it } from 'vitest'

import { changePasswordSchema } from '@/lib/validation/auth'
import {
  NOTIFICATION_TIMER_MAX_MINUTES,
  notificationTimerSchema,
  profileSchema,
} from '@/lib/validation/profile'

/** First error message for a failed parse, or null when the value was accepted. */
function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? null : (result.error?.issues[0]?.message ?? null)
}

describe('profileSchema (FR-7.1)', () => {
  it('accepts a first and last name', () => {
    expect(profileSchema.safeParse({ firstName: 'Ori', lastName: 'Jakob' }).success).toBe(true)
  })

  it('trims surrounding whitespace', () => {
    const result = profileSchema.safeParse({ firstName: '  Ori ', lastName: ' Jakob  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ firstName: 'Ori', lastName: 'Jakob' })
  })

  it.each([
    ['firstName', 'First name is required.'],
    ['lastName', 'Last name is required.'],
  ])('requires %s', (field, message) => {
    const result = profileSchema.safeParse({ firstName: 'Ori', lastName: 'Jakob', [field]: '  ' })
    expect(firstError(result)).toBe(message)
  })

  it('rejects a name longer than 60 characters', () => {
    const result = profileSchema.safeParse({ firstName: 'a'.repeat(61), lastName: 'Jakob' })
    expect(firstError(result)).toBe('First name must be 60 characters or fewer.')
  })
})

describe('notificationTimerSchema (FR-20.1)', () => {
  it.each([0, 1, 15, NOTIFICATION_TIMER_MAX_MINUTES])('accepts %i minutes', (minutes) => {
    expect(notificationTimerSchema.safeParse({ notificationTimerMinutes: minutes }).success).toBe(
      true,
    )
  })

  it.each([
    [-1, 'Lead time cannot be negative.'],
    [
      NOTIFICATION_TIMER_MAX_MINUTES + 1,
      `Lead time must be ${NOTIFICATION_TIMER_MAX_MINUTES} minutes or fewer.`,
    ],
    [2.5, 'Enter a whole number of minutes.'],
    [Number.NaN, 'Enter how many minutes before a task starts.'],
  ])('rejects %s', (minutes, message) => {
    expect(
      firstError(notificationTimerSchema.safeParse({ notificationTimerMinutes: minutes })),
    ).toBe(message)
  })

  it('does not coerce strings, so an empty input cannot silently become zero', () => {
    expect(notificationTimerSchema.safeParse({ notificationTimerMinutes: '' }).success).toBe(false)
    expect(notificationTimerSchema.safeParse({ notificationTimerMinutes: '15' }).success).toBe(
      false,
    )
  })
})

describe('changePasswordSchema (FR-7.2)', () => {
  const valid = {
    currentPassword: 'Old!Pass1',
    newPassword: 'Str0ng!Pass',
    confirmPassword: 'Str0ng!Pass',
  }

  it('accepts a complete form', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('requires the current password', () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: '' })
    expect(firstError(result)).toBe('Current password is required.')
  })

  it('applies the full password rules to the new password', () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      newPassword: 'weak',
      confirmPassword: 'weak',
    })
    expect(result.success).toBe(false)
  })

  it('reports a mismatched confirmation against the confirm field', () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: 'Str0ng!Pas' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Passwords do not match.')
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
    }
  })

  it('rejects reusing the current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'Str0ng!Pass',
      newPassword: 'Str0ng!Pass',
      confirmPassword: 'Str0ng!Pass',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Choose a password you have not used before.')
      expect(result.error.issues[0]?.path).toEqual(['newPassword'])
    }
  })
})
