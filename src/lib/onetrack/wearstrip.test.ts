import { describe, it, expect } from 'vitest'
import {
  CS_TO_SOURCE,
  ceilTolerant,
  emptyWorksheet,
  formatRun,
  missingForWearstrip,
  sectionsPerRailRule,
  wearstripRow,
  wearstripWarnings,
  type WearstripWorksheet,
} from './wearstrip'
import { toInches } from '../measurement'

const ws = (o: Partial<WearstripWorksheet>): WearstripWorksheet => ({ ...emptyWorksheet(), ...o })

const flat = (o: Partial<WearstripWorksheet> = {}) =>
  ws({
    use: 'Carryway',
    profileId: 'onetrack-flat',
    quoteAs: 'onetrackFlat',
    color: 'Natural',
    rails: 4,
    lengthsIn: [282],
    ...o,
  })

describe('section count (round up per rail)', () => {
  it('B1: exactly one section', () => {
    expect(sectionsPerRailRule([120], 120)).toBe(1)
  })

  it('B2: float noise does not cost a section', () => {
    expect(sectionsPerRailRule([120.0000001], 120)).toBe(1)
    expect(ceilTolerant(240 / 120)).toBe(2)
  })

  it('B3: an inch over is another section', () => {
    expect(sectionsPerRailRule([121], 120)).toBe(2)
  })

  it('B4: 4 rails × 23 ft 6 in = 12 sections', () => {
    expect(sectionsPerRailRule([282, 282, 282, 282], 120)).toBe(12)
  })

  it('B7: snap-on, 3 rails × 200 ft, 500 ft lengths = 3', () => {
    expect(sectionsPerRailRule([2400, 2400, 2400], 6000)).toBe(3)
  })

  it('B8: 3000 mm rails are 118.11 in, one section each', () => {
    const l = toInches(3000, 'mm')
    expect(l).toBeCloseTo(118.11, 2)
    expect(sectionsPerRailRule([l, l], 120)).toBe(2)
  })
})

describe('wearstripRow', () => {
  it('B4: a OneTrack flat line with its reason', () => {
    expect(wearstripRow(flat(), 'in')).toEqual({
      partNumber: 'B6XX86IXXWMV-00',
      description: 'OneTrack UHMW-PE flat wearstrip, natural',
      qty: 12,
      uom: '10 ft section',
      notes: 'Carryway. 4 rails, 23 ft 6 in each, 94 ft total',
      reason: '4 rails × 23 ft 6 in → 3 sections per rail = 12 sections (10 ft each).',
    })
  })

  it('rails of different lengths are each rounded up on their own', () => {
    const row = wearstripRow(flat({ rails: 3, sameLength: false, lengthsIn: [100, 130, 250] }), 'in')
    // 1 + 2 + 3, not ceil(480 / 120) = 4.
    expect(row?.qty).toBe(6)
    expect(row?.reason).toBe('3 rails, 40 ft total → 6 sections (10 ft each), rounded up per rail.')
    expect(row?.notes).toBe('Carryway. 3 rails of different lengths, 40 ft total')
  })

  it('B7: snap-on is counted in 500 ft lengths', () => {
    const row = wearstripRow(
      ws({ use: 'Hold-down', profileId: 'radius-snap-on', quoteAs: 'radiusSnapOn', frameIn: '3/8', rails: 3, lengthsIn: [2400] }),
      'in',
    )
    expect(row?.partNumber).toBe('B6XX52IXXZMV-00')
    expect(row?.qty).toBe(3)
    expect(row?.uom).toBe('500 ft length')
    expect(row?.reason).toBe('3 rails × 200 ft → 1 length per rail = 3 lengths (500 ft each).')
  })

  it('B12: match installed clip-on is footage for CS to source', () => {
    const row = wearstripRow(
      ws({
        use: 'Carryway',
        profileId: 'clip-on',
        quoteAs: 'match',
        dims: { W: 1.25, H: 0.75, RW: 1, RT: 0.25, O: 0.875 },
        rails: 1,
        lengthsIn: [94 * 12],
      }),
      'in',
    )
    expect(row).toEqual({
      partNumber: CS_TO_SOURCE,
      description: 'Match existing clip-on, W 1.25 × H 0.75, RW 1 × RT 0.25, O 0.875 in',
      qty: 94,
      uom: 'ft',
      notes: 'Carryway. 1 rail, 94 ft each, 94 ft total. Field identification only. See photos.',
      reason: '94 ft of rail, rounded up to 94 ft.',
    })
  })

  it('match rounds part feet up', () => {
    const row = wearstripRow(ws({ use: 'Carryway', profileId: 'standard-flat', quoteAs: 'match', rails: 2, lengthsIn: [121] }), 'in')
    expect(row?.qty).toBe(21) // 242 in = 20.17 ft
  })

  it('reads in metres when the BOM is in mm', () => {
    const row = wearstripRow(flat({ rails: 2, lengthsIn: [toInches(3000, 'mm')] }), 'mm')
    expect(row?.notes).toBe('Carryway. 2 rails, 3 m each, 6 m total')
    expect(row?.qty).toBe(2)
  })

  it('"Other" carries the rep\'s description', () => {
    const row = wearstripRow(
      ws({ use: 'Side guide', profileId: 'other', otherDescription: 'T-slot', quoteAs: 'match', dims: { W: 1, H: 2 }, rails: 1, lengthsIn: [120] }),
      'in',
    )
    expect(row?.description).toBe('Match existing profile (T-slot), W 1 × H 2 in')
  })
})

describe('missingForWearstrip', () => {
  it('B13: a flat line with no color is not a BOM line', () => {
    const w = flat({ color: null })
    expect(missingForWearstrip(w)).toEqual(['Color'])
    expect(wearstripRow(w, 'in')).toBeNull()
  })

  it('lists everything on an empty worksheet', () => {
    expect(missingForWearstrip(emptyWorksheet())).toEqual([
      'Use',
      'Installed profile',
      'What to quote',
      'Number of rails',
    ])
  })

  it('asks for frame thickness on radius items', () => {
    expect(missingForWearstrip(ws({ use: 'Hold-down', profileId: 'radius-angled', quoteAs: 'radiusAngled', rails: 1, lengthsIn: [10] }))).toEqual([
      'Frame thickness',
    ])
  })

  it('names each rail missing a length', () => {
    expect(missingForWearstrip(flat({ rails: 3, sameLength: false, lengthsIn: [100, null, 0] }))).toEqual([
      'Rail 2 length',
      'Rail 3 length',
    ])
  })

  it('treats 0 as a length that was entered but is not usable, never as blank-equals-fine', () => {
    expect(missingForWearstrip(flat({ lengthsIn: [0] }))).toEqual(['Rail length'])
  })
})

describe('wearstripWarnings', () => {
  it('warns when the measured size is not the OneTrack size', () => {
    expect(wearstripWarnings(flat({ dims: { W: 1.25, H: 1.5 } }), 'in')).toEqual([
      "Measured 1.25 in wide; OneTrack flat is 1 in. Check the frame fits, or quote 'Match the installed profile'.",
    ])
  })

  it('allows a sixteenth of tape error', () => {
    expect(wearstripWarnings(flat({ dims: { W: 1 + 1 / 16, H: 1.5 - 1 / 16 } }), 'in')).toEqual([])
  })

  it('warns when a match has no W and H', () => {
    const w = ws({ use: 'Carryway', profileId: 'clip-on', quoteAs: 'match', rails: 1, lengthsIn: [120] })
    expect(wearstripWarnings(w, 'in')[0]).toMatch(/^CS can't source a match without/)
  })

  it('checks a rail over 100 ft for a typo', () => {
    expect(wearstripWarnings(flat({ lengthsIn: [240 * 12] }), 'in')).toEqual(['One rail is 240 ft. Is that right?'])
  })
})

describe('formatRun', () => {
  it('reads like a tape', () => {
    expect(formatRun(282, 'in')).toBe('23 ft 6 in')
    expect(formatRun(240, 'in')).toBe('20 ft')
    expect(formatRun(8.5, 'in')).toBe('8 1/2 in')
    expect(formatRun(23 * 12 + 11.99, 'in')).toBe('24 ft')
  })
})
