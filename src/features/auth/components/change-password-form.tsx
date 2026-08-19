import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/components/form-alert'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { ApiError } from '@/lib/api-client'
import { toUserMessage } from '@/lib/errors'
import {
  changePasswordSchema,
  PASSWORD_HINT,
  type ChangePasswordInput,
} from '@/lib/validation/auth'

/** FR-7.2: change password by confirming the current one. */
export function ChangePasswordForm() {
  const { changePassword } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setChanged(false)
    try {
      await changePassword(values.currentPassword, values.newPassword)
      reset()
      setChanged(true)
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof ChangePasswordInput, { message })
        }
        return
      }
      setFormError(toUserMessage(error))
    }
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="grid gap-4">
      {changed && <FormAlert variant="success">Your password has been updated.</FormAlert>}
      {formError && <FormAlert>{formError}</FormAlert>}

      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />

      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint={PASSWORD_HINT}
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />

      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </form>
  )
}
