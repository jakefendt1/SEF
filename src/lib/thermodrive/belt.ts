// The belt the ThermoDrive Belt Configurator describes. Started from
// Patrick's v0.65 model (`state()` + `model` in his HTML); the product comes
// from the manual's data sheets (products.ts) and flights carry the Bulk
// Density calculator's flight types. Lengths in mm, as in his file; the UI
// converts. Pure data; geometry.ts and validate.ts work on it.
import { FLIGHT_TYPES } from '../tdBulkDensity/data/flights'
import type { FlightType } from '../tdBulkDensity/types'
import { IN, MIN_FLIGHT_SIDEWALL_GAP_MM, PITCH_MM, START_ROW, SSW_FP, SSW_HEIGHTS_IN, type BeltSeries } from './data'
import { PRODUCTS, findProduct, styleOf, type Drive, type Joining, type Product } from './products'

/**
 * even/manual/position are Patrick's. center: one notch on the belt
 * centerline. lugs: a notch over each drive lug (8140), which position
 * limiters need on a flighted belt (manual p.139).
 */
export type NotchMode = 'even' | 'manual' | 'position' | 'center' | 'lugs'

/** One flight variation (Patrick's newVar). A belt carries one or two. */
export interface FlightVar {
  /** Row of the first flight from the splice (half rows allowed on 8140). */
  startRow: number
  flightType: FlightType
  thicknessMm: number
  indentLMm: number
  indentRMm: number
  /** Nominal height: for scoops, the lip tip's height. */
  heightMm: number
  notchOn: boolean
  notchMode: NotchMode
  /** even: how many notches. even/center/lugs: how wide each is. */
  notchCount: number
  notchWMm: number
  /** manual: n+1 flight widths and heights, n notch widths. */
  flightWidthsMm: number[]
  flightHeightsMm: number[]
  notchWidthsMm: number[]
  /** position: each notch's left edge from the belt's left edge. */
  notchPosMm: number[]
}

export type VgMode = 'channel' | 'centerline'

export interface TdBelt {
  series: BeltSeries
  /** Drive and surface, e.g. "Dual-Lug Flat Top E (10.5 mm)" (products.ts styleOf). */
  style: string
  material: string
  color: string
  joining: Joining
  widthMm: number
  lengthMm: number
  flightsOn: boolean
  /** Flight spacing; a whole number of rows once snapped. */
  flightSpacingMm: number
  vars: FlightVar[]
  sidewallsOn: boolean
  sidewallHeightIn: number
  sidewallInsetMm: number
  sidewallsBoth: boolean
  vgOn: boolean
  vgCount: number
  vgMode: VgMode
  vgIndentLMm: number
  vgIndentRMm: number
  /** channel mode: the n-2 interior channel widths. */
  vgChannelsMm: number[]
  /** centerline mode: the n-2 interior centerlines from the left edge. */
  vgCenterlinesMm: number[]
  /** 4 guides: pairs centered on the belt. */
  vgOuterSpMm: number
  vgInnerSpMm: number
}

export const DEFAULT_INDENT_MM = 1.25 * IN
export const DEFAULT_VG_INDENT_MM = 0.5 * IN
export const DEFAULT_CHANNEL_MM = 1.0 * IN
export const DEFAULT_SPACING_MM = 149
export const DEFAULT_FLIGHT_THICKNESS_MM = 0.16 * IN

export function newVar(startRow: number): FlightVar {
  return {
    startRow,
    flightType: 'deg90',
    thicknessMm: DEFAULT_FLIGHT_THICKNESS_MM,
    indentLMm: DEFAULT_INDENT_MM,
    indentRMm: DEFAULT_INDENT_MM,
    heightMm: 0,
    notchOn: false,
    notchMode: 'even',
    notchCount: 5,
    notchWMm: 25,
    flightWidthsMm: [],
    flightHeightsMm: [],
    notchWidthsMm: [],
    notchPosMm: [],
  }
}

/** The first data sheet for a series (and drive), the configurator's default product. */
function firstProduct(series: BeltSeries, drive?: Drive): Product {
  return PRODUCTS.find((x) => x.series === series && (!drive || x.drive === drive)) ?? PRODUCTS[0]
}

/** Width and length start at 0: nothing pre-filled. */
export function freshBelt(series: BeltSeries = '8050'): TdBelt {
  const pr = firstProduct(series)
  const sr = START_ROW[series]
  return {
    series,
    style: styleOf(pr),
    material: pr.material,
    color: pr.colors[0],
    joining: pr.joining.includes('endless') ? 'endless' : pr.joining[0],
    widthMm: 0,
    lengthMm: 0,
    flightsOn: pr.flights,
    flightSpacingMm: DEFAULT_SPACING_MM,
    vars: [newVar(sr)],
    sidewallsOn: false,
    sidewallHeightIn: SSW_HEIGHTS_IN[series]?.[1] ?? 2,
    sidewallInsetMm: DEFAULT_INDENT_MM,
    sidewallsBoth: true,
    vgOn: false,
    vgCount: 2,
    vgMode: 'channel',
    vgIndentLMm: DEFAULT_VG_INDENT_MM,
    vgIndentRMm: DEFAULT_VG_INDENT_MM,
    vgChannelsMm: [DEFAULT_CHANNEL_MM, DEFAULT_CHANNEL_MM],
    vgCenterlinesMm: [150, 300],
    vgOuterSpMm: 520,
    vgInnerSpMm: 180,
  }
}

export const pitchMm = (b: Pick<TdBelt, 'series'>): number => PITCH_MM[b.series]

/**
 * What the belt takes, from its data sheet. A belt the manual doesn't list
 * (Patrick's names in the parity tests) falls back to his series rules.
 */
export function accessories(b: Pick<TdBelt, 'series' | 'style' | 'material'>): { flights: boolean; sidewalls: boolean; vguides: boolean } {
  const pr = findProduct(b)
  if (pr) return { flights: pr.flights, sidewalls: pr.sidewalls, vguides: pr.vguides }
  return { flights: true, sidewalls: !!SSW_HEIGHTS_IN[b.series], vguides: b.series === '8140' }
}

/** Sidewall pitch (mm): 40 on 8140; 25 for 1 in polyurethane on 8050; else 50. */
export function sidewallPitch(b: Pick<TdBelt, 'series' | 'sidewallHeightIn' | 'material'>): 25 | 40 | 50 {
  if (b.series === '8140') return 40
  if (b.series === '8050' && b.sidewallHeightIn === 1 && b.material.toUpperCase() === 'POLYURETHANE') return 25
  return 50
}

export function sidewallFootprint(b: Pick<TdBelt, 'series' | 'sidewallHeightIn' | 'material'>): { fp: number; th: number } {
  return SSW_FP[sidewallPitch(b)]
}

/** Where flights start when they build off the sidewalls: inset + footprint + the 0.2 in gap. */
export function flightIndentForSidewalls(b: Pick<TdBelt, 'series' | 'sidewallHeightIn' | 'material' | 'sidewallInsetMm'>): number {
  return b.sidewallInsetMm + sidewallFootprint(b).fp + MIN_FLIGHT_SIDEWALL_GAP_MM
}

/** Flights per spacing: the spacing in whole rows (at least 1). */
export function flightMult(b: Pick<TdBelt, 'series' | 'flightSpacingMm'>): number {
  return Math.max(1, Math.round(b.flightSpacingMm / pitchMm(b)))
}

/** Flights, sidewalls and V-guides count only where the belt takes them. */
export function effective(b: TdBelt): TdBelt {
  const a = accessories(b)
  return { ...b, flightsOn: b.flightsOn && a.flights, sidewallsOn: b.sidewallsOn && a.sidewalls, vgOn: b.vgOn && a.vguides }
}

/** Pick a product: anything left unsaid keeps its value when the new product allows it. */
export function withProduct(b: TdBelt, pick: { series?: BeltSeries; drive?: Drive; surface?: string; material?: string }): TdBelt {
  const series = pick.series ?? b.series
  const cur = findProduct(b)
  const drive = pick.drive ?? (series === b.series ? cur?.drive : undefined)
  const candidates = PRODUCTS.filter((x) => x.series === series && (!drive || x.drive === drive))
  const surface = pick.surface ?? cur?.surface
  const bySurface = candidates.filter((x) => x.surface === surface)
  const pool = bySurface.length ? bySurface : candidates
  const material = pick.material ?? b.material
  const pr = pool.find((x) => x.material === material) ?? pool[0] ?? firstProduct(series, drive)
  const heights = SSW_HEIGHTS_IN[series] ?? []
  const next: TdBelt = {
    ...b,
    series,
    style: styleOf(pr),
    material: pr.material,
    color: pr.colors.includes(b.color) ? b.color : pr.colors[0],
    joining: pr.joining.includes(b.joining) ? b.joining : pr.joining.includes('endless') ? 'endless' : pr.joining[0],
    vars: series === b.series ? b.vars : b.vars.map((v, i) => ({ ...v, startRow: START_ROW[series] + i })),
    sidewallHeightIn: heights.includes(b.sidewallHeightIn) ? b.sidewallHeightIn : (heights[0] ?? b.sidewallHeightIn),
  }
  return { ...next, flightsOn: next.flightsOn && pr.flights, sidewallsOn: next.sidewallsOn && pr.sidewalls, vgOn: next.vgOn && pr.vguides }
}

/** Heights and thicknesses a flight type comes in (the Bulk Density calculator's table, manual p.75-77). */
export function flightOptions(type: FlightType) {
  const t = FLIGHT_TYPES[type]
  return { heightsIn: t.heights, minIn: t.minHeightIn, maxIn: t.maxHeightIn, thicknessesIn: t.thicknessesIn, maxLengthIn: t.maxLengthIn }
}

/** Sidewall settings that flights build off. */
const sidewallKey = (b: TdBelt) => [b.sidewallsOn, b.sidewallHeightIn, b.sidewallInsetMm, b.sidewallsBoth, b.material, b.series].join('|')

/**
 * Flights build off the sidewalls: when the sidewalls change, each flight's
 * ends move to the sidewall's footprint plus the 0.2 in gap. Typing an indent
 * by hand afterwards is left alone (validate.ts still flags it if too close).
 */
export function buildOffSidewalls(prev: TdBelt, next: TdBelt): TdBelt {
  const e = effective(next)
  if (!e.sidewallsOn || sidewallKey(prev) === sidewallKey(next)) return next
  const at = flightIndentForSidewalls(e)
  return {
    ...next,
    vars: next.vars.map((v) => ({ ...v, indentLMm: at, indentRMm: next.sidewallsBoth ? at : v.indentRMm })),
  }
}
