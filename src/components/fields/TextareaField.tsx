import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { cn } from '../../lib/utils'
import type { FormValues } from '../../schema/formSchema'

interface Props {
  name: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  placeholder?: string
  rows?: number
}

export function TextareaField({ name, control, label, required, placeholder, rows = 3 }: Props) {
  const { field, fieldState } = useController({ name, control })
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
      </label>
      <textarea
        {...field}
        value={(field.value as string) ?? ''}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          'w-full px-4 py-3 rounded-lg border text-base bg-white resize-none',
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
