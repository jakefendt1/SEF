import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import type { FormValues } from '../../../schema/formSchema'
import { FieldShell } from './FieldShell'
import { choiceClass } from './fieldStyles'

interface Props {
  name: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  options: string[]
  hint?: string
}

/**
 * Pick exactly one. Rendered as rounded pills with a "Choose one" caption --
 * radio and checkbox groups used to look identical, so there was no way to
 * tell whether a second tap would add to your answer or replace it.
 */
export function RadioGroupField({ name, control, label, required, options, hint }: Props) {
  const { field, fieldState } = useController({ name, control })
  return (
    <FieldShell
      name={name}
      control={control}
      label={label}
      required={required}
      hint={hint}
      error={fieldState.error?.message}
      asGroup
    >
      {({ describedBy, invalid, deferred }) => (
        <>
          <p className="text-sm text-gray-600 mb-2">Choose one</p>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={label}
            aria-describedby={describedBy}
          >
            {options.map((opt) => {
              const selected = field.value === opt
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={deferred}
                  onClick={() => field.onChange(opt)}
                  onBlur={field.onBlur}
                  className={choiceClass(
                    selected,
                    invalid,
                    cn('rounded-full inline-flex items-center gap-2'),
                  )}
                >
                  <span
                    className={cn(
                      'size-5 rounded-full border-2 shrink-0 flex items-center justify-center',
                      selected ? 'border-brand' : 'border-gray-400',
                    )}
                    aria-hidden="true"
                  >
                    {selected && <span className="size-2.5 rounded-full bg-brand" />}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
        </>
      )}
    </FieldShell>
  )
}
