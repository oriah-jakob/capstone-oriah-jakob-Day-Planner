import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/components/form-alert'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/features/profile/api'
import { useUpdateProfile } from '@/features/profile/use-profile'
import { toUserMessage } from '@/lib/errors'
import { profileSchema, type ProfileInput } from '@/lib/validation/profile'

type ProfileFormProps = {
  profile: Profile
  onCancel: () => void
  onSaved: () => void
}

/** FR-7.1: edit first and last name. */
export function ProfileForm({ profile, onCancel, onSaved }: ProfileFormProps) {
  const update = useUpdateProfile()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: profile.first_name, lastName: profile.last_name },
  })

  useEffect(() => {
    setFocus('firstName')
  }, [setFocus])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await update.mutateAsync({ first_name: values.firstName, last_name: values.lastName })
      onSaved()
    } catch (error) {
      setFormError(toUserMessage(error))
    }
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="grid gap-4">
      {formError && <FormAlert>{formError}</FormAlert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <TextField
          label="Last name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <TextField
        label="Email address"
        type="email"
        value={profile.email}
        readOnly
        hint="Your sign-in address cannot be changed here."
        className="bg-muted"
      />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
