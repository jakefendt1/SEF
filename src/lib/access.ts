// Who can use which tool.
//
// Every tool is off for everyone until an admin turns it on in Manage access
// (/admin). Grants live in Firestore at `access/{email}` -- keyed by email, so
// an admin can approve someone before they've signed up -- and only admins can
// write them. firestore.rules enforces the same thing on each tool's data, so
// hiding a tile isn't the only lock.
//
// Adding a tool: add it to TOOLS in lib/navigation.ts (the admin page grows a
// switch for it, off for everyone), and if it saves data, add its collection
// to TOOL_COLLECTIONS here and to hasTool() in firestore.rules.

import { normalizeEmail } from './allowedEmails'
import { TOOLS } from './navigation'

/**
 * Admins see every tool and the Manage access page. Mirrored in
 * firestore.rules (isAdmin) -- change both together.
 */
export const ADMIN_EMAILS: readonly string[] = ['jacob.fendt@intralox.com']

/** The Firestore collection under users/{uid} each tool saves to. Calculators that save nothing aren't listed. */
export const TOOL_COLLECTIONS: Readonly<Record<string, string>> = {
  'spiral-eval': 'assessments',
  'aim-glide': 'roiCalculations',
  'td-bulk-density': 'tdBulkDensityRuns',
  onetrack: 'onetrackBoms',
  'td-configurator': 'tdConfigurations',
}

/** A stored grant. */
export interface AccessGrant {
  email: string
  tools: string[]
  updatedAt: number
  /** The admin who last changed it. */
  updatedBy: string
}

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(normalizeEmail(email))
}

/** The id of someone's grant document. */
export function accessDocId(email: string): string {
  return normalizeEmail(email)
}

export const ALL_TOOL_IDS: readonly string[] = TOOLS.map((t) => t.id)

/**
 * Tools every signed-in Intralox user gets, granted or not (Jake,
 * 2026-10-07). Only tools that save nothing belong here: the rules don't know
 * about defaults, so a tool with data would still be refused by Firestore.
 */
export const DEFAULT_TOOL_IDS: readonly string[] = ['belt-elongation']

export function isDefaultTool(toolId: string): boolean {
  return DEFAULT_TOOL_IDS.includes(toolId)
}

/**
 * The tools someone can use. Admins get all of them. Unknown ids in a grant
 * (a tool since removed) are ignored rather than trusted.
 */
export function toolsFor(email: string | null | undefined, grant: Pick<AccessGrant, 'tools'> | null): string[] {
  if (!email) return []
  if (isAdmin(email)) return [...ALL_TOOL_IDS]
  return ALL_TOOL_IDS.filter((id) => isDefaultTool(id) || grant?.tools.includes(id))
}

export function canUse(toolId: string, email: string | null | undefined, grant: Pick<AccessGrant, 'tools'> | null): boolean {
  return toolsFor(email, grant).includes(toolId)
}

/** Flip one tool in a grant's list, keeping the list in TOOLS order. */
export function toggleTool(tools: readonly string[], toolId: string, on: boolean): string[] {
  const set = new Set(tools)
  if (on) set.add(toolId)
  else set.delete(toolId)
  return ALL_TOOL_IDS.filter((id) => set.has(id))
}

export interface AdminRow {
  email: string
  name: string | null
  /** False for an email approved before its owner has signed up. */
  signedUp: boolean
  tools: string[]
}

/**
 * One row per person, merging signed-up profiles with pre-approved emails,
 * sorted by name and filtered by a search on name or email.
 */
export function adminRows(
  profiles: readonly { email: string; displayName?: string }[],
  grants: readonly Pick<AccessGrant, 'email' | 'tools'>[],
  search = '',
): AdminRow[] {
  const byEmail = new Map<string, AdminRow>()
  for (const p of profiles) {
    if (!p.email) continue
    const email = normalizeEmail(p.email)
    byEmail.set(email, { email, name: p.displayName?.trim() || null, signedUp: true, tools: [] })
  }
  for (const g of grants) {
    const email = normalizeEmail(g.email)
    const row = byEmail.get(email) ?? { email, name: null, signedUp: false, tools: [] }
    row.tools = ALL_TOOL_IDS.filter((id) => g.tools.includes(id))
    byEmail.set(email, row)
  }
  const q = search.trim().toLowerCase()
  return [...byEmail.values()]
    .filter((r) => !q || r.email.includes(q) || (r.name ?? '').toLowerCase().includes(q))
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email))
}
