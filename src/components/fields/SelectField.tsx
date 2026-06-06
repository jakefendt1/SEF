import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { cn } from '../../lib/utils'
import type { FormValues } from '../../schema/formSchema'

interface Props {
  name: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  options: string[]
  placeholder?: string
}

export function SelectField({ name, control, label, required, options, placeholder = 'Select…' }: Props) {
  const { field, fieldState } = useController({ name, control })
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
      </label>
      <select
        {...field}
        value={(field.value as string) ?? ''}
        className={cn(
          'w-full h-12 px-4 rounded-lg border text-base bg-white appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent',
          fieldState.error ? 'border-red-400 bg-red-50' : 'border-gray-300',
          !field.value && 'text-gray-400',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {fieldState.error && (
        <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
      )}
    </div>
  )
}
