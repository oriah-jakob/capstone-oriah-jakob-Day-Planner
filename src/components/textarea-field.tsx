import { type ComponentProps, type Ref } from 'react'

import { FormField } from '@/components/form-field'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type TextareaFieldProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  label: string
  error?: string | undefined
  hint?: string | undefined
  ref?: Ref<HTMLTextAreaElement>
}

export function TextareaField({
  label,
  error,
  hint,
  className,
  ref,
  ...props
}: TextareaFieldProps) {
  return (
    <FormField label={label} error={error} hint={hint}>
      {(control) => (
        <Textarea
          {...control}
          ref={ref}
          className={cn(error && 'border-destructive', className)}
          {...props}
        />
      )}
    </FormField>
  )
}
