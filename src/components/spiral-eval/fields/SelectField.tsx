import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { FormValues } from '../../../schema/formSchema'
import { FieldShell } from './FieldShell'
import { controlClass } from './fieldStyles'

interface Props {
  name: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  options: string[]
  placeholder?: string
  hint?: string
}

/**
 * Deliberately a native <select>, not a Radix popover: on iOS this gets the
 * system wheel picker, which is far easier to hit than a scrolling list of
 * small rows -- exactly the population this app is for.
 */
export function SelectField({
  name,
  control,
  label,
  required,
  options,
  placeholder = 'Tap to choose…',
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
        <div className="relative">
          <select
            {...field}
            id={id}
            value={(field.value as string) ?? ''}
            disabled={deferred}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={controlClass(
              invalid,
              cn('appearance-none pr-11', !field.value && 'text-gray-600'),
            )}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {/* appearance-none strips the native arrow, which left selects
              looking identical to text inputs. Put it back. */}
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-5 text-gray-600"
            aria-hidden="true"
          />
        </div>
      )}
    </FieldShell>
  )
}
