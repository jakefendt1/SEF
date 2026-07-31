import { describe, it, expect } from 'vitest'
import { calculateTCO, CLEARED_INPUTS, EXAMPLE_INPUTS, PERIODS_PER_YEAR } from './calculator'

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
