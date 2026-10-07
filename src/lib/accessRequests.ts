// Access requests: someone taps a greyed-out tile, asks for that tool, and the
// request shows up on the admin's Manage access page to approve or decline.
// No email involved -- Firebase's emails don't reach Intralox inboxes.
//
// STATUS (2026-10-07): groundwork only. Not wired into the dashboard or the
// admin page, and firestore.rules has no accessRequests match yet (so writes
// would be refused). Next: the Firestore adapter, rules (requester can create
// and read their own; admin reads all and deletes), the greyed ToolCard on the
// dashboard, and a Requests section at the top of Manage access.

import { ALL_TOOL_IDS, accessDocId, isDefaultTool, toolsFor, type AccessGrant } from './access'

/** One request, stored at accessRequests/{email}__{toolId} so asking twice doesn't duplicate. */
export interface AccessRequest {
  email: string
  name: string
  toolId: string
  /** Optional, e.g. "for the Pepsico visit next week". */
  note: string
  requestedAt: number
}

export function requestDocId(email: string, toolId: string): string {
  return `${accessDocId(email)}__${toolId}`
}

/** The tools someone could ask for: everything they don't already have. */
export function requestableTools(email: string | null | undefined, grant: Pick<AccessGrant, 'tools'> | null): string[] {
  const mine = new Set(toolsFor(email, grant))
  return ALL_TOOL_IDS.filter((id) => !mine.has(id) && !isDefaultTool(id))
}

/**
 * The admin's list: newest first, dropping requests already satisfied (the
 * tool was granted some other way since) and tools that no longer exist.
 */
export function openRequests(
  requests: readonly AccessRequest[],
  grants: readonly Pick<AccessGrant, 'email' | 'tools'>[],
): AccessRequest[] {
  const granted = new Map(grants.map((g) => [accessDocId(g.email), g]))
  return requests
    .filter((r) => ALL_TOOL_IDS.includes(r.toolId))
    .filter((r) => !toolsFor(r.email, granted.get(accessDocId(r.email)) ?? null).includes(r.toolId))
    .sort((a, b) => b.requestedAt - a.requestedAt)
}
