// The wearstrip worksheet: what the rep measured, and the one BOM line it
// produces. Every length is canonical inches; the unit only changes how text
// reads.
//
// Rounding rule (Jake, 2026-10-05): round up per rail. Each rail gets whole
// stock lengths of its own -- no sharing offcuts between rails, no spare %.

import { findWearstrip, type FrameSize, type WearstripItem, type WearstripMaterial } from './catalog'
import {
  DIM_LABELS,
  colorsFor,
  framesFor,
  getFamily,
  getProfile,
  materialsFor,
  type DimKey,
  type QuoteAs,
} from './profiles'
import { toFractionalInches, type Unit } from '../measurement'

export const WEARSTRIP_USES = ['Carryway', 'Returnway', 'Side guide', 'Hold-down'] as const
export type WearstripUse = (typeof WEARSTRIP_USES)[number]

/** Part number placeholder for "match the installed profile" lines. */
export const CS_TO_SOURCE = 'TBD: CS to source'

export interface WearstripWorksheet {
  use: WearstripUse | null
  profileId: string | null
  /** Only for the "Other" profile: what it looks like, in the rep's words. */
  otherDescription: string
  quoteAs: QuoteAs | null
  color: 'Natural' | 'Blue' | 'Grey' | null
  frameIn: FrameSize | null
  /** Natural UHMW-PE or the oil-filled grade, where the family offers both. */
  material: WearstripMaterial | null
  /** Measured profile dimensions, inches. Absent / null = not measured. */
  dims: Partial<Record<DimKey, number | null>>
  rails: number | null
  /** True: one length applies to every rail (`lengthsIn[0]`). False: one per rail. */
  sameLength: boolean
  lengthsIn: (number | null)[]
}

export function emptyWorksheet(): WearstripWorksheet {
  return {
    use: null,
    profileId: null,
    otherDescription: '',
    quoteAs: null,
    color: null,
    frameIn: null,
    material: null,
    dims: {},
    rails: null,
    sameLength: true,
    lengthsIn: [null],
  }
}

/** A ratio within this of a whole number is that whole number (20 ft is 2 sections, not 3). */
const EPS = 1e-6

export function ceilTolerant(x: number): number {
  const r = Math.round(x)
  return Math.abs(x - r) < EPS ? r : Math.ceil(x)
}

/** Stock lengths needed when every rail is rounded up on its own. */
export function sectionsPerRailRule(lengthsIn: readonly number[], stockLengthIn: number): number {
  return lengthsIn.reduce((sum, l) => sum + ceilTolerant(l / stockLengthIn), 0)
}

/** One length per rail, resolved from the "same length" toggle. Null if anything is missing. */
export function railLengths(ws: WearstripWorksheet): number[] | null {
  const rails = ws.rails
  if (!rails || !Number.isInteger(rails) || rails < 1) return null
  const raw = ws.sameLength ? Array.from({ length: rails }, () => ws.lengthsIn[0]) : ws.lengthsIn.slice(0, rails)
  if (raw.length < rails) return null
  return raw.every((l): l is number => typeof l === 'number' && Number.isFinite(l) && l > 0) ? raw : null
}

/** The catalog part this worksheet quotes, or null for "match" / not chosen yet. */
export function wearstripItemFor(ws: WearstripWorksheet): WearstripItem | null {
  if (!ws.quoteAs || ws.quoteAs === 'match') return null
  return findWearstrip(ws.quoteAs, { color: ws.color, frameIn: ws.frameIn, material: ws.material })
}

/** What's still missing, as field labels the Review screen can list. */
export function missingForWearstrip(ws: WearstripWorksheet): string[] {
  const missing: string[] = []
  const profile = getProfile(ws.profileId)
  if (!ws.use) missing.push('Use')
  if (!profile) missing.push('Installed profile')
  if (profile?.id === 'other' && !ws.otherDescription.trim()) missing.push('Describe the profile')
  if (!ws.quoteAs) missing.push('What to quote')
  else if (ws.quoteAs !== 'match') {
    // Ask only for the choices this family actually has more than one of.
    if (framesFor(ws.quoteAs).length > 0 && !ws.frameIn) missing.push('Frame thickness')
    if (materialsFor(ws.quoteAs).length > 1 && !ws.material) missing.push('Material')
    if (colorsFor(ws.quoteAs, ws.material).length > 1 && !ws.color) missing.push('Color')
  }
  if (!ws.rails || !Number.isInteger(ws.rails) || ws.rails < 1) {
    missing.push('Number of rails')
  } else if (ws.sameLength) {
    if (!isLength(ws.lengthsIn[0])) missing.push('Rail length')
  } else {
    for (let i = 0; i < ws.rails; i++) {
      if (!isLength(ws.lengthsIn[i])) missing.push(`Rail ${i + 1} length`)
    }
  }
  return missing
}

const isLength = (l: number | null | undefined) => typeof l === 'number' && Number.isFinite(l) && l > 0

// ---- Text ------------------------------------------------------------------

/** A run of rail, the way a rep says it: "23 ft 6 in", or metres when working in mm. */
export function formatRun(lengthIn: number, unit: Unit): string {
  if (unit === 'mm') return `${trim((lengthIn * 25.4) / 1000, 2)} m`
  let ft = Math.floor(lengthIn / 12)
  let rest = lengthIn - ft * 12
  if (Math.round(rest * 16) === 12 * 16) {
    ft += 1
    rest = 0
  }
  const inches = toFractionalInches(rest)
  if (ft === 0) return `${inches} in`
  return inches === '0' ? `${ft} ft` : `${ft} ft ${inches} in`
}

/** Total footage, "94 ft" / "28.65 m". */
export function formatTotal(totalIn: number, unit: Unit): string {
  return unit === 'mm' ? `${trim((totalIn * 25.4) / 1000, 2)} m` : `${trim(totalIn / 12, 1)} ft`
}

/** A profile dimension for CS: plain decimals, never a rounded fraction. */
export function formatDim(valueIn: number, unit: Unit): string {
  return unit === 'mm' ? trim(valueIn * 25.4, 1) : trim(valueIn, 3)
}

function trim(n: number, places: number): string {
  return String(Number(n.toFixed(places)))
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// ---- The BOM line ----------------------------------------------------------

export interface WearstripRow {
  partNumber: string
  description: string
  qty: number
  uom: string
  notes: string
  /** One line saying how the quantity was worked out. */
  reason: string
}

/** The BOM line for a finished worksheet, or null while anything is missing. */
export function wearstripRow(ws: WearstripWorksheet, unit: Unit): WearstripRow | null {
  if (missingForWearstrip(ws).length > 0) return null
  const lengths = railLengths(ws)
  const profile = getProfile(ws.profileId)
  if (!lengths || !profile) return null

  const rails = lengths.length
  const totalIn = lengths.reduce((a, b) => a + b, 0)
  const runText = ws.sameLength
    ? `${plural(rails, 'rail')}, ${formatRun(lengths[0], unit)} each, ${formatTotal(totalIn, unit)} total`
    : `${plural(rails, 'rail')} of different lengths, ${formatTotal(totalIn, unit)} total`

  if (ws.quoteAs === 'match') {
    const feet = ceilTolerant(totalIn / 12)
    const name = profile.id === 'other' ? `profile (${ws.otherDescription.trim()})` : profile.label.toLowerCase()
    const dimText = matchDimText(ws, profile.dims, unit)
    return {
      partNumber: CS_TO_SOURCE,
      description: `Match existing ${name}${dimText ? `, ${dimText}` : ''}`,
      qty: feet,
      uom: 'ft',
      notes: `${ws.use}. ${runText}. Field identification only. See photos.`,
      reason: `${formatTotal(totalIn, unit)} of rail, rounded up to ${feet} ft.`,
    }
  }

  const item = wearstripItemFor(ws)
  if (!item) return null
  const noun = item.stockLengthIn >= 6000 ? 'length' : 'section'
  const stockText = `${formatRun(item.stockLengthIn, 'in')} each`
  const qty = sectionsPerRailRule(lengths, item.stockLengthIn)
  const reason = ws.sameLength
    ? `${plural(rails, 'rail')} × ${formatRun(lengths[0], unit)} → ${plural(qty / rails, noun)} per rail = ${plural(qty, noun)} (${stockText}).`
    : `${plural(rails, 'rail')}, ${formatTotal(totalIn, unit)} total → ${plural(qty, noun)} (${stockText}), rounded up per rail.`

  return {
    partNumber: item.partNumber,
    description: item.description,
    qty,
    uom: item.uom,
    notes: `${ws.use}. ${runText}`,
    reason,
  }
}

/** "W 1.25 × H 0.75, RW 1 × RT 0.25, O 0.875 in" -- only what was measured. */
function matchDimText(ws: WearstripWorksheet, keys: readonly DimKey[], unit: Unit): string {
  const v = (k: DimKey) => {
    const n = ws.dims[k]
    return typeof n === 'number' && Number.isFinite(n) && keys.includes(k) ? `${k} ${formatDim(n, unit)}` : null
  }
  const parts = [
    [v('W'), v('H')].filter(Boolean).join(' × '),
    [v('RW'), v('RT')].filter(Boolean).join(' × '),
    v('O') ?? '',
  ].filter(Boolean)
  return parts.length ? `${parts.join(', ')} ${unit}` : ''
}

// ---- Warnings --------------------------------------------------------------

/** Wider than a tape can resolve, so a real difference rather than reading noise. */
const SIZE_TOLERANCE_IN = 1 / 16 + EPS

/** Rails longer than this are probably a typo (feet typed as inches, an extra zero). */
export const LONG_RAIL_IN = 100 * 12

export function wearstripWarnings(ws: WearstripWorksheet, unit: Unit): string[] {
  const out: string[] = []
  const item = wearstripItemFor(ws)

  if (item?.dims) {
    const label = getFamily(item.family).label
    // Flanged: W is overall (1.0 in wear surface + 0.25 in flange = 1.25 in)
    // and H is to the wear surface, per the drawing in the menu and manual.
    const checks: [DimKey, number, string][] = [
      ['W', item.dims.widthIn + (item.dims.flangeWidthIn ?? 0), 'wide'],
      ['H', item.dims.heightIn, item.dims.flangeWidthIn ? 'to the wear surface' : 'high'],
    ]
    for (const [k, catalogIn, word] of checks) {
      const measured = ws.dims[k]
      if (typeof measured === 'number' && Math.abs(measured - catalogIn) > SIZE_TOLERANCE_IN) {
        out.push(
          `Measured ${formatDim(measured, unit)} ${unit} ${word}; ${label} is ${formatDim(catalogIn, unit)} ${unit}. ` +
            `Check the frame fits, or quote 'Match the installed profile'.`,
        )
      }
    }
  }

  if (ws.quoteAs === 'match' && !(isLength(ws.dims.W) && isLength(ws.dims.H))) {
    out.push(
      `CS can't source a match without ${DIM_LABELS.W.toLowerCase()} (W) and ${DIM_LABELS.H.toLowerCase()} (H). ` +
        'Add them, or attach an end photo with a ruler.',
    )
  }

  const lengths = ws.sameLength ? [ws.lengthsIn[0]] : ws.lengthsIn.slice(0, ws.rails ?? 0)
  const longest = Math.max(0, ...lengths.filter(isLength).map(Number))
  if (longest > LONG_RAIL_IN) {
    out.push(`One rail is ${formatRun(longest, unit)}. Is that right?`)
  }
  return out
}

/** Does this line need an end-profile photo for CS (match installed, or "Other")? */
export function needsEndPhoto(ws: WearstripWorksheet): boolean {
  return ws.quoteAs === 'match' || ws.profileId === 'other'
}
