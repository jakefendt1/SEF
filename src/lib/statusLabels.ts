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
 * What the user is told after an AIM Glide PDF export.
 *
 * The export used to report success unconditionally while quietly dropping the
 * Intralox logo, so a rep could hand a customer an unbranded document believing
 * it was fine. If the logo fails again, say so.
 */
export const PDF_EXPORT_MESSAGES = {
  ok: 'PDF saved to your downloads',
  missingLogo: "PDF saved, but the Intralox logo didn't render. Check it before you send it.",
  failed: "Couldn't create the PDF. Nothing was saved.",
} as const

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
