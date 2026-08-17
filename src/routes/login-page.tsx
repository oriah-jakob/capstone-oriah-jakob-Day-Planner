import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ApiError } from '@/lib/api-client'
import { loginSchema, type LoginInput } from '@/lib/validation/auth'

/** FR-2: log in with email address and password. */
export default function LoginPage() {
  useDocumentTitle('Sign in')

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Send the user back to whatever they were trying to reach before the guard
  // bounced them here.
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values.email, values.password)
      await navigate(from, { replace: true })
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      )
    }
  })

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to view your schedule, task reminders, and profile settings.
      </p>

      <form onSubmit={(event) => void onSubmit(event)} noValidate className="mt-6 grid gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}

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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="text-sm">
          <Link to="/forgot-password" className="text-primary underline underline-offset-2">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Remmi?{' '}
        <Link to="/register" className="text-primary underline underline-offset-2">
          Create your account
        </Link>
      </p>
    </>
  )
}
