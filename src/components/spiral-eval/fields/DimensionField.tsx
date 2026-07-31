import { useController, useFormState } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import type { FormValues } from '../../../schema/formSchema'
import { FieldShell } from './FieldShell'
import { controlClass } from './fieldStyles'

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
  hint?: string
}

/**
 * One dimension input. Owns exactly one `useController` for its field --
 * previously the parent also called `useController` for the same names inside
 * a `.map()` (behind a lint suppression for the rules-of-hooks violation), so
 * two controllers competed to register the same field and only one ref won.
 */
function DimInput({
  name,
  label,
  control,
  describedBy,
  disabled,
}: {
  name: Path<FormValues>
  label: string
  control: Control<FormValues>
  describedBy?: string
  disabled?: boolean
}) {
  // Destructured rather than held as a `field` object: react-hooks/refs sees
  // an object whose `.ref` is passed to a ref prop and then flags every other
  // property read as a ref access during render.
  const {
    field: { value, onChange, onBlur, name: fieldName, ref: registerRef },
    fieldState,
  } = useController({ name, control })
  const invalid = !!fieldState.error && !disabled

  return (
    <div className="flex-1">
      <label
        htmlFor={`dim-${name}`}
        className="block text-sm text-gray-600 mb-1 text-center font-medium"
      >
        {label}
      </label>
      <input
        id={`dim-${name}`}
        type="number"
        step="any"
        min="0"
        inputMode="decimal"
        value={(value as number) ?? ''}
        onChange={(e) => {
          const val = e.target.valueAsNumber
          onChange(isNaN(val) ? undefined : val)
        }}
        onBlur={onBlur}
        name={fieldName}
        ref={registerRef}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={controlClass(invalid, 'text-center px-3')}
      />
    </div>
  )
}

export function DimensionField({ dims, control, groupLabel, required, unit, hint }: Props) {
  // A subscription, not a registration: useFormState observes these fields'
  // errors without claiming ownership of them, so it cannot fight DimInput's
  // controller the way the previous `useController`-in-a-loop did.
  const { errors } = useFormState({ control, name: dims.map((d) => d.name) })
  const hasAnyError = dims.some((d) => Boolean((errors as Record<string, unknown>)[d.name]))

  return (
    <FieldShell
      name={dims[0].name}
      groupedNames={dims.map((d) => d.name)}
      control={control}
      label={groupLabel}
      required={required}
      unit={unit}
      hint={hint}
      error={hasAnyError ? 'Fill in all three measurements' : undefined}
      asGroup
    >
      {({ describedBy, deferred }) => (
        <div className="flex items-start gap-2">
          {dims.map((d) => (
            <DimInput
              key={d.name}
              name={d.name}
              label={d.label}
              control={control}
              describedBy={describedBy}
              disabled={deferred}
            />
          ))}
        </div>
      )}
    </FieldShell>
  )
}
