import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import type { FormValues } from '../../../schema/formSchema'

interface Props {
  name: Path<FormValues>
  control: Control<FormValues>
  label: string
  required?: boolean
  type?: 'text' | 'email' | 'tel'
  placeholder?: string
}

export function TextField({ name, control, label, required, type = 'text', placeholder }: Props) {
  const { field, fieldState } = useController({ name, control })
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
      </label>
      <input
        {...field}
        type={type}
        placeholder={placeholder}
        value={(field.value as string) ?? ''}
        autoComplete="off"
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
