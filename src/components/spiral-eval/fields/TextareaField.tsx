import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import type { FormValues } from '../../../schema/formSchema'
import { FieldShell } from './FieldShell'

interface Props {
  name: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  placeholder?: string
  rows?: number
  hint?: string
}

export function TextareaField({
  name,
  control,
  label,
  required,
  placeholder,
  rows = 3,
  hint,
}: Props) {
  const { field, fieldState } = useController({ name, control })
  return (
    <FieldShell
      name={name}
      control={control}
      label={label}
      required={required}
      hint={hint}
      error={fieldState.error?.message}
    >
      {({ id, describedBy, invalid, deferred }) => (
        <textarea
          {...field}
          id={id}
          value={(field.value as string) ?? ''}
          rows={rows}
          placeholder={placeholder}
          disabled={deferred}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(
            'w-full px-4 py-3 rounded-lg border text-base bg-white resize-y',
            'focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent',
            'disabled:bg-gray-100 disabled:text-gray-500',
            invalid ? 'border-red-500 bg-red-50' : 'border-gray-400',
          )}
        />
      )}
    </FieldShell>
  )
}
