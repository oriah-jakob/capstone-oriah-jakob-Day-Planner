import { useId, type ComponentProps, type Ref } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  error?: string | undefined
  hint?: string | undefined
  ref?: Ref<HTMLInputElement>
}

/**
 * Label, input, optional hint, and error message wired together.
 *
 * The error is announced (role="alert") and linked with aria-describedby rather
 * than being conveyed by colour alone, and aria-invalid marks the control
 * itself — otherwise a screen reader user gets no signal that the field failed.
 */
export function TextField({ label, error, hint, className, ref, ...props }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>

      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      <Input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        className={cn(error && 'border-destructive', className)}
        {...props}
      />

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
