import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/components/form-alert'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { familyErrorMessage } from '@/features/family/members'
import { useAddFamilyMember } from '@/features/family/use-family'
import { addMemberSchema, type AddMemberInput } from '@/lib/validation/family'

/** FR-17: link an existing account by its email address. */
export function AddMemberForm() {
  const addMember = useAddFamilyMember()
  const [formError, setFormError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setAdded(false)
    try {
      await addMember.mutateAsync(values.email)
      reset()
      setAdded(true)
    } catch (error) {
      setFormError(familyErrorMessage(error))
    }
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="grid gap-4">
      {added && <FormAlert variant="success">Member added.</FormAlert>}
      {formError && <FormAlert>{formError}</FormAlert>}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <TextField
            label="Member's email address"
            type="email"
            autoComplete="off"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add member'}
        </Button>
      </div>
    </form>
  )
}
