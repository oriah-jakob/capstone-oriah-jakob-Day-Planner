import { cn } from '@/lib/utils'

type FormAlertProps = {
  children: React.ReactNode
  variant?: 'error' | 'success'
}

/**
 * Form-level message. Uses role="alert" so it is announced when it appears,
 * which matters because a failed sign-in otherwise gives a screen reader user
 * no feedback at all.
 */
export function FormAlert({ children, variant = 'error' }: FormAlertProps) {
  return (
    <p
      role="alert"
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        variant === 'error'
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-success/40 bg-success/10 text-success',
      )}
    >
      {children}
    </p>
  )
}
