// Reading and writing tape-measure numbers.
//
// A tape measure is marked in sixteenths, not decimals. An account manager
// standing at a conveyor reads "twenty-five and eleven sixteenths" off the
// blade, so the app has to accept that literally -- typing 25.6875 is a
// conversion the user should never have to do in their head, and getting it
// wrong quietly poisons the elongation number.
//
// Canonical unit inside the app is the inch. Everything the user sees is
// converted at the edge.

export const MM_PER_IN = 25.4

/** What a tape measure can actually resolve: one sixteenth of an inch. */
export const TAPE_RESOLUTION_IN = 1 / 16

export type Unit = 'in' | 'mm'

/**
 * Parse anything a rep might type for a length, in the unit currently
 * selected. Accepts decimals ("25.6875"), mixed fractions ("25 11/16",
 * "25-11/16"), bare fractions ("11/16"), feet and inches ("2' 1 5/8") and
 * trailing unit marks (`25 11/16"`, "652 mm").
 *
 * Returns null for anything it can't read, so a half-typed value never
 * silently becomes a zero.
 */
export function parseMeasurement(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null

  let s = raw.trim().toLowerCase()
  if (!s) return null

  // Normalise smart quotes to plain ones before anything keys off them.
  s = s.replace(/[‘’ʼ`]/g, "'").replace(/[“”″]/g, '"')
  // Drop unit words/marks. The caller already knows which unit it asked for.
  s = s.replace(/"|\binch(?:es)?\b|\bin\b|\bmm\b|\bmillimet(?:er|re)s?\b/g, ' ')

  let total = 0
  const feet = s.match(/(\d+(?:\.\d+)?)\s*(?:'|ft|feet|foot)/)
  if (feet) {
    total += Number.parseFloat(feet[1]) * 12
    s = s.replace(feet[0], ' ')
  }

  // "25-11/16" is the same as "25 11/16" on a shop floor.
  s = s.replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
  if (!s) return feet ? total : null

  const mixed = s.match(/^(?:(\d+(?:\.\d+)?) )?(\d+) ?\/ ?(\d+)$/)
  if (mixed) {
    const den = Number.parseInt(mixed[3], 10)
    if (!den) return null
    const whole = mixed[1] ? Number.parseFloat(mixed[1]) : 0
    return total + whole + Number.parseInt(mixed[2], 10) / den
  }

  if (/^\d*\.?\d+$/.test(s)) return total + Number.parseFloat(s)

  return null
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/**
 * Render inches the way the blade is marked: 25.6875 -> "25 11/16".
 * Reduced (0.5 -> "1/2", never "8/16") and rounded to the nearest 1/`den`.
 */
export function toFractionalInches(value: number, den = 16): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value < 0 ? '-' : ''
  const v = Math.abs(value)

  let whole = Math.floor(v)
  let num = Math.round((v - whole) * den)
  if (num === den) {
    whole += 1
    num = 0
  }
  if (num === 0) return `${sign}${whole}`

  const g = gcd(num, den)
  const frac = `${num / g}/${den / g}`
  return whole === 0 ? `${sign}${frac}` : `${sign}${whole} ${frac}`
}

/** Feet-and-inches for spans long enough that inches alone stop being useful. */
export function toFeetAndInches(valueIn: number): string {
  if (!Number.isFinite(valueIn)) return '—'
  if (Math.abs(valueIn) < 12) return `${toFractionalInches(valueIn)} in`
  const sign = valueIn < 0 ? '-' : ''
  const v = Math.abs(valueIn)
  const ft = Math.floor(v / 12)
  const rest = v - ft * 12
  // Rounding the remainder up to 12 would print `4' 12"`.
  if (Math.round(rest * 16) === 12 * 16) return `${sign}${ft + 1}' 0"`
  return `${sign}${ft}' ${toFractionalInches(rest)}"`
}

export function toInches(value: number, from: Unit): number {
  return from === 'in' ? value : value / MM_PER_IN
}

export function fromInches(valueIn: number, to: Unit): number {
  return to === 'in' ? valueIn : valueIn * MM_PER_IN
}

/** Sensible decimal places for a unit: thousandths of an inch, tenths of a mm. */
export function decimalsFor(unit: Unit): number {
  return unit === 'in' ? 3 : 1
}

/** A length in the display unit, with its unit label. */
export function formatLength(valueIn: number, unit: Unit): string {
  if (!Number.isFinite(valueIn)) return '—'
  return `${fromInches(valueIn, unit).toFixed(decimalsFor(unit))} ${unit}`
}

/**
 * The same length said the way the user will actually read it off their tool:
 * fractions on an inch tape, plain decimals in mm.
 */
export function formatForTape(valueIn: number, unit: Unit): string {
  if (!Number.isFinite(valueIn)) return '—'
  return unit === 'in'
    ? `${toFractionalInches(valueIn)} in`
    : `${(valueIn * MM_PER_IN).toFixed(0)} mm`
}

/**
 * Sixteenths reference chart, for anyone converting a blade mark by hand.
 * Fifteen entries, not sixteen: 16/16 is just "1 inch" and never appears as a
 * mark to read.
 */
export const SIXTEENTHS: { label: string; decimal: number }[] = Array.from(
  { length: 15 },
  (_, i) => {
    const num = i + 1
    const g = gcd(num, 16)
    return { label: `${num / g}/${16 / g}`, decimal: num / 16 }
  },
)
