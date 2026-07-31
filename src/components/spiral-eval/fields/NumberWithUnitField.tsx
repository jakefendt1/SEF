import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import type { FormValues } from '../../../schema/formSchema'

interface Props {
  numberName: Path<FormValues>
  unitName: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  unitOptions: string[]
  placeholder?: string
}

export function NumberWithUnitField({
  numberName,
  unitName,
  control,
  label,
  required,
  unitOptions,
  placeholder,
}: Props) {
  const { field: numField, fieldState: numState } = useController({ name: numberName, control })
  const { field: unitField } = useController({ name: unitName, control })

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          step="any"
          placeholder={placeholder}
          value={(numField.value as number) ?? ''}
          onChange={(e) => {
            const val = e.target.valueAsNumber
            numField.onChange(isNaN(val) ? undefined : val)
          }}
          onBlur={numField.onBlur}
          name={numField.name}
          className={cn(
            'flex-1 h-12 px-4 rounded-lg border text-base bg-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent',
            numState.error ? 'border-red-400 bg-red-50' : 'border-gray-300',
          )}
        />
        <select
          {...unitField}
          value={(unitField.value as string) ?? ''}
          className="h-12 px-3 rounded-lg border border-gray-300 text-base bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        >
          <option value="">unit</option>
          {unitOptions.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      {numState.error && (
        <p className="text-sm text-red-600 mt-1">{numState.error.message}</p>
      )}
    </div>
  )
}
