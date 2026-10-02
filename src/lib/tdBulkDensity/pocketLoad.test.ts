import { describe, expect, it } from 'vitest'
import { computeTdBulkDensity } from './compute'
import { makeInputs } from './defaults'
import { densityLbIn3, flightsPerMin } from './throughput'
import type { HeapField } from './types'

const base = makeInputs({
  flightType: 'scoop',
  flightHeightIn: 5,
  flightSpacingIn: 7.7,
  inclineDeg: 55,
  beltWidthIn: 19.5,
  containment: 'sidewalls',
  sidewallPitch: '50mm',
  sidewallIndentIn: 2,
  sidewallHeightIn: 4,
  densityLbFt3: 7.5,
  reposeDeg: 40,
  fillPct: 75,
})

/** Volume of the drawn load field, to check the shape really holds the load. */
function fieldVolume(h: HeapField): number {
  let n = 0
  for (let i = 0; i < h.count.length; i++) n += h.count[i]
  return n * h.dx * h.dy * h.dz
}

function within(actual: number, expected: number, pct: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual((Math.abs(expected) * pct) / 100)
}

describe('the application load (what each pocket actually carries)', () => {
  it('without a target and speed, it is the pocket at the fill factor', () => {
    const r = computeTdBulkDensity(base, 'fine')
    const load = r.load!
    expect(load.source).toBe('fill')
    expect(load.fraction).toBe(0.75)
    within(fieldVolume(load.heap!), 0.75 * r.pocketVolumeIn3, 4)
    expect(load.crestIn!).toBeLessThan(r.profile!.tip[1])
  })

  it('with a target and a speed, it is what the target needs at that speed', () => {
    const inputs = { ...base, targetLbPerHr: 3500, beltSpeedFpm: 60 }
    const r = computeTdBulkDensity(inputs, 'fine')
    const need = 3500 / (flightsPerMin(60, 7.7) * 60)
    expect(r.load!.source).toBe('target')
    within(r.load!.massLb, need, 0.01)
    const capMass = densityLbIn3(7.5) * r.pocketVolumeIn3
    within(fieldVolume(r.load!.heap!), (need / capMass) * r.pocketVolumeIn3, 4)
  })

  it('never sits above the capacity heap', () => {
    const r = computeTdBulkDensity({ ...base, fillPct: 50 }, 'coarse')
    const cap = r.heap!
    const load = r.load!.heap!
    for (let c = 0; c < cap.top.length; c++) {
      if (load.count[c] > 0) expect(load.top[c]).toBeLessThanOrEqual(cap.top[c] + 1e-6)
    }
  })

  it('a target the pockets cannot carry is flagged, with the speed that would', () => {
    const r = computeTdBulkDensity({ ...base, targetLbPerHr: 3500, beltSpeedFpm: 20 }, 'coarse')
    expect(r.load!.overCapacity).toBe(true)
    expect(r.load!.heap).toBeNull() // drawn as the brim-full capacity heap
    const w = r.warnings.find((x) => x.id === 'over-capacity')
    expect(w?.severity).toBe('warning')
    expect(w?.fix).toMatch(/Run at [\d.]+ ft\/min or faster/)
  })

  it('a target that needs more than the fill factor says so', () => {
    // Fraction needed at 34 ft/min (about 85%) sits between the 75% fill factor and capacity.
    const r = computeTdBulkDensity({ ...base, targetLbPerHr: 3500, beltSpeedFpm: 34 }, 'coarse')
    expect(r.load!.fraction).toBeGreaterThan(0.75)
    expect(r.load!.fraction).toBeLessThan(1)
    expect(r.warnings.some((x) => x.id === 'above-fill')).toBe(true)
  })

  it('open ends: the load solves there too', () => {
    const r = computeTdBulkDensity({ ...base, containment: 'open', indentLeftIn: 3.952, indentRightIn: 3.952 }, 'coarse')
    within(fieldVolume(r.load!.heap!), 0.75 * r.pocketVolumeIn3, 6)
  })

  it('sweeps skip the load solve', () => {
    expect(computeTdBulkDensity(base, 'sweep', 'imperial', { load: false }).load).toBeNull()
  })

  it('stays inside the compute budget on the fine grid', () => {
    computeTdBulkDensity(base, 'fine')
    const r = computeTdBulkDensity(base, 'fine')
    expect(r.computeMs).toBeLessThan(250)
  })
})
