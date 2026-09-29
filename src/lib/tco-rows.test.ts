import { describe, it, expect } from 'vitest'
import { buildTcoRows } from './tco-rows'
import { calculateTCO, CLEARED_INPUTS, EXAMPLE_INPUTS } from './calculator'

const withOtherCosts = {
  ...EXAMPLE_INPUTS,
  metalOtherCost: 1200,
  metalOtherCostUnit: 'per year',
  metalOtherCostDesc: 'Belt tracking service visits',
  aimOtherCost: 0,
}

describe('buildTcoRows', () => {
  // The whole point of this module is that one list feeds both the Results tab
  // and the PDF. If the totals stop reconciling against the line items, the
  // customer-facing document is arithmetically wrong on its face.
  it('line items sum to the total row, in both columns', () => {
    const tco = calculateTCO(EXAMPLE_INPUTS, 5)
    const rows = buildTcoRows(tco)
    const items = rows.filter(r => !r.isTotal)
    const total = rows.find(r => r.isTotal)!

    const sum = (key: 'metal' | 'aim') =>
      items.reduce((acc, r) => acc + (r[key] ?? 0), 0)

    expect(sum('metal')).toBe(total.metal)
    expect(sum('aim')).toBe(total.aim)
  })

  it('reconciles once Other Costs are in play', () => {
    const rows = buildTcoRows(calculateTCO(withOtherCosts, 5))
    const items = rows.filter(r => !r.isTotal)
    const total = rows.find(r => r.isTotal)!

    expect(rows.map(r => r.label)).toContain('Other Costs')
    expect(items.reduce((acc, r) => acc + (r.metal ?? 0), 0)).toBe(total.metal)
    expect(items.reduce((acc, r) => acc + (r.aim ?? 0), 0)).toBe(total.aim)
  })

  it('omits the Other Costs row when neither side has any', () => {
    const rows = buildTcoRows(calculateTCO(EXAMPLE_INPUTS, 5))
    expect(rows.map(r => r.label)).not.toContain('Other Costs')
  })

  it('leaves the unused Other Costs column as a dash rather than a zero', () => {
    // A literal "$0" reads as "we checked, it costs nothing". A dash reads as
    // "not applicable", which is what an empty column actually means.
    const rows = buildTcoRows(calculateTCO(withOtherCosts, 5))
    const other = rows.find(r => r.label === 'Other Costs')!
    expect(other.metal).toBe(1200)
    expect(other.aim).toBeNull()
  })

  it('carries a calc trace for every derived figure', () => {
    // These strings are the "where did that number come from" layer. The PDF
    // used to drop them entirely; this asserts they exist to be dropped.
    const rows = buildTcoRows(calculateTCO(EXAMPLE_INPUTS, 5))
    for (const label of ['Maintenance Labor', 'Unscheduled Downtime', 'Product Waste']) {
      const row = rows.find(r => r.label === label)!
      expect(row.metalBreakdown, `${label} lost its metal breakdown`).toBeTruthy()
      expect(row.aimBreakdown, `${label} lost its AIM breakdown`).toBeTruthy()
    }
  })

  it('adds the reallocation note to both columns only when labor is reallocated', () => {
    const off = buildTcoRows(calculateTCO(EXAMPLE_INPUTS, 5))[0]
    expect(off.metalNote).toBeUndefined()
    expect(off.aimNote).toBeUndefined()

    const on = buildTcoRows(
      calculateTCO({ ...EXAMPLE_INPUTS, laborReallocated: true }, 5),
    )[0]
    expect(on.metalNote).toContain('reallocated')
    expect(on.aimNote).toContain('freed')
  })

  it('survives a completely empty input set', () => {
    const rows = buildTcoRows(calculateTCO(CLEARED_INPUTS, 5))
    expect(rows.at(-1)!.isTotal).toBe(true)
    for (const row of rows) {
      expect(Number.isFinite(row.metal ?? 0), `${row.label} metal`).toBe(true)
      expect(Number.isFinite(row.aim ?? 0), `${row.label} aim`).toBe(true)
    }
  })
})
