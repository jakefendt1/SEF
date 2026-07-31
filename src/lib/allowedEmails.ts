// Who is allowed to create an account.
//
// This is enforced in two places that must agree: `createAccount` in the auth
// store (so the user gets a clear message instead of a rules failure), and
// `firestore.rules` (so it can't be bypassed by calling Firebase directly).
// If you change the values here, change firestore.rules to match.

export const ALLOWED_EMAIL_DOMAINS = ['intralox.com'] as const

/**
 * Individual addresses permitted despite not matching an allowed domain.
 *
 * Audited 2026-07-31 against the live project (5 accounts): the only two real
 * users were jacob.fendt@ and joseph.stevens@intralox.com, so no exceptions
 * were needed. Add an entry here (lowercase) before onboarding anyone on an
 * outside address, or they will be turned away at signup.
 */
export const ALLOWLISTED_EMAILS: readonly string[] = []

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function emailDomain(email: string): string {
  const at = normalizeEmail(email).lastIndexOf('@')
  return at === -1 ? '' : normalizeEmail(email).slice(at + 1)
}

export function isAllowedSignupEmail(email: string): boolean {
  const normalized = normalizeEmail(email)
  if (!normalized.includes('@')) return false
  if (ALLOWLISTED_EMAILS.includes(normalized)) return true
  return (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(emailDomain(normalized))
}

/** The message shown to someone whose address is turned away. */
export const SIGNUP_DOMAIN_MESSAGE =
  'Accounts are limited to Intralox email addresses. Use your @intralox.com address, or ask your admin to add you.'
