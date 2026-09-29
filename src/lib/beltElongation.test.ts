import { describe, it, expect } from 'vitest'
import {
  computeElongation,
  verdictFor,
  readingsDisagree,
  recommendedPitchCount,
  spanAtPct,
  growthOverBeltIn,
  pitchesGained,
  summarizeResult,
  BREAK_IN_PCT,
  DEFAULT_REPLACE_LIMIT_PCT,
} from './beltElongation'
import { BELT_SERIES, seriesPitchIn, DEFAULT_SERIES, seriesLabel } from '../schema/beltSeries'

describe('computeElongation', () => {
  it('computes the textbook case', () => {
    // 10 pitches of Series 900: nominal 10.7 in, measured 11.0 in.
    const r = computeElongation({ nominalPitchIn: 1.07, pitchCount: 10, readingsIn: [11.0] })
    expect(r).not.toBeNull()
    expect(r!.nominalSpanIn).toBeCloseTo(10.7, 9)
    expect(r!.measuredSpanIn).toBe(11.0)
    expect(r!.elongationPct).toBeCloseTo(2.8037, 3)
    expect(r!.actualPitchIn).toBeCloseTo(1.1, 9)
    expect(r!.readingCount).toBe(1)
    expect(r!.spreadIn).toBe(0)
  })

  it('averages multiple readings', () => {
    const r = computeElongation({
      nominalPitchIn: 1,
      pitchCount: 10,
      readingsIn: [10.1, 10.3],
    })!
    expect(r.measuredSpanIn).toBeCloseTo(10.2, 9)
    expect(r.elongationPct).toBeCloseTo(2, 9)
    expect(r.readingCount).toBe(2)
    expect(r.spreadIn).toBeCloseTo(0.2, 9)
  })

  it('ignores blank and non-positive readings instead of averaging them in', () => {
    const r = computeElongation({
      nominalPitchIn: 1,
      pitchCount: 10,
      readingsIn: [10.2, Number.NaN, 0, -5],
    })!
    expect(r.readingCount).toBe(1)
    expect(r.measuredSpanIn).toBe(10.2)
  })

  // A zero here would render as "0.00% — normal", a confident answer to a
  // question the user hasn't finished asking.
  it('returns null, not zero, when there is nothing to compute', () => {
    expect(computeElongation({ nominalPitchIn: 1.07, pitchCount: 10, readingsIn: [] })).toBeNull()
    expect(computeElongation({ nominalPitchIn: 0, pitchCount: 10, readingsIn: [10] })).toBeNull()
    expect(computeElongation({ nominalPitchIn: 1, pitchCount: 0, readingsIn: [10] })).toBeNull()
  })

  it('reports the tape precision as a percentage of the span measured', () => {
    // One sixteenth over 10 in is 0.625%; over 40 in it is 0.156%.
    expect(
      computeElongation({ nominalPitchIn: 1, pitchCount: 10, readingsIn: [10] })!.precisionPct,
    ).toBeCloseTo(0.625, 6)
    expect(
      computeElongation({ nominalPitchIn: 1, pitchCount: 40, readingsIn: [40] })!.precisionPct,
    ).toBeCloseTo(0.15625, 6)
  })
})

describe('verdictFor', () => {
  it('flags a negative result as a measuring mistake, not a shrinking belt', () => {
    expect(verdictFor(-0.4, 3).level).toBe('short')
  })

  it('calls break-in growth normal', () => {
    expect(verdictFor(0, 3).level).toBe('normal')
    expect(verdictFor(0.7, 3).level).toBe('normal')
    expect(verdictFor(BREAK_IN_PCT, 3).level).toBe('normal')
  })

  it('warns between break-in and the limit', () => {
    expect(verdictFor(1.01, 3).level).toBe('watch')
    expect(verdictFor(2.99, 3).level).toBe('watch')
  })

  it('is inclusive at the limit — "replace at 3%" means 3% counts', () => {
    expect(verdictFor(3, 3).level).toBe('replace')
    expect(verdictFor(9, 3).level).toBe('replace')
  })

  // A user can type a limit below the break-in band. The replacement check
  // runs first so the stricter of the two always wins.
  it('respects a limit tighter than break-in growth', () => {
    expect(verdictFor(0.8, 0.5).level).toBe('replace')
  })

  it('falls back to the default limit when the field is empty or nonsense', () => {
    expect(verdictFor(2.5, 0).level).toBe(verdictFor(2.5, DEFAULT_REPLACE_LIMIT_PCT).level)
    expect(verdictFor(3.5, Number.NaN).level).toBe('replace')
  })

  it('always gives the user something to do about it', () => {
    for (const pct of [-1, 0.5, 2, 5]) {
      const v = verdictFor(pct, 3)
      expect(v.headline.length).toBeGreaterThan(0)
      expect(v.detail.length).toBeGreaterThan(0)
    }
  })
})

describe('readingsDisagree', () => {
  const base = { nominalPitchIn: 1, pitchCount: 20 }

  it('says nothing about a single reading', () => {
    expect(readingsDisagree(computeElongation({ ...base, readingsIn: [20.2] })!)).toBe(false)
  })

  it('tolerates a sixteenth or so between readings', () => {
    expect(readingsDisagree(computeElongation({ ...base, readingsIn: [20.2, 20.25] })!)).toBe(false)
  })

  // Half an inch apart over twenty pitches is a miscounted pitch, not a
  // stretched belt, and saying so saves a bad quote.
  it('catches readings that can only mean a miscount', () => {
    expect(readingsDisagree(computeElongation({ ...base, readingsIn: [20.2, 21.2] })!)).toBe(true)
  })
})

describe('recommendedPitchCount', () => {
  // The practical advice this encodes: measure about two feet of belt,
  // whatever the series.
  it('recommends a span long enough to swallow a sixteenth of tape error', () => {
    expect(recommendedPitchCount(1.07)).toBe(24)
    expect(recommendedPitchCount(2)).toBe(13)
    expect(recommendedPitchCount(0.5)).toBe(50)
  })

  it('scales with the accuracy asked for', () => {
    expect(recommendedPitchCount(1, 0.5)).toBe(13)
    expect(recommendedPitchCount(1, 0.25)).toBe(25)
  })

  it('returns 0 rather than Infinity for a missing pitch', () => {
    expect(recommendedPitchCount(0)).toBe(0)
    expect(recommendedPitchCount(1, 0)).toBe(0)
  })

  it('keeps every listed series inside the accuracy target', () => {
    for (const s of BELT_SERIES) {
      const n = recommendedPitchCount(s.pitchIn)
      const errorPct = (100 / 16) / (n * s.pitchIn)
      expect(errorPct, `series ${s.series}`).toBeLessThanOrEqual(0.25)
    }
  })
})

describe('what the tape should read', () => {
  it('projects the span at a given elongation', () => {
    expect(spanAtPct(10.7, 0)).toBeCloseTo(10.7, 9)
    expect(spanAtPct(10.7, 3)).toBeCloseTo(11.021, 9)
  })

  it('converts elongation into belt growth', () => {
    expect(growthOverBeltIn(1200, 2)).toBeCloseTo(24, 9)
  })

  it('converts growth into whole pitches the take-up has to absorb', () => {
    expect(pitchesGained(1200, 2, 1.07)).toBeCloseTo(22.43, 2)
    expect(pitchesGained(0, 2, 1.07)).toBeNull()
    expect(pitchesGained(1200, 2, 0)).toBeNull()
  })
})

describe('summarizeResult', () => {
  const result = computeElongation({
    nominalPitchIn: 1.07,
    pitchCount: 24,
    readingsIn: [26.0, 26.0625],
  })!

  it('restates the inputs, not just the answer', () => {
    const text = summarizeResult({
      result,
      seriesLabel: 'Series 900',
      pitchCount: 24,
      limitPct: 3,
      unit: 'in',
    })
    expect(text).toContain('Series 900')
    expect(text).toContain('24 pitches')
    expect(text).toContain('3% replacement limit')
    expect(text).toContain('average of 2 readings')
    // Must be honest about how it was measured.
    expect(text).toContain('not an elongation ruler')
  })

  it('mentions belt growth only when a belt length was given', () => {
    const without = summarizeResult({
      result,
      seriesLabel: 'Series 900',
      pitchCount: 24,
      limitPct: 3,
      unit: 'in',
    })
    expect(without).not.toContain('of growth')

    const with_ = summarizeResult({
      result,
      seriesLabel: 'Series 900',
      pitchCount: 24,
      limitPct: 3,
      unit: 'in',
      totalBeltLengthIn: 1200,
    })
    expect(with_).toContain('of growth')
  })

  it('speaks in the unit the user was working in', () => {
    const mm = summarizeResult({
      result,
      seriesLabel: 'Series 900',
      pitchCount: 24,
      limitPct: 3,
      unit: 'mm',
    })
    expect(mm).toContain('mm')
    expect(mm).not.toContain(' in,')
  })
})

describe('BELT_SERIES', () => {
  it('has no duplicate series numbers', () => {
    const seen = new Set(BELT_SERIES.map((s) => s.series))
    expect(seen.size).toBe(BELT_SERIES.length)
  })

  it('gives every series a usable positive pitch', () => {
    for (const s of BELT_SERIES) {
      expect(s.pitchIn, `series ${s.series}`).toBeGreaterThan(0)
    }
  })

  it('resolves the default the picker opens on', () => {
    expect(seriesPitchIn(DEFAULT_SERIES)).toBe(1.07)
    expect(seriesPitchIn('not-a-series')).toBeUndefined()
  })

  it('labels a series with its pitch, so the picker is self-explaining', () => {
    expect(seriesLabel({ series: '900', pitchIn: 1.07 })).toBe('Series 900 — 1.07 in pitch')
  })
})
