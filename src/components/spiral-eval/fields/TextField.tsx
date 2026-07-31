import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import type { FormValues } from '../../../schema/formSchema'
import { FieldShell } from './FieldShell'
import { controlClass } from './fieldStyles'

interface Props {
  name: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  type?: 'text' | 'email' | 'tel'
  placeholder?: string
  hint?: string
}

export function TextField({
  name,
  control,
  label,
  required,
  type = 'text',
  placeholder,
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
        <input
          {...field}
          id={id}
          type={type}
          placeholder={placeholder}
          value={(field.value as string) ?? ''}
          disabled={deferred}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off'}
          inputMode={type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined}
          className={controlClass(invalid)}
        />
      )}
    </FieldShell>
  )
}
