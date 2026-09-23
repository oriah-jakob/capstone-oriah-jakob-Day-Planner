import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ApiError } from '@/lib/api-client'
import { PASSWORD_MIN_LENGTH, registerSchema, type RegisterInput } from '@/lib/validation/auth'

/** FR-1: register a Personal account. */
export default function RegisterPage() {
  useDocumentTitle('Create account')

  const { register: createAccount } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await createAccount({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })
      await navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('email', { message: error.message })
        return
      }
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof RegisterInput, { message })
        }
        return
      }
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      )
    }
  })

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start planning your day in a single timeline.
      </p>

      <form onSubmit={(event) => void onSubmit(event)} noValidate className="mt-6 grid gap-4">
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
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters, with an uppercase letter, a lowercase letter, a number, and a special character.`}
          error={errors.password?.message}
          {...register('password')}
        />

        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary underline underline-offset-2">
          Log in
        </Link>
      </p>
    </>
  )
}
