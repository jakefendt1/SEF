import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import type { FormValues } from '../../../schema/formSchema'

interface Props {
  name: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  options: string[]
}

export function RadioGroupField({ name, control, label, required, options }: Props) {
  const { field, fieldState } = useController({ name, control })
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
      </label>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const selected = field.value === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => field.onChange(opt)}
              onBlur={field.onBlur}
              className={cn(
                'min-h-[44px] px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                selected
                  ? 'border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400',
                fieldState.error && !selected && 'border-red-300',
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {fieldState.error && (
        <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
      )}
    </div>
  )
}
