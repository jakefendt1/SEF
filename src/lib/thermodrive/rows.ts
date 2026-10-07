// Flights and belt length land on whole rows: a flight can only sit where a
// row is, so its spacing is a whole number of pitches. The Bulk Density
// calculator accepts any spacing today; this is what it will check against.
import { IN, PITCH_MM, type BeltSeries } from './data'

const EPS = 1e-6

export function pitchIn(series: BeltSeries): number {
  return PITCH_MM[series] / IN
}

/** Whole rows in a length, or null when it doesn't land on a row. */
export function wholeRows(series: BeltSeries, lengthIn: number): number | null {
  const rows = lengthIn / pitchIn(series)
  const r = Math.round(rows)
  return Math.abs(rows - r) < 1e-3 ? r : null
}

export interface RowSnap {
  rows: number
  lengthIn: number
}

/**
 * The buildable spacings either side of a typed one: "use 7.82 in (4 rows) or
 * 9.78 in (5 rows)". One option when the typed value is already on a row.
 * Never offers fewer than 1 row.
 */
export function snapToRows(series: BeltSeries, lengthIn: number): RowSnap[] {
  const p = pitchIn(series)
  const exact = wholeRows(series, lengthIn)
  if (exact !== null && exact >= 1) return [{ rows: exact, lengthIn: exact * p }]
  const lo = Math.max(1, Math.floor(lengthIn / p + EPS))
  const hi = Math.max(lo + 1, Math.ceil(lengthIn / p - EPS))
  const out = [{ rows: lo, lengthIn: lo * p }]
  if (hi !== lo) out.push({ rows: hi, lengthIn: hi * p })
  return out
}
