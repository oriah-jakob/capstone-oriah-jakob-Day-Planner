import { useId, type ReactNode } from 'react'

import { Label } from '@/components/ui/label'

export type ControlProps = {
  id: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
}

type FormFieldProps = {
  label: string
  error?: string | undefined
  hint?: string | undefined
  children: (control: ControlProps) => ReactNode
}

/** Label, hint, and error linked to one control so a failure is announced, not only coloured. */
export function FormField({ label, error, hint, children }: FormFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>

      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy === '' ? undefined : describedBy,
      })}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
