import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { Check } from 'lucide-react'
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
  // Options that clear all others when selected (e.g. "No Heat Source", "None")
  exclusiveOptions?: string[]
  hint?: string
}

/**
 * Pick any number. Square boxes with a tick, and a "Choose all that apply"
 * caption -- deliberately a different shape from RadioGroupField's pills.
 */
export function CheckboxGroupField({
  name,
  control,
  label,
  required,
  options,
  exclusiveOptions = [],
  hint,
}: Props) {
  const { field, fieldState } = useController({ name, control })
  const selected: string[] = (field.value as string[]) ?? []

  function toggle(opt: string) {
    const isExclusive = exclusiveOptions.includes(opt)
    if (isExclusive) {
      // Clicking an exclusive option clears everything else and selects only it
      field.onChange(selected.includes(opt) ? [] : [opt])
      return
    }
    // Clicking a regular option removes exclusive selections
    const withoutExclusive = selected.filter((v) => !exclusiveOptions.includes(v))
    if (withoutExclusive.includes(opt)) {
      field.onChange(withoutExclusive.filter((v) => v !== opt))
    } else {
      field.onChange([...withoutExclusive, opt])
    }
  }

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
          <p className="text-sm text-gray-600 mb-2">Choose all that apply</p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={label}
            aria-describedby={describedBy}
          >
            {options.map((opt) => {
              const checked = selected.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  disabled={deferred}
                  onClick={() => toggle(opt)}
                  onBlur={field.onBlur}
                  className={choiceClass(
                    checked,
                    invalid,
                    'rounded-lg inline-flex items-center gap-2',
                  )}
                >
                  <span
                    className={cn(
                      'size-5 rounded border-2 shrink-0 flex items-center justify-center',
                      checked ? 'border-brand bg-brand' : 'border-gray-400',
                    )}
                    aria-hidden="true"
                  >
                    {checked && <Check className="size-3.5 text-white" strokeWidth={3} />}
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
