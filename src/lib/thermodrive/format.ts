// Display helpers for the configurator: the engine is in mm, people work in
// inches or mm.
import { parseMeasurement } from '../measurement'
import { formatLen, trimNumber, type UnitSystem } from '../tdBulkDensity/units'
import { IN } from './data'

/** A length in mm, shown in the chosen system ("7.824 in" / "198.7 mm"). */
export function fmtMm(mm: number, system: UnitSystem): string {
  return formatLen(mm / IN, system)
}

/** A belt length: also in feet (or m), which is how belts are ordered. */
export function fmtBeltLen(mm: number, system: UnitSystem): string {
  if (system === 'metric') return `${trimNumber(mm / 1000, 3)} m`
  return `${trimNumber(mm / IN / 12, 2)} ft (${trimNumber(mm / IN, 2)} in)`
}

/** Field text for a length in mm. */
export function mmText(mm: number, system: UnitSystem): string {
  if (!(mm > 0)) return ''
  return system === 'metric' ? trimNumber(mm, 1) : trimNumber(mm / IN, 3)
}

/** Parse field text (fractions and feet allowed in inches) to mm, or null. */
export function parseMm(text: string, system: UnitSystem): number | null {
  const v = parseMeasurement(text)
  if (v === null || !Number.isFinite(v)) return null
  return system === 'metric' ? v : v * IN
}
