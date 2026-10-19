import { type ComponentProps, type Ref } from 'react'

import { FormField } from '@/components/form-field'
import { NativeSelect } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'

type SelectFieldProps = Omit<ComponentProps<'select'>, 'id'> & {
  label: string
  error?: string | undefined
  hint?: string | undefined
  ref?: Ref<HTMLSelectElement>
}

export function SelectField({
  label,
  error,
  hint,
  className,
  ref,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <FormField label={label} error={error} hint={hint}>
      {(control) => (
        <NativeSelect
          {...control}
          ref={ref}
          className={cn(error && 'border-destructive', className)}
          {...props}
        >
          {children}
        </NativeSelect>
      )}
    </FormField>
  )
}
