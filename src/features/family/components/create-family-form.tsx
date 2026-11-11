import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/components/form-alert'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { familyErrorMessage } from '@/features/family/members'
import { useCreateFamily } from '@/features/family/use-family'
import { createFamilySchema, type CreateFamilyInput } from '@/lib/validation/family'

/** FR-16: the person who creates the family becomes its owner. */
export function CreateFamilyForm() {
  const createFamily = useCreateFamily()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFamilyInput>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: { familyName: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await createFamily.mutateAsync(values.familyName)
    } catch (error) {
      setFormError(familyErrorMessage(error))
    }
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="grid max-w-md gap-4">
      {formError && <FormAlert>{formError}</FormAlert>}
      <TextField
        label="Family name"
        autoComplete="off"
        error={errors.familyName?.message}
        {...register('familyName')}
      />
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create family'}
        </Button>
      </div>
    </form>
  )
}
