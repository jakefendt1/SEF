// Plain-language status wording, in one place. The internal status values are
// engineering terms ("synced", "queued"); these are what a field rep reads.
import type { AssessmentStatus } from './db'

export interface StatusPresentation {
  label: string
  /** One line explaining what the user should understand or do. */
  help: string
  className: string
}

export const STATUS_PRESENTATION: Record<AssessmentStatus, StatusPresentation> = {
  draft: {
    label: 'Not sent yet',
    help: 'Saved on your account. It has not been sent to the office.',
    className: 'bg-gray-100 text-gray-700',
  },
  queued: {
    label: 'Waiting to send',
    help: "Saved. It will send by itself once you're back online.",
    className: 'bg-amber-100 text-amber-800',
  },
  synced: {
    label: 'Sent',
    help: 'Sent to the office. Nothing else to do.',
    className: 'bg-green-100 text-green-800',
  },
  failed: {
    label: "Didn't send",
    help: "Your answers are safe, but sending failed. Tap Try again.",
    className: 'bg-red-100 text-red-800',
  },
}

export function statusLabel(status: AssessmentStatus): string {
  return STATUS_PRESENTATION[status].label
}

/**
 * True when a record was sent and then edited afterwards, so the office does
 * not have the latest answers. Derived rather than stored so it can't drift.
 */
export function isEditedSinceSent(a: {
  status: AssessmentStatus
  updatedAt: number
  syncedAt?: number
}): boolean {
  return a.status === 'synced' && a.updatedAt > (a.syncedAt ?? 0)
}
