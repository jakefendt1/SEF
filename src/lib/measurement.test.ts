import { describe, it, expect } from 'vitest'
import {
  parseMeasurement,
  toFractionalInches,
  toFeetAndInches,
  toInches,
  fromInches,
  formatLength,
  formatForTape,
  SIXTEENTHS,
  MM_PER_IN,
} from './measurement'

describe('parseMeasurement', () => {
  it('reads plain decimals', () => {
    expect(parseMeasurement('25.6875')).toBeCloseTo(25.6875, 6)
    expect(parseMeasurement('  652  ')).toBe(652)
    expect(parseMeasurement('.5')).toBe(0.5)
  })

  // The whole point: a tape measure is marked in sixteenths, so this is what
  // the user will actually type.
  it('reads mixed fractions the way a tape is marked', () => {
    expect(parseMeasurement('25 11/16')).toBeCloseTo(25.6875, 6)
    expect(parseMeasurement('25-11/16')).toBeCloseTo(25.6875, 6)
    expect(parseMeasurement('25 11 / 16')).toBeCloseTo(25.6875, 6)
    expect(parseMeasurement('11/16')).toBeCloseTo(0.6875, 6)
  })

  it('reads feet and inches', () => {
    expect(parseMeasurement("2' 1 5/8")).toBeCloseTo(25.625, 6)
    expect(parseMeasurement('2 ft')).toBe(24)
    expect(parseMeasurement("3'")).toBe(36)
  })

  it('ignores unit marks the user leaves on', () => {
    expect(parseMeasurement('25 11/16"')).toBeCloseTo(25.6875, 6)
    expect(parseMeasurement('25.5 in')).toBe(25.5)
    expect(parseMeasurement('652 mm')).toBe(652)
    expect(parseMeasurement('25 inches')).toBe(25)
  })

  it('handles smart quotes pasted from elsewhere', () => {
    expect(parseMeasurement('25 11/16”')).toBeCloseTo(25.6875, 6)
    expect(parseMeasurement('2’ 1')).toBe(25)
  })

  // A half-typed or nonsense value must not become a zero -- a zero reading
  // would silently compute as -100% elongation.
  it('returns null rather than guessing', () => {
    expect(parseMeasurement('')).toBeNull()
    expect(parseMeasurement('   ')).toBeNull()
    expect(parseMeasurement('abc')).toBeNull()
    expect(parseMeasurement('25 11/')).toBeNull()
    expect(parseMeasurement('25/0')).toBeNull()
    expect(parseMeasurement(null)).toBeNull()
    expect(parseMeasurement(undefined)).toBeNull()
    expect(parseMeasurement(Number.NaN)).toBeNull()
  })

  it('passes numbers straight through', () => {
    expect(parseMeasurement(25.5)).toBe(25.5)
  })
})

describe('toFractionalInches', () => {
  it('reduces to the way a blade is labelled', () => {
    expect(toFractionalInches(25.5)).toBe('25 1/2')
    expect(toFractionalInches(25.25)).toBe('25 1/4')
    expect(toFractionalInches(25.6875)).toBe('25 11/16')
    expect(toFractionalInches(0.6875)).toBe('11/16')
  })

  it('drops the fraction when it rounds away', () => {
    expect(toFractionalInches(25)).toBe('25')
    expect(toFractionalInches(25.001)).toBe('25')
  })

  // 25.99 must not print as "25 16/16".
  it('carries into the whole number', () => {
    expect(toFractionalInches(25.99)).toBe('26')
  })

  it('handles negatives and non-numbers', () => {
    expect(toFractionalInches(-1.5)).toBe('-1 1/2')
    expect(toFractionalInches(Number.NaN)).toBe('—')
  })
})

describe('toFeetAndInches', () => {
  it('stays in inches below a foot', () => {
    expect(toFeetAndInches(11.5)).toBe('11 1/2 in')
  })

  it('splits longer spans', () => {
    expect(toFeetAndInches(25.625)).toBe("2' 1 5/8\"")
    expect(toFeetAndInches(24)).toBe('2\' 0"')
  })

  // Rounding the remainder must not produce `4' 12"`.
  it('never prints twelve inches of remainder', () => {
    expect(toFeetAndInches(59.999)).toBe('5\' 0"')
  })
})

describe('unit conversion', () => {
  it('round-trips', () => {
    expect(toInches(25.4, 'mm')).toBeCloseTo(1, 9)
    expect(fromInches(1, 'mm')).toBeCloseTo(MM_PER_IN, 9)
    expect(toInches(5, 'in')).toBe(5)
    expect(fromInches(5, 'in')).toBe(5)
  })

  it('formats to the precision each unit deserves', () => {
    expect(formatLength(25.6875, 'in')).toBe('25.688 in')
    expect(formatLength(1, 'mm')).toBe('25.4 mm')
    expect(formatLength(Number.NaN, 'in')).toBe('—')
  })

  it('formats for the tool in the user\'s hand', () => {
    expect(formatForTape(25.6875, 'in')).toBe('25 11/16 in')
    expect(formatForTape(1, 'mm')).toBe('25 mm')
  })
})

describe('SIXTEENTHS reference', () => {
  it('lists every readable sixteenth, reduced', () => {
    expect(SIXTEENTHS).toHaveLength(15)
    expect(SIXTEENTHS[0]).toEqual({ label: '1/16', decimal: 0.0625 })
    expect(SIXTEENTHS[7]).toEqual({ label: '1/2', decimal: 0.5 })
    expect(SIXTEENTHS[14]).toEqual({ label: '15/16', decimal: 0.9375 })
  })

  // Every label in the chart must parse back to the decimal beside it, or the
  // reference and the input would disagree.
  it('round-trips through the parser', () => {
    for (const { label, decimal } of SIXTEENTHS) {
      expect(parseMeasurement(label)).toBeCloseTo(decimal, 9)
    }
  })
})
