// The shape of one tape reading as it is typed.
//
// Deliberately two controls, not one text box: whole units in a number field
// and the fraction from a list. An iPad shows the decimal keypad for a numeric
// field, and that keypad has no "/" on it -- so asking someone to type
// "25 11/16" on a plant floor means asking them to convert to 25.6875 in their
// head. The fraction list also removes the other failure: reading 11/16 off
// the blade and typing .11.
import { MM_PER_IN, parseMeasurement, type Unit } from '@/lib/measurement'

export interface TapeReading {
  id: string
  /** Whole units as typed, in the display unit. May itself be a decimal. */
  whole: string
  /** Sixteenths of an inch, 0–15. 0 means "no fraction"; ignored in mm. */
  sixteenths: number
}

let nextId = 0

export function newReading(): TapeReading {
  nextId += 1
  return { id: `r${nextId}`, whole: '', sixteenths: 0 }
}

export function readingIsEmpty(r: TapeReading): boolean {
  return r.whole.trim() === '' && r.sixteenths === 0
}

/** The reading in inches, or null if there's nothing usable in it yet. */
export function readingToInches(r: TapeReading, unit: Unit): number | null {
  const whole = parseMeasurement(r.whole)

  if (unit === 'mm') return whole === null ? null : whole / MM_PER_IN
  if (whole === null && r.sixteenths === 0) return null
  return (whole ?? 0) + r.sixteenths / 16
}

/**
 * Rewrite a reading for a different unit, keeping its value.
 *
 * Coming back to inches leaves the value as a decimal rather than snapping it
 * to the nearest sixteenth: a millimetre reading is finer than the blade, and
 * rounding it would quietly change the answer on a unit toggle.
 */
export function convertReading(r: TapeReading, from: Unit, to: Unit): TapeReading {
  if (from === to) return r
  const inches = readingToInches(r, from)
  if (inches === null) return { ...r, sixteenths: 0 }
  return {
    ...r,
    whole: to === 'mm' ? (inches * MM_PER_IN).toFixed(1) : inches.toFixed(3),
    sixteenths: 0,
  }
}
