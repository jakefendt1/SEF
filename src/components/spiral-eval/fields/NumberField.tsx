import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import type { FormValues } from '../../../schema/formSchema'

interface Props {
  name: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  unit?: string        // fixed unit label (e.g. "in", "ft", "fpm", "°F")
  allowNegative?: boolean
  placeholder?: string
}

export function NumberField({ name, control, label, required, unit, placeholder }: Props) {
  const { field, fieldState } = useController({ name, control })
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
        {unit && <span className="text-gray-500 ml-1 font-normal">({unit})</span>}
      </label>
      <input
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
        className={cn(
          'w-full h-12 px-4 rounded-lg border text-base bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent',
          fieldState.error ? 'border-red-400 bg-red-50' : 'border-gray-300',
        )}
      />
      {fieldState.error && (
        <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
      )}
    </div>
  )
}
