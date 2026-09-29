import { describe, it, expect } from 'vitest'
import {
  buildCashflowSeries,
  calculateTCO,
  CLEARED_INPUTS,
  EXAMPLE_INPUTS,
  formatPayback,
  hasEnoughInput,
  PERIODS_PER_YEAR,
} from './calculator'

function allNumbers(obj: unknown, path = '', out: [string, number][] = []): [string, number][] {
  if (typeof obj === 'number') {
    out.push([path, obj])
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      allNumbers(v, path ? `${path}.${k}` : k, out)
    }
  }
  return out
}

describe('calculateTCO', () => {
  // The calculator now opens empty rather than prefilled, so the all-zero
  // case is the *first* thing every user sees -- it must not produce NaN,
  // Infinity, or "-$0".
  it('produces only finite numbers from a completely empty input set', () => {
    const tco = calculateTCO(CLEARED_INPUTS, 5)
    for (const [path, value] of allNumbers(tco)) {
      expect(Number.isFinite(value), `${path} was ${value}`).toBe(true)
    }
  })

  it('reports zero savings and zero payback on empty inputs rather than dividing by zero', () => {
    const tco = calculateTCO(CLEARED_INPUTS, 5)
    expect(tco.metal.total).toBe(0)
    expect(tco.aim.total).toBe(0)
    expect(tco.savings.yearly).toBe(0)
    expect(tco.savings.paybackYears).toBe('0.00')
    expect(tco.savings.roi).toBe('0')
  })

  it('produces only finite numbers for every benefit-year option', () => {
    for (const years of [1, 5, 10]) {
      for (const [path, value] of allNumbers(calculateTCO(CLEARED_INPUTS, years))) {
        expect(Number.isFinite(value), `${path} at ${years}y was ${value}`).toBe(true)
      }
    }
  })

  it('still computes a real result from the example inputs', () => {
    const tco = calculateTCO(EXAMPLE_INPUTS, 5)
    expect(tco.metal.total).toBeGreaterThan(0)
    expect(tco.savings.yearly).not.toBe(0)
    for (const [path, value] of allNumbers(tco)) {
      expect(Number.isFinite(value), `${path} was ${value}`).toBe(true)
    }
  })

  // Every unit string that can reach a PERIODS_PER_YEAR lookup must resolve;
  // an unmapped unit silently yields NaN through the whole result tree.
  it('every unit used by the cleared and example inputs maps to a period', () => {
    for (const inputs of [CLEARED_INPUTS, EXAMPLE_INPUTS]) {
      for (const unit of [
        inputs.outputUnit,
        inputs.maintenanceTimeUnit,
        inputs.maintenanceCostUnit,
        inputs.downtimeUnit,
        inputs.wasteUnit,
        inputs.sanitationTimeUnit,
        inputs.metalOtherCostUnit,
        inputs.aimOtherCostUnit,
      ]) {
        expect(PERIODS_PER_YEAR[unit], `unmapped unit: ${unit}`).toBeGreaterThan(0)
      }
    }
  })
})

describe('hasEnoughInput', () => {
  it('is false for a completely empty input set', () => {
    expect(hasEnoughInput(calculateTCO(CLEARED_INPUTS, 5))).toBe(false)
  })

  it('is true once the investment alone has been entered', () => {
    const tco = calculateTCO({ ...CLEARED_INPUTS, aimGlideInvestment: 89850 }, 5)
    expect(hasEnoughInput(tco)).toBe(true)
  })

  it('is true for the example inputs', () => {
    expect(hasEnoughInput(calculateTCO(EXAMPLE_INPUTS, 5))).toBe(true)
  })
})

describe('formatPayback', () => {
  // The bug this exists to prevent: calculateTCO stores paybackYears = 0 when
  // there are no savings, so the raw field renders "0.00" -- which reads as an
  // instant payback when it means the investment never pays back at all.
  it('says there is no payback when AIM costs more to run than the slat switch', () => {
    const tco = calculateTCO(
      { ...EXAMPLE_INPUTS, aimSparePartsCost: 500_000, aimGlideInvestment: 89850 },
      5,
    )
    expect(tco.savings.yearly).toBeLessThan(0)
    expect(tco.savings.paybackYears).toBe('0.00') // the raw field still lies
    expect(formatPayback(tco)).toBe('No payback') // the formatted one does not
  })

  it('does not claim a payback period when no investment was entered', () => {
    const tco = calculateTCO({ ...EXAMPLE_INPUTS, aimGlideInvestment: 0 }, 5)
    expect(formatPayback(tco)).toBe('None needed')
  })

  it('reads in months under a year and in years and months above one', () => {
    const oneYearSavings = calculateTCO(EXAMPLE_INPUTS, 5).savings.yearly

    const months = calculateTCO(
      { ...EXAMPLE_INPUTS, aimGlideInvestment: Math.round(oneYearSavings / 2) },
      5,
    )
    expect(formatPayback(months)).toMatch(/^\d+ months$/)

    const years = calculateTCO(
      { ...EXAMPLE_INPUTS, aimGlideInvestment: Math.round(oneYearSavings * 2.5) },
      5,
    )
    expect(formatPayback(years)).toBe('2 yrs 6 mo')
  })

  it('drops the months when a payback lands on a whole year', () => {
    const yearly = calculateTCO(EXAMPLE_INPUTS, 5).savings.yearly
    const tco = calculateTCO({ ...EXAMPLE_INPUTS, aimGlideInvestment: yearly * 3 }, 5)
    expect(formatPayback(tco)).toBe('3 yrs')
  })
})

describe('buildCashflowSeries', () => {
  it('starts at minus the investment and gains a point per benefit year', () => {
    const tco = calculateTCO(EXAMPLE_INPUTS, 5)
    const series = buildCashflowSeries(tco, 5)

    expect(series.points).toHaveLength(6) // year 0 through year 5
    expect(series.points[0]).toEqual({ year: 0, cumulative: -tco.investment })
    expect(series.points.at(-1)!.cumulative).toBe(tco.savings.multiYear)
  })

  it('crosses zero at the payback point', () => {
    const tco = calculateTCO(EXAMPLE_INPUTS, 5)
    const series = buildCashflowSeries(tco, 5)

    expect(series.paybackYear).toBeCloseTo(Number(tco.savings.paybackYears), 1)

    const before = series.points.filter(p => p.year < Math.floor(series.paybackYear!))
    expect(before.every(p => p.cumulative < 0)).toBe(true)
  })

  it('reports no payback year when the line never climbs', () => {
    const tco = calculateTCO({ ...EXAMPLE_INPUTS, aimSparePartsCost: 500_000 }, 5)
    const series = buildCashflowSeries(tco, 5)

    expect(series.paybackYear).toBeNull()
    expect(series.max).toBe(0) // nothing ever rises above the axis
  })

  it('always brackets zero so both renderers can scale against the axis', () => {
    for (const inputs of [CLEARED_INPUTS, EXAMPLE_INPUTS]) {
      const series = buildCashflowSeries(calculateTCO(inputs, 5), 5)
      expect(series.min).toBeLessThanOrEqual(0)
      expect(series.max).toBeGreaterThanOrEqual(0)
    }
  })
})
