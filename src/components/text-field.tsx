import { type ComponentProps, type Ref } from 'react'

import { FormField } from '@/components/form-field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  error?: string | undefined
  hint?: string | undefined
  ref?: Ref<HTMLInputElement>
}

export function TextField({ label, error, hint, className, ref, ...props }: TextFieldProps) {
  return (
    <FormField label={label} error={error} hint={hint}>
      {(control) => (
        <Input
          {...control}
          ref={ref}
          className={cn(error && 'border-destructive', className)}
          {...props}
        />
      )}
    </FormField>
  )
}
