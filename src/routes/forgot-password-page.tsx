import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { apiPost, ApiError } from '@/lib/api-client'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth'

/** FR-4.1: request a password reset email. */
export default function ForgotPasswordPage() {
  useDocumentTitle('Reset password')

  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await apiPost('/api/auth/request-password-reset', { email: values.email })
      setSent(true)
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      )
    }
  })

  if (sent) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        {/* Deliberately does not confirm whether the address has an account. */}
        <p className="mt-2 text-sm text-muted-foreground">
          If that email address has an account, a reset link is on its way. The link expires after a
          short time, so use it soon.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email address and we will send you a link to choose a new password.
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link to="/login" className="text-primary underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
    </>
  )
}
