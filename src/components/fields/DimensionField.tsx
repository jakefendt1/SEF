import { useController } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { cn } from '../../lib/utils'
import type { FormValues } from '../../schema/formSchema'

interface DimConfig {
  name: Path<FormValues>
  label: string
}

interface Props {
  dims: [DimConfig, DimConfig, DimConfig]
  control: Control<FormValues>
  groupLabel: string
  required?: boolean
  unit?: string
}

function DimInput({
  name,
  label,
  control,
  hasError,
}: {
  name: Path<FormValues>
  label: string
  control: Control<FormValues>
  hasError?: boolean
}) {
  const { field } = useController({ name, control })
  return (
    <div className="flex-1">
      <span className="block text-xs text-gray-500 mb-1 text-center">{label}</span>
      <input
        type="number"
        step="any"
        min="0"
        value={(field.value as number) ?? ''}
        onChange={(e) => {
          const val = e.target.valueAsNumber
          field.onChange(isNaN(val) ? undefined : val)
        }}
        onBlur={field.onBlur}
        name={field.name}
        className={cn(
          'w-full h-12 px-3 rounded-lg border text-base text-center bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent',
          hasError ? 'border-red-400 bg-red-50' : 'border-gray-300',
        )}
      />
    </div>
  )
}

export function DimensionField({ dims, control, groupLabel, required, unit }: Props) {
  const errors = dims.map((d) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { fieldState } = useController({ name: d.name, control })
    return fieldState.error
  })
  const hasAnyError = errors.some(Boolean)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {groupLabel}
        {required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
        {unit && <span className="text-gray-500 ml-1 font-normal">({unit})</span>}
      </label>
      <div className="flex items-center gap-2">
        {dims.map((d, i) => (
          <DimInput
            key={d.name}
            name={d.name}
            label={d.label}
            control={control}
            hasError={!!errors[i]}
          />
        ))}
      </div>
      {hasAnyError && (
        <p className="text-sm text-red-600 mt-1">All dimensions are required</p>
      )}
    </div>
  )
}
