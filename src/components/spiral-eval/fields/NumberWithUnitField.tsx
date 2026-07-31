import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import type { FormValues } from '../../../schema/formSchema'
import { FieldShell } from './FieldShell'
import { controlClass } from './fieldStyles'

interface Props {
  numberName: Path<FormValues>
  unitName: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  unitOptions: string[]
  placeholder?: string
  hint?: string
}

export function NumberWithUnitField({
  numberName,
  unitName,
  control,
  label,
  required,
  unitOptions,
  placeholder,
  hint,
}: Props) {
  const { field: numField, fieldState: numState } = useController({ name: numberName, control })
  const { field: unitField, fieldState: unitState } = useController({ name: unitName, control })

  // The unit is separately required by the schema (productLoadUnit is), but
  // its error had nowhere to render -- so a Full-mode submit could fail with
  // no visible reason anywhere on the page. Surface both.
  const error = numState.error?.message ?? unitState.error?.message

  return (
    <FieldShell
      name={numberName}
      control={control}
      label={label}
      required={required}
      hint={hint}
      error={error}
    >
      {({ id, describedBy, invalid, deferred }) => (
        <div className="flex gap-2">
          <input
            id={id}
            type="number"
            step="any"
            inputMode="decimal"
            placeholder={placeholder}
            value={(numField.value as number) ?? ''}
            onChange={(e) => {
              const val = e.target.valueAsNumber
              numField.onChange(isNaN(val) ? undefined : val)
            }}
            onBlur={numField.onBlur}
            name={numField.name}
            ref={numField.ref}
            disabled={deferred}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={controlClass(!!numState.error && !deferred, 'flex-1')}
          />
          <div className="relative">
            <select
              {...unitField}
              value={(unitField.value as string) ?? ''}
              disabled={deferred}
              aria-label={`${label} — unit`}
              aria-invalid={(!!unitState.error && !deferred) || undefined}
              className={controlClass(
                !!unitState.error && !deferred,
                'w-auto appearance-none pr-10',
              )}
            >
              <option value="">unit</option>
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-5 text-gray-600"
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </FieldShell>
  )
}
