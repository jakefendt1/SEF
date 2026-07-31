import { useId, type ReactNode } from 'react'
import type { Control } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import type { FormValues } from '../../../schema/formSchema'
import { fieldHint, isDeferrable } from '../../../schema/fieldMeta'
import { useDeferredField } from './useDeferredField'

export interface FieldRenderArgs {
  /** Put this on the control so the label actually targets it. */
  id: string
  /** Wire to aria-describedby so the hint and error are announced. */
  describedBy: string | undefined
  invalid: boolean
  /** True when the user marked this "measure later" -- controls are disabled. */
  deferred: boolean
}

interface Props {
  name: string
  /** Additional field names that defer together with `name` (grouped inputs). */
  groupedNames?: readonly string[]
  control: Control<FormValues>
  label: string
  required?: boolean
  /** Plain-language explanation. Falls back to the shared hint table. */
  hint?: string
  /** Fixed unit shown next to the label, e.g. "in", "°F". */
  unit?: string
  error?: string
  /**
   * Label the control group rather than a single input (radio/checkbox
   * groups, dimension trios) -- a <label for> pointing at a group is a lie.
   */
  asGroup?: boolean
  children: (args: FieldRenderArgs) => ReactNode
}

/**
 * The one wrapper every Spiral Eval field renders inside. It owns the things
 * that were previously missing or inconsistent across all 85 fields: label/id
 * pairing so tapping a label focuses its input, the required marker, the hint
 * text, announced errors, the scroll offset used when jumping to an error, and
 * the "measure later" escape hatch.
 */
export function FieldShell({
  name,
  groupedNames,
  control,
  label,
  required,
  hint,
  unit,
  error,
  asGroup,
  children,
}: Props) {
  const reactId = useId()
  const id = `f-${name}-${reactId}`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const text = hint ?? fieldHint(name as keyof FormValues)
  const deferNames = groupedNames ?? [name]
  const deferrable = deferNames.every((n) => isDeferrable(n as keyof FormValues))
  const { deferred, toggle } = useDeferredField(control, deferNames)

  const describedBy = [text ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined

  const labelContent = (
    <>
      {label}
      {required && (
        <span className="text-red-600 ml-1" aria-hidden="true">
          *
        </span>
      )}
      {required && <span className="sr-only"> (required)</span>}
      {unit && <span className="text-gray-600 ml-1 font-normal">({unit})</span>}
    </>
  )

  return (
    <div className="scroll-mt-32">
      {asGroup ? (
        <span className="block text-base font-medium text-gray-800 mb-1">{labelContent}</span>
      ) : (
        <label htmlFor={id} className="block text-base font-medium text-gray-800 mb-1">
          {labelContent}
        </label>
      )}

      {text && (
        <p id={hintId} className="text-sm text-gray-600 mb-2 leading-snug">
          {text}
        </p>
      )}

      <div className={cn(deferred && 'opacity-50')}>
        {children({ id, describedBy, invalid: !!error && !deferred, deferred })}
      </div>

      {deferrable && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={deferred}
          className={cn(
            'mt-2 inline-flex items-center gap-2 text-sm rounded-lg px-3 min-h-[44px] border',
            deferred
              ? 'border-amber-400 bg-amber-50 text-amber-900 font-medium'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50',
          )}
        >
          {deferred ? "Marked: I'll measure this later" : "I don't know — measure later"}
        </button>
      )}

      {error && !deferred && (
        <p id={errorId} role="alert" className="text-sm text-red-700 mt-1 font-medium">
          {error}
        </p>
      )}
    </div>
  )
}
