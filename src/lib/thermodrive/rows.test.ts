import { describe, it, expect } from 'vitest'
import { CONFIG, BELT_SERIES, PITCH_MM, fromCalculatorSeries } from './data'
import { pitchIn, snapToRows, wholeRows } from './rows'
import { SIDEWALL_OPTIONS } from '../tdBulkDensity/data/sidewalls'

describe('ThermoDrive rows (ported from Patrick v0.65)', () => {
  it('P1: pitches match his table', () => {
    expect(pitchIn('8050')).toBeCloseTo(1.956, 6)
    expect(pitchIn('8140')).toBeCloseTo(1.558, 6)
    expect(pitchIn('8026')).toBe(pitchIn('8126'))
  })

  it('P2: whole rows only when a length lands on a row', () => {
    expect(wholeRows('8050', 1.956 * 4)).toBe(4)
    expect(wholeRows('8050', 8)).toBeNull()
  })

  it('P3: an off-row spacing offers the row either side', () => {
    const s = snapToRows('8050', 8)
    expect(s.map((x) => x.rows)).toEqual([4, 5])
    expect(s[0].lengthIn).toBeCloseTo(7.824, 3)
    expect(s[1].lengthIn).toBeCloseTo(9.78, 3)
  })

  it('P4: an on-row spacing offers just itself; never less than 1 row', () => {
    expect(snapToRows('8140', 1.558 * 3).map((x) => x.rows)).toEqual([3])
    expect(snapToRows('8026', 0.4).map((x) => x.rows)).toEqual([1, 2])
  })

  it('P5: every series has product codes and a pitch', () => {
    for (const s of BELT_SERIES) {
      expect(Object.keys(CONFIG[s]).length).toBeGreaterThan(0)
      expect(PITCH_MM[s]).toBeGreaterThan(0)
    }
  })

  it('P6: the calculator’s series map onto his', () => {
    expect(fromCalculatorSeries('S8050')).toBe('8050')
    // Both tools must agree which series take sidewalls.
    expect(Object.keys(SIDEWALL_OPTIONS).map((s) => fromCalculatorSeries(s as 'S8050'))).toEqual(
      expect.arrayContaining(['8050', '8140']),
    )
  })
})
