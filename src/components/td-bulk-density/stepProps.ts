import type { TdComputed } from '@/lib/tdBulkDensity/compute'
import type { TdForm } from '@/lib/tdBulkDensity/form'

export interface StepProps {
  form: TdForm
  /** Patch the form; dependent choices are reconciled by the caller. */
  set: (patch: Partial<TdForm>) => void
  result: TdComputed | null
}
