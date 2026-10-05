// Tools still in beta: shipped to production, but shown only to the people
// listed here. Anyone else gets no dashboard card and a "Not found" page at
// the tool's routes.
//
// Launching a tool = deleting its entry and pushing.

import { normalizeEmail } from './allowedEmails'

/** Tool id -> emails that can see it. Compared case-insensitively. */
export const BETA_TOOLS: Readonly<Record<string, readonly string[]>> = {
  // Jeremy Shall asked for OneTrack and sees it before anyone else does.
  onetrack: ['jacob.fendt@intralox.com', 'jeremy.shall@intralox.com'],
}

export function isBeta(toolId: string): boolean {
  return toolId in BETA_TOOLS
}

export function canSeeTool(toolId: string, email: string | null | undefined): boolean {
  const allowed = BETA_TOOLS[toolId]
  if (!allowed) return true
  if (!email) return false
  const e = normalizeEmail(email)
  return allowed.some((a) => normalizeEmail(a) === e)
}
