import type { FormValues } from '../schema/formSchema'
import type { StoredAssessment } from './db'

/**
 * Counts fields with a real value. `mode` is excluded deliberately: a
 * freshly-mounted form before hydration looks like `{ mode: 'quick' }`,
 * which must count as "nothing filled in" or the emptiness check below
 * can't tell a blank form from real data.
 */
export function countFilled(data: Partial<FormValues> | undefined): number {
  if (!data) return 0
  let count = 0
  for (const key of Object.keys(data)) {
    if (key === 'mode') continue
    const v = (data as Record<string, unknown>)[key]
    if (v === undefined || v === null) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    count++
  }
  return count
}

/**
 * Decides whether an autosave write should actually go through.
 *
 * This exists because of a real bug: on a hard refresh or deep link, the
 * Firestore subscription that backs `existing` loads asynchronously. If the
 * form renders before it resolves, react-hook-form mounts with blank
 * defaults, and the autosave timer fires 600ms later with essentially empty
 * data -- silently overwriting a completed record. `hydrated`/`isDirty`
 * catch that at the call site; the emptiness check here is the backstop
 * that survives future call-site mistakes.
 */
export function shouldAutosave(params: {
  hydrated: boolean
  isDirty: boolean
  incoming: Partial<FormValues>
  existing?: StoredAssessment
}): boolean {
  const { hydrated, isDirty, incoming, existing } = params
  if (!hydrated) return false
  if (!isDirty) return false
  if (existing) {
    const existingFilled = countFilled(existing.data)
    const incomingFilled = countFilled(incoming)
    if (existingFilled > 0 && incomingFilled === 0) return false
  }
  return true
}
