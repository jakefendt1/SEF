import { describe, expect, it } from 'vitest'
import { SIDEWALL_FOOTPRINT_IN } from '../tdBulkDensity/data/sidewalls'
import { freshBelt, newVar, sidewallFootprint, withSeries, withStyle, type TdBelt } from './belt'
import { IN, PITCH_MM, SSW_FP } from './data'
import { divisorSuggestions, finalSpacingInfo, jointRemovals, laceWidthValid, repairFlights } from './geometry'
import { spliceFixes, validateBelt, validateRepair } from './validate'

const P = PITCH_MM['8050']
const belt = (patch: Partial<TdBelt> = {}): TdBelt => ({
  ...freshBelt('8050'),
  widthMm: 24 * IN,
  lengthMm: 100 * P,
  flightSpacingMm: 4 * P,
  vars: [{ ...newVar(2), heightMm: 3 * IN }],
  ...patch,
})

describe('ThermoDrive belt rules', () => {
  it('flight-to-sidewall gap: 0.19 in fails, 0.21 in passes', () => {
    const fp = sidewallFootprint({ series: '8050', sidewallHeightIn: 2, material: 'POLYURETHANE' }).fp
    const at = (gapIn: number) =>
      validateBelt(belt({ sidewallsOn: true, sidewallHeightIn: 2, sidewallInsetMm: 10, vars: [{ ...newVar(2), heightMm: 76.2, indentLMm: 10 + fp + gapIn * IN, indentRMm: 10 + fp + gapIn * IN }] })).map((w) => w.id)
    expect(at(0.19)).toContain('sidewall-gap-0')
    expect(at(0.21)).not.toContain('sidewall-gap-0')
  })

  it('a length or spacing off the rows is an error that offers the rows either side', () => {
    const w = validateBelt(belt({ lengthMm: 100.5 * P, flightSpacingMm: 8 * IN }))
    const len = w.find((x) => x.id === 'length-rows')!
    expect(len.severity).toBe('error')
    expect(len.fix).toMatch(/\(100 rows\) or .*\(101 rows\)/)
    expect(w.find((x) => x.id === 'spacing-rows')!.fix).toBe('Use 7.824 in (4 rows) or 9.78 in (5 rows).')
  })

  it('a flight removed at the splice comes with fixes that each keep it', () => {
    const b = belt({ lengthMm: 98 * P })
    expect(finalSpacingInfo(b, b.vars[0]).removed).not.toBeNull()
    const fixes = spliceFixes(b, 0, 'imperial')
    expect(fixes.length).toBeGreaterThan(0)
    for (const f of fixes) {
      const fixed = 'lengthMm' in f.patch ? { ...b, lengthMm: f.patch.lengthMm } : { ...b, vars: [{ ...b.vars[0], startRow: f.patch.startRow }] }
      expect(finalSpacingInfo(fixed, fixed.vars[0]).removed).toBeNull()
    }
    expect(validateBelt(b).find((w) => w.id === 'splice-0')!.fix).toMatch(/^To keep it: /)
  })

  it('over the max section length says to section it; over 6 in has no standard', () => {
    expect(validateBelt(belt({ lengthMm: 400 * P })).map((w) => w.id)).toContain('section-max')
    expect(validateBelt(belt({ vars: [{ ...newVar(2), heightMm: 7 * IN }] })).map((w) => w.id)).toContain('section-none')
  })

  it('ThermoLace: width must be a 1/2 in multiple', () => {
    expect(laceWidthValid(24 * IN)).toBe(true)
    expect(laceWidthValid(24.25 * IN)).toBe(false)
    expect(validateRepair(belt({ widthMm: 24.25 * IN }))[0].fix).toBe('A 24 in or 24.5 in belt takes the lace centered.')
  })

  it('repair: flights within 1 row of the lace are removed', () => {
    const b = belt()
    const r = repairFlights(b, 18 * P, 2 * P, b.vars[0])
    expect(r.removed.length).toBeGreaterThan(0)
    for (const f of r.kept) expect(Math.abs(f - 9 * P - P / 2)).toBeGreaterThan(P)
  })

  it('section joints: flights within 1 row either side are removed', () => {
    const b = belt({ flightSpacingMm: 2 * P })
    const j = jointRemovals(b, [51, 49])
    expect(j).toHaveLength(1)
    // Flights at rows 2, 4, ... 50: row 50 is 1 row from the cut at 51; the next section's row 2 is clear.
    expect(j[0].removedBefore).toEqual([50])
    expect(j[0].removedAfter).toEqual([])
    expect(j[0].acrossMm).toBeCloseTo((51 - 48 + 2) * P, 9)
  })

  it('divisor suggestions search outward from the asked count', () => {
    expect(divisorSuggestions(100, 3, 4)).toEqual([2, 4, 1, 5])
  })

  it('series and style changes keep only valid product codes and offered sidewall heights', () => {
    const b = withSeries({ ...belt(), sidewallHeightIn: 6 }, '8140')
    expect(b.style in { 'EDT E DUAL LUG (11.5 MM)': 1 }).toBe(true)
    expect(b.sidewallHeightIn).toBe(1)
    expect(b.vars[0].startRow).toBe(2.5)
    expect(withStyle(belt(), 'FLAT TOP E (7 MM)').material).toBe('POLYURETHANE')
    expect(withSeries(belt({ vgOn: true }), '8050').vgOn).toBe(false)
  })

  it("his sidewall footprints are the manual's (one source of truth, two tables)", () => {
    expect(SSW_FP[25].fp / IN).toBeCloseTo(SIDEWALL_FOOTPRINT_IN['25mm'], 2)
    expect(SSW_FP[40].fp / IN).toBeCloseTo(SIDEWALL_FOOTPRINT_IN['40mm'], 2)
    expect(SSW_FP[50].fp / IN).toBeCloseTo(SIDEWALL_FOOTPRINT_IN['50mm'], 2)
  })
})
