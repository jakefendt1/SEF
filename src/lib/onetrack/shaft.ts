// The square shaft worksheet: Intralox's "Square Shaft Specification Sheet"
// (Onetrack/Shaft Spec Form.pdf), rebuilt. CS needs one for every shaft we or
// the machine shop make. A shaft line on the BOM carries the whole sheet; the
// BOM shows a one-line summary and the sheet downloads as its own PDF.
//
// Every length is canonical inches. 0 is an answer (no journal on that end),
// not a blank.

import { CS_TO_QUOTE } from './catalog'
import { normalizeSeries } from './filter'
import { MM_PER_IN, type Unit } from '../measurement'

/**
 * A shaft dimension for the shop: up to four decimals in inches (a 3/16 in
 * keyway is 0.1875, not 0.188), two in mm. Never rounded to a fraction.
 */
export function formatShaftDim(valueIn: number, unit: Unit): string {
  return unit === 'mm' ? String(Number((valueIn * MM_PER_IN).toFixed(2))) : String(Number(valueIn.toFixed(4)))
}

export const SHAFT_MATERIALS = [
  'Aluminum #6061',
  'Carbon steel #1018',
  'Stainless steel #303/304',
  'Stainless steel #316',
] as const
export type ShaftMaterial = (typeof SHAFT_MATERIALS)[number]

/** Square sizes on the form, with their across-flats size in inches. */
export const SHAFT_SIZES = [
  { id: '5/8', label: '5/8 in square', in: 0.625 },
  { id: '1', label: '1 in square', in: 1 },
  { id: '1.5', label: '1.5 in square', in: 1.5 },
  { id: '2.5', label: '2.5 in square', in: 2.5 },
  { id: '3.5', label: '3.5 in square', in: 3.5 },
] as const
export type ShaftSizeId = (typeof SHAFT_SIZES)[number]['id']

/** The two menu items that open this worksheet. */
export const SHAFT_ITEM_IDS = ['quote-cleanlock-shaft', 'quote-ss-shaft'] as const
export const isShaftItem = (itemId: string) => (SHAFT_ITEM_IDS as readonly string[]).includes(itemId)

/**
 * What the menu offers for each item (p.10): CleanLock shafts are 1.5 or 2.5
 * in, stainless; machined stainless shafts are 1.0, 1.5, 2.5 or 3.5 in. The
 * form itself also lists aluminum, carbon steel and 5/8 in for other shafts.
 */
export function shaftOptions(itemId: string): { materials: readonly ShaftMaterial[]; sizes: readonly ShaftSizeId[] } {
  if (itemId === 'quote-cleanlock-shaft') {
    return { materials: ['Stainless steel #303/304', 'Stainless steel #316'], sizes: ['1.5', '2.5'] }
  }
  return { materials: SHAFT_MATERIALS, sizes: SHAFT_SIZES.map((s) => s.id) }
}

export interface ShaftEnd {
  /** Journal length from the shoulder to the end. 0 = no journal. */
  lengthIn: number | null
  diaIn: number | null
}

export interface DrillTap {
  depthIn: number | null
  screwSize: string
  threadsPer: string
  end1: boolean
  end2: boolean
}

export interface Keyway {
  end: 1 | 2
  widthIn: number | null
  depthIn: number | null
  lengthIn: number | null
  /** From the end of the shaft to where the keyway starts. */
  startIn: number | null
}

export interface ShaftDrawing {
  overallIn: number | null
  end1: ShaftEnd
  end2: ShaftEnd
  /** Dimension inside the retainer ring grooves. */
  insideGroovesIn: number | null
  /** Only when the rings are off center: End 1 shoulder to the first groove. */
  grooveOffsetIn: number | null
  drillTap: DrillTap | null
}

export interface Sprockets {
  series: string
  perShaft: number | null
  pitchDia: string
}

export interface ShaftSpec {
  material: ShaftMaterial | null
  size: ShaftSizeId | null
  driveQty: number
  idleQty: number
  hollowGearBox: boolean | null
  driveSprockets: Sprockets
  idleSprockets: Sprockets
  grooves: 'std' | 'none' | 'multiple' | null
  groovesNote: string
  /** The form arrives with Yes ticked; the rep can untick it. */
  chamfer: boolean | null
  drive: ShaftDrawing
  keyway: Keyway | null
  idle: ShaftDrawing
  notes: string
}

const emptyEnd = (): ShaftEnd => ({ lengthIn: null, diaIn: null })
export const emptyDrawing = (): ShaftDrawing => ({
  overallIn: null,
  end1: emptyEnd(),
  end2: emptyEnd(),
  insideGroovesIn: null,
  grooveOffsetIn: null,
  drillTap: null,
})
const emptySprockets = (): Sprockets => ({ series: '', perShaft: null, pitchDia: '' })

export function emptyShaftSpec(): ShaftSpec {
  return {
    material: null,
    size: null,
    driveQty: 0,
    idleQty: 0,
    hollowGearBox: null,
    driveSprockets: emptySprockets(),
    idleSprockets: emptySprockets(),
    grooves: null,
    groovesNote: '',
    chamfer: true,
    drive: emptyDrawing(),
    keyway: null,
    idle: emptyDrawing(),
    notes: '',
  }
}

export const emptyDrillTap = (): DrillTap => ({ depthIn: null, screwSize: '', threadsPer: '', end1: false, end2: false })
export const emptyKeyway = (): Keyway => ({ end: 2, widthIn: null, depthIn: null, lengthIn: null, startIn: null })

export function sizeIn(size: ShaftSizeId | null): number | null {
  return SHAFT_SIZES.find((s) => s.id === size)?.in ?? null
}

const has = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v)
const positive = (v: number | null | undefined): v is number => has(v) && v > 0
const nonNegative = (v: number | null | undefined): v is number => has(v) && v >= 0

/** Length of the square section: overall less both journals. Null until all three are in. */
export function squareLengthIn(d: ShaftDrawing): number | null {
  if (!has(d.overallIn) || !has(d.end1.lengthIn) || !has(d.end2.lengthIn)) return null
  return d.overallIn - d.end1.lengthIn - d.end2.lengthIn
}

function missingForDrawing(d: ShaftDrawing, label: string, spec: ShaftSpec): string[] {
  const out: string[] = []
  if (!positive(d.overallIn)) out.push(`${label}: overall length`)
  for (const [n, end] of [[1, d.end1], [2, d.end2]] as const) {
    if (!nonNegative(end.lengthIn)) out.push(`${label}: End ${n} journal length`)
    else if (end.lengthIn > 0 && !positive(end.diaIn)) out.push(`${label}: End ${n} journal diameter`)
  }
  if (spec.grooves === 'std' && !positive(d.insideGroovesIn)) out.push(`${label}: dimension inside ring grooves`)
  if (d.drillTap) {
    const t = d.drillTap
    if (!positive(t.depthIn)) out.push(`${label}: drill & tap depth`)
    if (!t.screwSize.trim()) out.push(`${label}: drill & tap screw size`)
    if (!t.threadsPer.trim()) out.push(`${label}: drill & tap threads per inch`)
    if (!t.end1 && !t.end2) out.push(`${label}: which end to drill & tap`)
  }
  return out
}

/** What's still missing, as field labels the Review screen can list. */
export function missingForShaft(spec: ShaftSpec): string[] {
  const out: string[] = []
  if (!spec.material) out.push('Material')
  if (!spec.size) out.push('Size')
  if (spec.driveQty + spec.idleQty < 1) out.push('How many (drive or idle)')
  if (spec.driveQty > 0 && spec.hollowGearBox === null) out.push('Hollow shaft gear box')
  if (!spec.grooves) out.push('Retainer ring grooves')
  if (spec.grooves === 'multiple' && !spec.groovesNote.trim()) out.push('Where the multiple grooves go')
  if (spec.chamfer === null) out.push('Chamfer')
  if (spec.driveQty > 0) {
    out.push(...missingForDrawing(spec.drive, 'Drive shaft', spec))
    if (spec.keyway) {
      const k = spec.keyway
      if (!positive(k.widthIn)) out.push('Keyway width')
      if (!positive(k.depthIn)) out.push('Keyway depth')
      if (!positive(k.lengthIn)) out.push('Keyway length')
      if (!nonNegative(k.startIn)) out.push('Keyway start')
    }
  }
  if (spec.idleQty > 0) out.push(...missingForDrawing(spec.idle, 'Idle shaft', spec))
  return out
}

/** Sprockets on these series need chamfered shafts (the form's note). */
const CHAMFER_SERIES = ['200', '400', '800']

export function shaftWarnings(spec: ShaftSpec, unit: Unit): string[] {
  const out: string[] = []
  const sq = sizeIn(spec.size)
  const fmt = (v: number) => `${formatShaftDim(v, unit)} ${unit}`
  const check = (d: ShaftDrawing, label: string) => {
    const square = squareLengthIn(d)
    if (square !== null && square <= 0) out.push(`${label}: the journals are as long as the whole shaft. Check the lengths.`)
    for (const [n, end] of [[1, d.end1], [2, d.end2]] as const) {
      if (sq !== null && positive(end.diaIn) && positive(end.lengthIn) && end.diaIn > sq) {
        out.push(`${label}: End ${n} journal (${fmt(end.diaIn)}) is bigger than the ${fmt(sq)} square. Is that right?`)
      }
    }
    if (square !== null && square > 0 && positive(d.insideGroovesIn) && d.insideGroovesIn > square) {
      out.push(`${label}: the ring grooves (${fmt(d.insideGroovesIn)} apart) don't fit on the ${fmt(square)} square section.`)
    }
  }
  if (spec.driveQty > 0) check(spec.drive, 'Drive shaft')
  if (spec.idleQty > 0) check(spec.idle, 'Idle shaft')
  if (spec.chamfer === false) {
    const series = [spec.driveSprockets.series, spec.idleSprockets.series].map(normalizeSeries)
    if (series.some((s) => s && CHAMFER_SERIES.includes(s))) {
      out.push('Sprockets for S200, S400 and non-EZ Clean S800 need a chamfered shaft. The sheet says no chamfer.')
    }
  }
  return out
}

export interface ShaftRow {
  partNumber: string
  description: string
  qty: number
  uom: string
  notes: string
}

/** The BOM line: a one-line summary. The details are on the spec sheet. */
export function shaftRow(spec: ShaftSpec, itemDescription: string, unit: Unit): ShaftRow | null {
  if (missingForShaft(spec).length > 0) return null
  const size = SHAFT_SIZES.find((s) => s.id === spec.size)!
  const kind = itemDescription.startsWith('CleanLock') ? 'CleanLock square shaft' : 'Square shaft, machined to spec'
  const parts: string[] = []
  const len = (d: ShaftDrawing) => `${formatShaftDim(d.overallIn!, unit)} ${unit} long`
  if (spec.driveQty > 0) parts.push(`${spec.driveQty} drive (${len(spec.drive)}${spec.keyway ? ', keyway' : ''})`)
  if (spec.idleQty > 0) parts.push(`${spec.idleQty} idle (${len(spec.idle)})`)
  return {
    partNumber: CS_TO_QUOTE,
    description: `${kind}, ${size.label}, ${spec.material!.toLowerCase()}: ${parts.join(', ')}`,
    qty: spec.driveQty + spec.idleQty,
    uom: 'each',
    notes: 'Details on the attached Square Shaft Specification Sheet.',
  }
}

/** The form's fixed tolerances and finishes, printed on every sheet. */
export const SHAFT_TOLERANCES = [
  'Overall length: up to 48 in ±0.061; 48 in and over ±0.125',
  'Journal & stepdown: -0.0005 / -0.003',
  'Keyway widths: +0.003 / -0.000',
  'Other: ±0.031',
] as const
export const SHAFT_FINISHES = [
  'Journal & stepdown journal diameter: 63 microinches',
  'Other machined surfaces: 125 microinches',
] as const
export const SHAFT_TOLERANCE_NOTE = 'Unless otherwise specified.'
