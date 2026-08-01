// Plain-language status wording, in one place. The internal status values are
// engineering terms; these are what a field rep reads.
import type { AssessmentStatus } from './db'

export interface StatusPresentation {
  label: string
  /** One line explaining what the user should understand or do. */
  help: string
  className: string
}

export const STATUS_PRESENTATION: Record<AssessmentStatus, StatusPresentation> = {
  draft: {
    label: 'In progress',
    help: "Saved to your account. You can pick it up on any device you're signed in on.",
    className: 'bg-gray-100 text-gray-700',
  },
  complete: {
    label: 'Complete',
    help: "You've marked this one finished. You can still open it and make changes.",
    className: 'bg-green-100 text-green-800',
  },
}

export function statusLabel(status: AssessmentStatus): string {
  return STATUS_PRESENTATION[status].label
}

/**
 * True when a record was marked complete and then edited afterwards. Derived
 * rather than stored so it can't drift.
 */
export function isEditedSinceComplete(a: {
  status: AssessmentStatus
  updatedAt: number
  completedAt?: number
}): boolean {
  return a.status === 'complete' && a.updatedAt > (a.completedAt ?? 0)
}
