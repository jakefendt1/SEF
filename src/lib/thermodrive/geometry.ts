// Belt geometry, ported from Patrick's v0.65 "GEOMETRY ENGINE", "Max Section
// Length engine", ThermoLace and sectioning code. Each function keeps his
// name and logic; only the inputs are explicit (his read the page's model).
// Lengths in mm.
import {
  DRIVE_DUAL_CENTERS_MM,
  DRIVE_LUG_WIDTH_MM,
  FLIGHT_CLEAR_ROWS,
  IN,
  SECTION_RULES,
  VGUIDE_WIDTH_MM,
} from './data'
import { flightMult, pitchMm, sidewallFootprint, type FlightVar, type TdBelt } from './belt'

const EPS = 1e-6
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export interface Segments {
  /** Flight pieces [start, end] across the width, from the left edge. */
  segs: [number, number][]
  /** The notches and widths don't fit between the indents. */
  over: boolean
  /** Even notches: each flight piece's width. */
  computedFlightWMm?: number
}

/** Flight segments across the width for one variation (his flightSegments). */
export function flightSegments(b: Pick<TdBelt, 'widthMm'>, v: FlightVar): Segments {
  const start = v.indentLMm
  const end = b.widthMm - v.indentRMm
  if (v.notchOn && v.notchMode === 'position') {
    const notches: [number, number][] = []
    for (let i = 0; i < v.notchCount; i++) {
      const a = v.notchPosMm[i] ?? 0
      notches.push([a, a + (v.notchWidthsMm[i] ?? 25)])
    }
    notches.sort((x, y) => x[0] - y[0])
    const segs: [number, number][] = []
    let cur = start
    let over = false
    for (const [a, c] of notches) {
      if (a < cur - EPS) over = true
      if (a > cur + EPS) segs.push([cur, a])
      cur = Math.max(cur, c)
    }
    if (cur > end + EPS) over = true
    if (cur < end - EPS) segs.push([cur, end])
    if (end < start) over = true
    return { segs, over }
  }
  const usable = end - start
  if (!v.notchOn || v.notchCount <= 0) return { segs: [[start, end]], over: usable < 0 }
  const n = v.notchCount
  const segs: [number, number][] = []
  let x = start
  if (v.notchMode === 'even') {
    const fw = (usable - n * v.notchWMm) / (n + 1)
    for (let i = 0; i <= n; i++) {
      segs.push([x, x + fw])
      x += fw + v.notchWMm
    }
    return { segs, over: fw < 0, computedFlightWMm: fw }
  }
  for (let i = 0; i <= n; i++) {
    const fw = v.flightWidthsMm[i] ?? 50
    segs.push([x, x + fw])
    x += fw
    if (i < n) x += v.notchWidthsMm[i] ?? 25
  }
  return { segs, over: x - start > usable }
}

/** A segment's height: manual notches may give each piece its own. */
export function segHeight(v: FlightVar, i: number): number {
  if (!v.notchOn || v.notchMode !== 'manual') return v.heightMm
  return v.flightHeightsMm[i] ?? v.heightMm
}

/** Drive features across the width: 8140 has one or two lugs; the others span the width. */
export function driveBands(b: Pick<TdBelt, 'series' | 'style' | 'widthMm'>): [number, number][] {
  if (b.series !== '8140') return [[0, b.widthMm]]
  const half = DRIVE_LUG_WIDTH_MM / 2
  const cl = b.widthMm / 2
  if (/DUAL LUG/i.test(b.style)) {
    const off = DRIVE_DUAL_CENTERS_MM / 2
    return [
      [cl - off - half, cl - off + half],
      [cl + off - half, cl + off + half],
    ]
  }
  return [[cl - half, cl + half]]
}

export interface SpliceInfo {
  /** Nominal spacing (mm) and in rows. */
  spacingMm: number
  mult: number
  /** Flights on the belt after any removal. */
  count: number
  /** A flight landed on, or within 1 row of, the splice and was removed. */
  removed: { row: number; posMm: number; reason: string } | null
  firstRow?: number
  lastRow?: number
  /** Row of the splice: half a row past the final row. */
  spliceRow?: number
  seamToFirstMm?: number
  tailToSeamMm?: number
  /** The gap across the seam, last flight to first: the "final flight spacing". */
  finalGapMm?: number
}

/** Where the last flight falls relative to the belt splice (his finalSpacingInfo). */
export function finalSpacingInfo(b: TdBelt, v: FlightVar): SpliceInfo {
  const pitch = pitchMm(b)
  const mult = flightMult(b)
  const S = mult * pitch
  const MIN_TAIL = 1
  const nextSplice = b.lengthMm / pitch + 0.5
  const rawNF = Math.floor((nextSplice - v.startRow) / mult + EPS) + 1
  if (rawNF < 1) return { spacingMm: S, mult, count: 0, removed: null }
  const firstRow = v.startRow
  const lastRowRaw = v.startRow + (rawNF - 1) * mult
  const tailRaw = nextSplice - lastRowRaw
  let nF = rawNF
  let removed: SpliceInfo['removed'] = null
  if (tailRaw <= MIN_TAIL + 1e-4) {
    removed = {
      row: lastRowRaw,
      posMm: lastRowRaw * pitch,
      reason: tailRaw < 1e-4 ? 'lands on the belt splice' : 'sits within 1 row of the belt splice',
    }
    nF = rawNF - 1
  }
  if (nF < 1) return { spacingMm: S, mult, count: 0, removed }
  const lastRow = v.startRow + (nF - 1) * mult
  const seamToFirstMm = (firstRow - 0.5) * pitch
  const tailToSeamMm = (nextSplice - lastRow) * pitch
  return {
    spacingMm: S,
    mult,
    count: nF,
    removed,
    firstRow,
    lastRow,
    spliceRow: nextSplice,
    seamToFirstMm,
    tailToSeamMm,
    finalGapMm: tailToSeamMm + seamToFirstMm,
  }
}

/** V-guide centerlines from the belt's left edge. */
export function vgPositions(b: TdBelt): number[] {
  const n = b.vgCount
  const VGW = VGUIDE_WIDTH_MM
  if (n <= 0) return []
  if (n === 1) return [b.widthMm / 2]
  if (n === 4) {
    const cl = b.widthMm / 2
    return [cl - b.vgOuterSpMm / 2, cl - b.vgInnerSpMm / 2, cl + b.vgInnerSpMm / 2, cl + b.vgOuterSpMm / 2]
  }
  const c0 = Math.max(0, b.vgIndentLMm) + VGW / 2
  const cLast = b.widthMm - Math.max(0, b.vgIndentRMm) - VGW / 2
  const centers = [c0]
  for (let i = 0; i < n - 2; i++) {
    centers.push(
      b.vgMode === 'channel'
        ? centers[centers.length - 1] + VGW + (b.vgChannelsMm[i] ?? 1.0 * IN)
        : (b.vgCenterlinesMm[i] ?? c0 + (i + 1) * 80),
    )
  }
  centers.push(cLast)
  return centers
}

/** Channel widths between neighbouring guides. */
export function vgChannels(b: TdBelt): number[] {
  const pos = vgPositions(b)
  return pos.slice(0, -1).map((p, i) => pos[i + 1] - p - VGUIDE_WIDTH_MM)
}

/** Clearance from the outermost V-guide on a side to each edge feature on that side. */
export function edgeFeatureClearances(b: TdBelt, side: 'L' | 'R'): { feature: string; gapMm: number }[] {
  const pos = vgPositions(b)
  if (!pos.length) return []
  const c = side === 'L' ? pos[0] : pos[pos.length - 1]
  const lo = c - VGUIDE_WIDTH_MM / 2
  const hi = c + VGUIDE_WIDTH_MM / 2
  const gapTo = (f: [number, number]) => Math.max(f[0] - hi, lo - f[1])
  const out: { feature: string; gapMm: number }[] = []
  if (b.sidewallsOn) {
    const fp = sidewallFootprint(b).fp
    const f: [number, number] =
      side === 'L' ? [b.sidewallInsetMm, b.sidewallInsetMm + fp] : [b.widthMm - b.sidewallInsetMm - fp, b.widthMm - b.sidewallInsetMm]
    out.push({ feature: 'sidewall', gapMm: gapTo(f) })
  }
  if (b.flightsOn) {
    b.vars.forEach((v, p) => {
      const f: [number, number] = side === 'L' ? [v.indentLMm, b.widthMm] : [0, b.widthMm - v.indentRMm]
      out.push({ feature: b.vars.length > 1 ? `flight variation ${p + 1}` : 'flights', gapMm: gapTo(f) })
    })
  }
  return out
}

export interface SectionMax {
  /** Max section length, or null when the tallest feature is over 6 in. */
  ft: number | null
  m: number | null
  label: string
  tallestIn: number
}

/**
 * Max fabrication section length by the tallest flight or sidewall (his
 * maxSectionInfo). V-guides always fall in the "up to 1.0 in" bracket; a flat
 * belt is 100 ft.
 */
export function maxSectionInfo(b: TdBelt): SectionMax {
  if (!(b.flightsOn || b.sidewallsOn || b.vgOn)) return { ft: 100, m: 30.48, label: 'flat belt (no flights, sidewalls or V-guides)', tallestIn: 0 }
  let maxIn = 0
  if (b.flightsOn) {
    for (const v of b.vars) flightSegments(b, v).segs.forEach((_, i) => (maxIn = Math.max(maxIn, segHeight(v, i) / IN)))
  }
  if (b.sidewallsOn) maxIn = Math.max(maxIn, b.sidewallHeightIn)
  for (const r of SECTION_RULES) if (maxIn <= r.maxIn + 1e-9) return { ft: r.ft, m: r.m, label: r.label, tallestIn: maxIn }
  return { ft: null, m: null, label: 'over 6.0" — no standard max length defined', tallestIn: maxIn }
}

/** ThermoLace loops are on a 1/2 in pitch, so the width must be a 1/2 in multiple. */
export function laceWidthValid(widthMm: number): boolean {
  const r = widthMm / (0.5 * IN)
  return Math.abs(r - Math.round(r)) < 1e-4
}

export interface LacePlacement {
  /** 8140: the lace replaces the drive row nearest the middle. Others: between two drive rows. */
  mode: 'onFeature' | 'between'
  laceMm: number
  replacedIndex: number
  rows: number
}

export function lacePlacement(b: Pick<TdBelt, 'series'>, lengthMm: number): LacePlacement {
  const pitch = pitchMm(b)
  const rows = Math.max(0, Math.floor(lengthMm / pitch + EPS))
  const mid = lengthMm / 2
  if (b.series === '8140') {
    const k = clamp(Math.round(mid / pitch), 1, Math.max(1, rows - 1))
    return { mode: 'onFeature', laceMm: k * pitch, replacedIndex: k, rows }
  }
  const k = clamp(Math.round(mid / pitch - 0.5), 0, Math.max(0, rows - 1))
  return { mode: 'between', laceMm: (k + 0.5) * pitch, replacedIndex: -1, rows }
}

export interface RepairFlights {
  kept: number[]
  /** Within 1 row of the lace: removed. */
  removed: number[]
  /** Distance from the last kept flight to the section end, when it is within 1 row. */
  endTooCloseMm: number | null
}

/** Flights on a repair section, with those within 1 row of the lace removed. */
export function repairFlights(b: TdBelt, lengthMm: number, spacingMm: number, v: FlightVar): RepairFlights {
  const pitch = pitchMm(b)
  const { laceMm } = lacePlacement(b, lengthMm)
  const clear = FLIGHT_CLEAR_ROWS * pitch
  const kept: number[] = []
  const removed: number[] = []
  if (spacingMm > 0) {
    for (let f = v.startRow * pitch; f <= lengthMm + EPS; f += spacingMm) {
      if (Math.abs(f - laceMm) <= clear + EPS) removed.push(f)
      else kept.push(f)
    }
  }
  const endDist = kept.length ? lengthMm - Math.max(...kept) : null
  return { kept, removed, endTooCloseMm: endDist !== null && endDist <= clear + EPS ? endDist : null }
}

export type SectionMode =
  | { kind: 'count'; count: number }
  | { kind: 'standard'; rows: number; remainderOnLast: boolean }
  | { kind: 'manual'; text: string }

export interface Sections {
  rows: number[]
  error: string
  note: string
  uneven?: boolean
  remainder?: number
  std?: number
  merged?: boolean
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

/** Split the belt into whole-row sections (his computeSections). */
export function computeSections(totalRows: number, mode: SectionMode): Sections {
  const total = totalRows
  if (!(total > 0)) return { rows: [], error: 'no length', note: '' }
  if (mode.kind === 'count') {
    const N = Math.max(1, Math.round(mode.count || 1))
    if (N > total) return { rows: [], error: `Only ${total} rows available — can't make ${N} sections.`, note: '' }
    const per = Math.floor(total / N)
    const rem = total - per * N
    if (!rem) return { rows: Array(N).fill(per), error: '', note: `${N} equal sections of ${per} rows.` }
    const rows = Array.from({ length: N }, (_, i) => (i < rem ? per + 1 : per))
    return { rows, error: '', note: `${total} rows doesn't divide evenly into ${N}: ${plural(rem, 'section')} carry one extra row.`, uneven: true }
  }
  if (mode.kind === 'standard') {
    const std = Math.max(1, Math.round(mode.rows || 1))
    const full = Math.floor(total / std)
    const rem = total - full * std
    if (full < 1) return { rows: [total], error: '', note: `Belt is shorter than one standard section: a single ${total}-row section.` }
    const rows: number[] = Array(full).fill(std)
    if (!rem) return { rows, error: '', note: `${plural(full, 'standard section')} of ${std} rows (divides evenly).`, remainder: 0, std }
    if (mode.remainderOnLast) {
      rows[full - 1] += rem
      const lead = full > 1 ? `${plural(full - 1, 'standard section')} of ${std} rows + last section` : 'Single section'
      return { rows, error: '', note: `${lead} of ${std + rem} rows (includes the ${rem}-row remainder).`, remainder: rem, std, merged: true }
    }
    rows.push(rem)
    return { rows, error: '', note: `${plural(full, 'standard section')} of ${std} rows + 1 remainder of ${rem} rows.`, remainder: rem, std }
  }
  const parts = mode.text.split(',').map((x) => x.trim()).filter(Boolean)
  if (!parts.length) return { rows: [], error: 'Enter one or more section lengths in rows.', note: '' }
  const rows: number[] = []
  for (const p of parts) {
    const n = Number(p)
    if (!Number.isFinite(n) || n <= 0) return { rows: [], error: `"${p}" isn't a valid row count.`, note: '' }
    if (Math.abs(n - Math.round(n)) > 1e-9) return { rows: [], error: `"${p}" isn't a whole row; sections are whole rows.`, note: '' }
    rows.push(Math.round(n))
  }
  const sum = rows.reduce((a, c) => a + c, 0)
  if (sum !== total) return { rows, error: `Sections total ${sum} rows but the belt is ${total} rows (off by ${sum - total > 0 ? '+' : ''}${sum - total}).`, note: '' }
  return { rows, error: '', note: `${plural(rows.length, 'manual section')}, summing to ${total} rows.` }
}

/** Nearest section counts that divide the belt evenly, searched outward from N. */
export function divisorSuggestions(total: number, N: number, howMany: number): number[] {
  const out: number[] = []
  for (let d = 1; d <= total && out.length < howMany * 2; d++) {
    const lo = N - d
    const hi = N + d
    if (lo >= 1 && total % lo === 0) out.push(lo)
    if (hi <= total && total % hi === 0) out.push(hi)
  }
  return [...new Set(out)].slice(0, howMany)
}

export interface JointResult {
  joint: number
  /** Cut position, rows from the belt start. */
  atRow: number
  variation: number
  removedBefore: number[]
  removedAfter: number[]
  /** Flight gap across the joint after removal, or null when one side has none. */
  acrossMm: number | null
}

/** Flights within 1 row of each section joint, either side, are removed (his drawSecJoints). */
export function jointRemovals(b: TdBelt, sectionRows: number[]): JointResult[] {
  if (!b.flightsOn || sectionRows.length < 2) return []
  const pitch = pitchMm(b)
  const mult = flightMult(b)
  const cr = FLIGHT_CLEAR_ROWS
  const out: JointResult[] = []
  let cum = 0
  for (let i = 0; i < sectionRows.length - 1; i++) {
    cum += sectionRows[i]
    const secRows = sectionRows[i]
    const nextRows = sectionRows[i + 1]
    b.vars.forEach((v, vi) => {
      const sr = v.startRow
      let nF = Math.floor((secRows - sr) / mult + 1e-9)
      let lastRow: number | null = nF >= 0 ? sr + nF * mult : null
      const removedBefore: number[] = []
      while (lastRow !== null && secRows - lastRow <= cr + 1e-9) {
        removedBefore.push(lastRow)
        nF -= 1
        lastRow = nF >= 0 ? sr + nF * mult : null
      }
      let m = 0
      let firstOff: number | null = sr
      const removedAfter: number[] = []
      while (firstOff !== null && firstOff <= cr + 1e-9 && firstOff <= nextRows + 1e-9) {
        removedAfter.push(firstOff)
        m += 1
        firstOff = sr + m * mult
      }
      if (firstOff !== null && firstOff > nextRows + 1e-9) firstOff = null
      const tail = lastRow !== null ? (secRows - lastRow) * pitch : null
      const head = firstOff !== null ? firstOff * pitch : null
      out.push({
        joint: i + 1,
        atRow: cum,
        variation: vi + 1,
        removedBefore,
        removedAfter,
        acrossMm: tail !== null && head !== null ? tail + head : null,
      })
    })
  }
  return out
}

/** Whole rows in the belt length. */
export function totalRows(b: TdBelt): number {
  return Math.round(b.lengthMm / pitchMm(b))
}

/** True when the length is a whole number of rows. */
export function isPitchIncrement(b: TdBelt): boolean {
  const r = b.lengthMm / pitchMm(b)
  return Math.abs(r - Math.round(r)) < 1e-3
}
