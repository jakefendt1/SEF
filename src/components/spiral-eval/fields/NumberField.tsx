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
  unit?: string        // fixed unit label (e.g. "in", "ft", "fpm", "°F")
  allowNegative?: boolean
  placeholder?: string
  hint?: string
}

export function NumberField({
  name,
  control,
  label,
  required,
  unit,
  allowNegative,
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
      unit={unit}
      hint={hint}
      error={fieldState.error?.message}
    >
      {({ id, describedBy, invalid, deferred }) => (
        <input
          id={id}
          type="number"
          step="any"
          placeholder={placeholder}
          value={(field.value as number) ?? ''}
          onChange={(e) => {
            const val = e.target.valueAsNumber
            field.onChange(isNaN(val) ? undefined : val)
          }}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          disabled={deferred}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          // "decimal" gives iOS a keypad with a decimal point; when negatives
          // are legitimate (temperatures) fall back to the full keyboard,
          // since the decimal pad has no minus key.
          inputMode={allowNegative ? undefined : 'decimal'}
          className={controlClass(invalid)}
        />
      )}
    </FieldShell>
  )
}
