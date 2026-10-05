// The BOM: what lines it holds, how they change, and how they read.
//
// Lines store only the rep's choices (an item id and a quantity, or a
// wearstrip worksheet). Part numbers, descriptions and quantities are always
// worked out from the catalog by `resolveBom` -- the BOM panel, Review, the PDF
// and the email text all call it, so they can't disagree about what's on the
// list or in what order.

import { CATALOG, CS_TO_QUOTE, getItem } from './catalog'
import { CATEGORY_ORDER } from './categories'
import { seriesLabel, seriesMismatch } from './filter'
import {
  missingForWearstrip,
  needsEndPhoto,
  wearstripRow,
  wearstripWarnings,
  type WearstripWorksheet,
} from './wearstrip'
import { missingForShaft, shaftRow, shaftWarnings, type ShaftSpec } from './shaft'
import type { Unit } from '../measurement'

export interface OnetrackJob {
  customer: string
  plant: string
  /** The customer's contact person. CS needs a name to quote to. */
  contact: string
  /** Line / conveyor ID. The save "Reference". */
  line: string
  /** YYYY-MM-DD. */
  date: string
  preparedBy: string
  /** As typed, e.g. "S1600". Drives the sprocket and puller filters. */
  beltSeries: string
  beltWidthIn: number | null
}

/** Date and name are app facts; nothing describing the customer's line is pre-filled. */
export function emptyJob(date: string, preparedBy: string): OnetrackJob {
  return { customer: '', plant: '', contact: '', line: '', date, preparedBy, beltSeries: '', beltWidthIn: null }
}

export type BomLine =
  | { id: string; kind: 'catalog'; itemId: string; qty: number }
  | { id: string; kind: 'quoteOnly'; itemId: string; qty: number; note: string }
  | { id: string; kind: 'wearstrip'; worksheet: WearstripWorksheet }
  /** A machined square shaft: the whole spec sheet rides on the line. */
  | { id: string; kind: 'shaft'; itemId: string; spec: ShaftSpec }

// ---- Operations (pure: each returns a new array) ----------------------------

const catalogLineId = (itemId: string) => `item:${itemId}`

/**
 * Add a part picked from a list. Adding a part that's already on the BOM
 * raises that line's quantity instead of making a second line.
 */
export function addItem(lines: readonly BomLine[], itemId: string, qty: number): BomLine[] {
  const item = getItem(itemId)
  if (!item || item.category === 'wearstrip' || item.category === 'quoteOnly') {
    throw new Error(`addItem: ${itemId} is not a pick-from-list part`)
  }
  const n = wholeQty(qty)
  if (n === null) return [...lines]
  const existing = lines.find((l) => l.kind === 'catalog' && l.itemId === itemId)
  if (existing) {
    return lines.map((l) => (l === existing && l.kind === 'catalog' ? { ...l, qty: l.qty + n } : l))
  }
  return [...lines, { id: catalogLineId(itemId), kind: 'catalog', itemId, qty: n }]
}

/** Add a no-part-number item. Each is its own line: two shafts are two different specs. */
export function addQuoteOnly(
  lines: readonly BomLine[],
  id: string,
  itemId: string,
  note: string,
  qty = 1,
): BomLine[] {
  const item = getItem(itemId)
  if (item?.category !== 'quoteOnly') throw new Error(`addQuoteOnly: ${itemId} is not quote-only`)
  return [...lines, { id, kind: 'quoteOnly', itemId, qty: wholeQty(qty) ?? 1, note }]
}

/** Add a wearstrip line, or replace the one with this id. */
export function upsertWearstrip(
  lines: readonly BomLine[],
  id: string,
  worksheet: WearstripWorksheet,
): BomLine[] {
  const line: BomLine = { id, kind: 'wearstrip', worksheet }
  return lines.some((l) => l.id === id)
    ? lines.map((l) => (l.id === id ? line : l))
    : [...lines, line]
}

/** Add a shaft line, or replace the one with this id. */
export function upsertShaft(lines: readonly BomLine[], id: string, itemId: string, spec: ShaftSpec): BomLine[] {
  const line: BomLine = { id, kind: 'shaft', itemId, spec }
  return lines.some((l) => l.id === id) ? lines.map((l) => (l.id === id ? line : l)) : [...lines, line]
}

/** Set a line's quantity. Below 1 removes the line (the UI confirms first). */
export function setQty(lines: readonly BomLine[], id: string, qty: number): BomLine[] {
  const n = wholeQty(qty)
  if (n === null) return removeLine(lines, id)
  return lines.map((l) => (l.id === id && (l.kind === 'catalog' || l.kind === 'quoteOnly') ? { ...l, qty: n } : l))
}

export function setNote(lines: readonly BomLine[], id: string, note: string): BomLine[] {
  return lines.map((l) => (l.id === id && l.kind === 'quoteOnly' ? { ...l, note } : l))
}

export function removeLine(lines: readonly BomLine[], id: string): BomLine[] {
  return lines.filter((l) => l.id !== id)
}

/** A whole quantity ≥ 1, or null for anything that isn't one. */
function wholeQty(qty: number): number | null {
  if (!Number.isFinite(qty)) return null
  const n = Math.round(qty)
  return n >= 1 ? n : null
}

// ---- Reading the BOM -------------------------------------------------------

export interface ResolvedRow {
  lineId: string
  kind: BomLine['kind']
  /** 1-based, in display order. For reading only; never stored. */
  n: number
  partNumber: string
  description: string
  /** Null for a wearstrip line that isn't finished yet. */
  qty: number | null
  uom: string
  notes: string
  /** How the quantity was worked out (wearstrip only). */
  reason: string | null
  /** Menu page, when the line is a catalog part. */
  page: number | null
}

/** Display order: wearstrip first, then parts in category order, then shafts and other CS-quoted items. */
function ordered(lines: readonly BomLine[]): BomLine[] {
  const rank = (l: BomLine): [number, number] => {
    if (l.kind === 'wearstrip') return [0, 0]
    if (l.kind === 'quoteOnly' || l.kind === 'shaft') return [2, 0]
    const item = getItem(l.itemId)
    if (!item) return [1, Number.MAX_SAFE_INTEGER]
    return [1, CATEGORY_ORDER.indexOf(item.category) * 10_000 + catalogIndex(l.itemId)]
  }
  // Array.prototype.sort is stable, so ties keep the order the rep added them.
  return [...lines].sort((a, b) => {
    const [ga, ra] = rank(a)
    const [gb, rb] = rank(b)
    return ga - gb || ra - rb
  })
}

const CATALOG_INDEX = new Map(CATALOG.map((item, i) => [item.id, i]))
const catalogIndex = (itemId: string) => CATALOG_INDEX.get(itemId) ?? 0

export function resolveBom(lines: readonly BomLine[], unit: Unit): ResolvedRow[] {
  return ordered(lines).map((l, i) => resolveLine(l, i + 1, unit))
}

function resolveLine(l: BomLine, n: number, unit: Unit): ResolvedRow {
  const base = { lineId: l.id, kind: l.kind, n }
  if (l.kind === 'wearstrip') {
    const row = wearstripRow(l.worksheet, unit)
    if (!row) {
      return {
        ...base,
        partNumber: '—',
        description: 'Wearstrip (not finished)',
        qty: null,
        uom: '',
        notes: l.worksheet.use ?? '',
        reason: null,
        page: null,
      }
    }
    return { ...base, ...row, page: null }
  }

  if (l.kind === 'shaft') {
    const item = getItem(l.itemId)
    const row = shaftRow(l.spec, item?.description ?? '', unit)
    if (!row) {
      return {
        ...base,
        partNumber: CS_TO_QUOTE,
        description: 'Square shaft (spec sheet not finished)',
        qty: null,
        uom: '',
        notes: '',
        reason: null,
        page: item?.page ?? null,
      }
    }
    return { ...base, ...row, reason: null, page: item?.page ?? null }
  }

  const item = getItem(l.itemId)
  if (!item) {
    // The catalog dropped a part a saved BOM still holds. Never hide the line.
    return {
      ...base,
      partNumber: l.itemId.toUpperCase(),
      description: 'No longer in the OneTrack menu',
      qty: l.qty,
      uom: '',
      notes: l.kind === 'quoteOnly' ? l.note : '',
      reason: null,
      page: null,
    }
  }
  return {
    ...base,
    partNumber: item.partNumber ?? CS_TO_QUOTE,
    description: item.description,
    qty: l.qty,
    uom: item.uom,
    notes: l.kind === 'quoteOnly' ? l.note.trim() : '',
    reason: null,
    page: item.page,
  }
}

// ---- What's missing, and what to check -------------------------------------

export interface MissingItem {
  /** The field, e.g. "Customer" or "Color". */
  field: string
  /** What the Review list shows. */
  label: string
  /** Where "Take me there" goes: the job step, or a BOM line. */
  target: 'job' | 'parts' | { lineId: string }
}

/** Everything that stops a BOM going to CS. Empty = ready. */
export function missingFor(job: OnetrackJob, lines: readonly BomLine[]): MissingItem[] {
  const out: MissingItem[] = []
  if (!job.customer.trim()) out.push({ field: 'Customer', label: 'Customer', target: 'job' })
  if (!job.contact.trim()) out.push({ field: 'Contact name', label: 'Contact name', target: 'job' })
  if (!job.line.trim()) out.push({ field: 'Line / conveyor ID', label: 'Line / conveyor ID', target: 'job' })
  if (lines.length === 0) out.push({ field: 'Parts', label: 'At least one part', target: 'parts' })

  ordered(lines).forEach((l, i) => {
    const n = i + 1
    if (l.kind === 'wearstrip') {
      for (const field of missingForWearstrip(l.worksheet)) {
        out.push({ field, label: `Line ${n} (wearstrip): ${field}`, target: { lineId: l.id } })
      }
    } else if (l.kind === 'shaft') {
      for (const field of missingForShaft(l.spec)) {
        out.push({ field, label: `Line ${n} (shaft): ${field}`, target: { lineId: l.id } })
      }
    } else if (l.kind === 'quoteOnly' && !l.note.trim()) {
      out.push({ field: 'What CS needs', label: `Line ${n}: what CS needs to quote it`, target: { lineId: l.id } })
    }
  })
  return out
}

/** Quantities above this get a "is that right?" check. */
export const QTY_CHECK_ABOVE = 50

export interface BomWarning {
  lineId: string | null
  text: string
}

export function warningsFor(
  job: OnetrackJob,
  lines: readonly BomLine[],
  unit: Unit,
  photos: { endProfileTaken: boolean },
): BomWarning[] {
  const out: BomWarning[] = []
  ordered(lines).forEach((l, i) => {
    const at = (text: string) => out.push({ lineId: l.id, text: `Line ${i + 1}: ${text}` })

    if (l.kind === 'wearstrip') {
      wearstripWarnings(l.worksheet, unit).forEach(at)
      if (needsEndPhoto(l.worksheet) && !photos.endProfileTaken) {
        at('No end-profile photo. CS needs a straight-on end photo with a ruler to match it.')
      }
      return
    }
    if (l.kind === 'shaft') {
      shaftWarnings(l.spec, unit).forEach(at)
      return
    }

    const item = getItem(l.itemId)
    if (!item) {
      at(`${l.itemId.toUpperCase()} is no longer in the OneTrack menu. Check it with CS.`)
      return
    }
    if (seriesMismatch(item, job.beltSeries)) {
      const forSeries = item.series.map(seriesLabel)
      const list =
        forSeries.length > 1 ? `${forSeries.slice(0, -1).join(', ')} or ${forSeries.at(-1)}` : forSeries[0]
      at(`This part is for ${list}; the job says ${job.beltSeries.trim()}.`)
    }
    if (l.qty > QTY_CHECK_ABOVE) at(`Quantity is ${l.qty}. Is that right?`)
  })
  return out
}

/** The worksheet's caution, shown whenever the BOM has a wearstrip line. */
export const WEARSTRIP_CAUTION =
  'Field identification only. Confirm exact profile, belt compatibility, material, ' +
  'dimensions, and current availability before quoting or ordering. OneTrack flat and ' +
  'flanged profiles are current FoodSafe offerings; specialty clip-on profiles are ' +
  'generally intended for light-load retrofit or concept use.'

/** The short form, for the bottom of the email text. */
export const WEARSTRIP_CAUTION_SHORT =
  'Field identification only. Confirm profile, compatibility and availability before ordering.'

export function hasWearstrip(lines: readonly BomLine[]): boolean {
  return lines.some((l) => l.kind === 'wearstrip')
}

export function hasShaft(lines: readonly BomLine[]): boolean {
  return lines.some((l) => l.kind === 'shaft')
}
