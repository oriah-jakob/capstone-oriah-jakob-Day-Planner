import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/components/form-alert'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/features/profile/api'
import { useUpdateProfile } from '@/features/profile/use-profile'
import { toUserMessage } from '@/lib/errors'
import {
  NOTIFICATION_TIMER_MAX_MINUTES,
  NOTIFICATION_TIMER_MIN_MINUTES,
  notificationTimerSchema,
  type NotificationTimerInput,
} from '@/lib/validation/profile'

/** FR-7.1 / FR-20.1: how many minutes before a task the reminder email is sent. */
export function NotificationTimerForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NotificationTimerInput>({
    resolver: zodResolver(notificationTimerSchema),
    defaultValues: { notificationTimerMinutes: profile.notification_timer_minutes },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setSaved(false)
    try {
      const next = await update.mutateAsync({
        notification_timer_minutes: values.notificationTimerMinutes,
      })
      reset({ notificationTimerMinutes: next.notification_timer_minutes })
      setSaved(true)
    } catch (error) {
      setFormError(toUserMessage(error))
    }
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="grid gap-4">
      {saved && <FormAlert variant="success">Reminder lead time saved.</FormAlert>}
      {formError && <FormAlert>{formError}</FormAlert>}

      <TextField
        label="Lead time (minutes)"
        type="number"
        inputMode="numeric"
        min={NOTIFICATION_TIMER_MIN_MINUTES}
        max={NOTIFICATION_TIMER_MAX_MINUTES}
        step={1}
        hint={`Between ${NOTIFICATION_TIMER_MIN_MINUTES} and ${NOTIFICATION_TIMER_MAX_MINUTES} minutes. Use 0 to be reminded when the task starts.`}
        error={errors.notificationTimerMinutes?.message}
        {...register('notificationTimerMinutes', { valueAsNumber: true })}
      />

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save lead time'}
        </Button>
      </div>
    </form>
  )
}
