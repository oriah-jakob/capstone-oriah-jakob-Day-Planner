import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { apiPost, ApiError } from '@/lib/api-client'
import { PASSWORD_MIN_LENGTH, resetPasswordSchema } from '@/lib/validation/auth'
import type { ResetPasswordInput } from '@/lib/validation/auth'

type RecoveryTokens = { accessToken: string; refreshToken: string }

/**
 * Supabase sends the user here with the tokens in the URL fragment.
 *
 * Pure on purpose: it runs as a lazy state initialiser, which strict mode
 * invokes twice. Clearing the fragment here would make the second call come up
 * empty and lock the user out of their own reset link.
 */
function readRecoveryTokens(): RecoveryTokens | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (hash === '') return null

  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken || !refreshToken) return null

  return { accessToken, refreshToken }
}

/** FR-4.2: choose a new password after following a valid reset link. */
export default function ResetPasswordPage() {
  useDocumentTitle('Choose a new password')

  const navigate = useNavigate()
  const [tokens] = useState<RecoveryTokens | null>(readRecoveryTokens)
  const [formError, setFormError] = useState<string | null>(null)

  // Strip the tokens from the address bar once they are captured, so they do
  // not linger in browser history or leak through a Referer header.
  useEffect(() => {
    if (tokens) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [tokens])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    if (!tokens) return
    setFormError(null)

    try {
      await apiPost('/api/auth/reset-password', {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        password: values.password,
      })
      await navigate('/login', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors?.password) {
        setError('password', { message: error.fieldErrors.password })
        return
      }
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      )
    }
  })

  if (!tokens) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">This link is not valid</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The reset link is invalid or has already been used. Request a new one to continue.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You will be signed out everywhere and can sign in with the new password.
      </p>

      <form onSubmit={(event) => void onSubmit(event)} noValidate className="mt-6 grid gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}

        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters, with an uppercase letter, a lowercase letter, a number, and a special character.`}
          error={errors.password?.message}
          {...register('password')}
        />

        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </>
  )
}
