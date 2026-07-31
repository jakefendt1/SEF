// One shared derivation of how an assessment is named in the UI. Previously
// this was inlined in the list component and nothing else agreed with it, so
// the same record could be called three different things.
import type { StoredAssessment } from './db'

export const UNTITLED = 'Untitled evaluation'

/** The primary label for a record: the user's own name for it if they set one. */
export function assessmentTitle(a: Pick<StoredAssessment, 'title' | 'data'>): string {
  const explicit = a.title?.trim()
  if (explicit) return explicit

  const company = (a.data?.companyName as string | undefined)?.trim()
  if (company) return company

  const contact = (a.data?.name as string | undefined)?.trim()
  if (contact) return contact

  return UNTITLED
}

/** The secondary line: whatever identifying detail the title didn't already use. */
export function assessmentSubtitle(a: Pick<StoredAssessment, 'title' | 'data'>): string {
  const title = assessmentTitle(a)
  const parts: string[] = []

  const company = (a.data?.companyName as string | undefined)?.trim()
  const contact = (a.data?.name as string | undefined)?.trim()

  if (company && company !== title) parts.push(company)
  if (contact && contact !== title) parts.push(contact)

  return parts.join(' — ')
}

/** Title for a copy of an existing record, without mutating customer data. */
export function duplicateTitle(a: Pick<StoredAssessment, 'title' | 'data'>): string {
  return `${assessmentTitle(a)} (Copy)`
}

/** Lowercased haystack for client-side search. */
export function assessmentSearchText(a: StoredAssessment): string {
  const fromData = Object.values(a.data ?? {})
    .filter((v): v is string => typeof v === 'string')
    .join(' ')
  return `${a.title ?? ''} ${fromData}`.toLowerCase()
}
