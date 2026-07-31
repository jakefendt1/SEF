import { useController, type Control } from 'react-hook-form'
import type { FormValues } from '../../../schema/formSchema'

/**
 * Read/write the "I don't know / measure later" mark for one or more fields.
 *
 * Deferrals live in one `unknownFields` array rather than a flag per field, so
 * the schema's required-set never changes and the office gets a single list of
 * what still needs measuring. Grouped controls (the three cage-bar dimensions)
 * pass all their names so they defer and un-defer together.
 */
export function useDeferredField(control: Control<FormValues>, names: readonly string[]) {
  const { field } = useController({ name: 'unknownFields', control })
  const list = (field.value as string[] | undefined) ?? []
  const deferred = names.length > 0 && names.every((n) => list.includes(n))

  function toggle() {
    field.onChange(
      deferred
        ? list.filter((f) => !names.includes(f))
        : [...list.filter((f) => !names.includes(f)), ...names],
    )
  }

  return { deferred, toggle }
}
