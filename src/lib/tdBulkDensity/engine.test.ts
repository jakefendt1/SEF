// Plan §9, T1–T19. Unless a test says otherwise: zero-thickness 90° flight,
// H = 5 in, s = 8 in, Δγ = 0. Volume tests run on the fine grid with ±1%
// tolerance; reference values come from reference/pile.py (Appendix A),
// re-run 2026-10-02: T5 287.1, T6 45.1, T7 127.6/252.9/287.1/287.1,
// T8 581.5 open / 906.5 walls, T9 0.0.
import { describe, expect, it } from 'vitest'
import { computeTdBulkDensity } from './compute'
import { SIDEWALL_FOOTPRINT_IN } from './data/sidewalls'
import { makeInputs } from './defaults'
import { computePocket2D } from './pocket2d'
import { buildProfile } from './profiles'
import { availableOptions } from './rules'
import { computeThroughput, massPerFlight } from './throughput'
import type { FlightType, TdInputs } from './types'

const bare = buildProfile('deg90', 5, 0)
const area = (alpha: number, gamma: number, profile = bare) =>
  computePocket2D(profile, 8, alpha, gamma).areaIn2

/** Inputs giving a 9.5 in flight width with 1.25 in indents. */
function base(overrides: Partial<TdInputs> = {}): TdInputs {
  return makeInputs({
    beltWidthIn: 12,
    flightThicknessIn: 0,
    flightHeightIn: 5,
    flightSpacingIn: 8,
    inclineDeg: 52,
    reposeDeg: 35,
    dynamicDerateDeg: 0,
    ...overrides,
  })
}

const walls = (o: Partial<TdInputs> = {}) => base({ calcLabMode: true, ...o })
const open = (o: Partial<TdInputs> = {}) => base({ containment: 'open', ...o })

function sidewalls(h: number): TdInputs {
  const side = 1.25 + SIDEWALL_FOOTPRINT_IN['50mm'] + 0.2
  return base({
    containment: 'sidewalls',
    beltWidthIn: 9.5 + 2 * side,
    sidewallPitch: '50mm',
    sidewallHeightIn: h,
    sidewallIndentIn: 1.25,
    sidewallGapIn: 0.2,
  })
}

const volume = (inputs: TdInputs) => computeTdBulkDensity(inputs, 'fine').pocketVolumeIn3

function expectWithin(actual: number, expected: number, pct: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual((Math.abs(expected) * pct) / 100)
}

describe('2D pocket (plan §3.2)', () => {
  it('T1: α=52, γ=0 → 9.766 in²', () => {
    expect(area(52, 0)).toBeCloseTo(9.766, 2)
  })
  it('T2: α=52, γ=10 → 13.883 in²', () => {
    expect(area(52, 10)).toBeCloseTo(13.883, 2)
  })
  it('T3: α=30, γ=0, surface meets next flight → 21.525 in²', () => {
    const p = computePocket2D(bare, 8, 30, 0)
    expect(p.areaIn2).toBeCloseTo(21.525, 2)
    expect(p.geometricCase).toBe('meets')
  })
  it('T4: α=30, γ=35 (θ ≤ 0) → H·s = 40 in²', () => {
    const p = computePocket2D(bare, 8, 30, 35)
    expect(p.areaIn2).toBeCloseTo(40, 6)
    expect(p.geometricCase).toBe('level')
  })
  it('reproduces CalcLab ½·H·fb′ for a bare 90° flight', () => {
    const H = 5
    // γ = 15 keeps fb′ (6.63 in) short of the 8 in spacing; at γ = 20 it
    // reaches 8.002 in and the sliver past the next flight is removed.
    const fb = H * Math.tan(((90 - 52 + 15) * Math.PI) / 180)
    expect(area(52, 15)).toBeCloseTo(0.5 * H * fb, 9)
    expect(computePocket2D(bare, 8, 52, 15).geometricCase).toBe('clears')
    expect(computePocket2D(bare, 8, 52, 20).geometricCase).toBe('meets')
  })
  it('T19: 5 in short-top scoop, α=52, γ=0 → 15.38 in²', () => {
    expect(area(52, 0, buildProfile('shortTopScoop', 5, 0))).toBeCloseTo(15.38, 2)
  })
})

describe('3D heap (plan §3.4)', () => {
  it('T5: walls at both ends → 287.1 in³ (= 30.22 × 9.5)', () => {
    const r = computeTdBulkDensity(walls(), 'fine')
    expect(r.pocketAreaIn2).toBeCloseTo(30.22, 2)
    expectWithin(r.pocketVolumeIn3, 287.1, 1)
  })
  it('T6: open ends → 45.1 in³', () => {
    expectWithin(volume(open()), 45.1, 1)
  })
  it('T7: sidewalls 2/4/5/6 in → 127.7/252.9/287.1/287.1 in³, plateau at flight height', () => {
    const v = [2, 4, 5, 6].map((h) => volume(sidewalls(h)))
    expectWithin(v[0], 127.7, 1)
    expectWithin(v[1], 252.9, 1)
    expectWithin(v[2], 287.1, 1)
    expectWithin(v[3], 287.1, 1)
    expect(v[3]).toBeCloseTo(v[2], 6)
  })
  it('T8: W_f = 30, open ends → 581.6 in³ (vs 906.6 walls)', () => {
    const wide = { beltWidthIn: 32.5 }
    expectWithin(volume(open(wide)), 581.6, 1)
    expectWithin(volume(walls(wide)), 906.6, 1)
  })
  it('T9: α=52, γ=0, open ends → 0 (a liquid drains off open ends)', () => {
    expect(volume(open({ reposeDeg: 0 }))).toBe(0)
  })
  it('T13: walls at both ends, every flight type → V = A·W within 0.5%', () => {
    const types: [FlightType, number][] = [
      ['deg90', 5],
      ['deg75', 5],
      ['scoop', 5],
      ['shortTopScoop', 5],
    ]
    for (const [flightType, h] of types) {
      for (const [alpha, gamma] of [
        [52, 35],
        [52, 0],
        [30, 0],
      ]) {
        const r = computeTdBulkDensity(
          walls({ flightType, flightHeightIn: h, flightThicknessIn: 0.16, inclineDeg: alpha, reposeDeg: gamma }),
          'fine',
        )
        expectWithin(r.pocketVolumeIn3, r.pocketAreaIn2 * 9.5, 0.5)
      }
    }
  })
  it('T17: guard clearance 1.5 in over a 1.0 in product → open ends, same volume as T6', () => {
    const r = computeTdBulkDensity(
      base({ containment: 'guards', guardClearanceIn: 1.5, smallestDimIn: 1 }),
      'fine',
    )
    expect(r.endTreatment).toEqual({ kind: 'open' })
    expect(r.pocketVolumeIn3).toBeCloseTo(volume(open()), 6)
    expect(r.warnings.some((w) => w.id === 'guard-open')).toBe(true)
  })
  it('a tight guard holds like a wall, and drags', () => {
    const r = computeTdBulkDensity(
      base({ containment: 'guards', guardClearanceIn: 0.5, smallestDimIn: 1, inclineLengthFt: 10, densityLbFt3: 10 }),
      'fine',
    )
    expectWithin(r.pocketVolumeIn3, 287.1, 1)
    expect(r.guardDragPerPocketLbf).toBeGreaterThan(0)
    expect(r.guardDragTotalLbf).toBeCloseTo(r.guardDragPerPocketLbf! * 2 * (120 / 8), 9)
  })
  it('guard mode with no clearance asks for it rather than guessing', () => {
    const r = computeTdBulkDensity(base({ containment: 'guards', guardClearanceIn: null }))
    expect(r.status).toBe('needs-input')
    expect(r.heap).toBeNull()
    expect(r.throughput).toBeNull()
  })
  it('notches lose product at belt level and are not carry width', () => {
    const plain = computeTdBulkDensity(walls({ beltWidthIn: 32.5 }), 'fine')
    const notched = computeTdBulkDensity(walls({ beltWidthIn: 32.5, notchCount: 1, notchWidthIn: 2 }), 'fine')
    expect(notched.width!.carryWidthIn).toBeCloseTo(28, 9)
    expect(notched.pocketVolumeIn3).toBeLessThan(plain.pocketVolumeIn3 * (28 / 30))
  })
  it('the coarse grid agrees with the fine grid to a few percent', () => {
    const fine = volume(open())
    const coarse = computeTdBulkDensity(open(), 'coarse').pocketVolumeIn3
    expectWithin(coarse, fine, 4)
  })
  it('governing edges: open ends govern at the flight ends, the trailing tip mid-width', () => {
    const r = computeTdBulkDensity(open({ beltWidthIn: 32.5 }), 'fine')
    const h = r.heap!
    const ix = Math.floor(h.nx * 0.3)
    expect(h.governing[ix * h.nz + 0]).toBe(2) // 'open'
    expect(h.governing[ix * h.nz + Math.floor(h.nz / 2)]).toBe(0) // 'trailing'
  })
})

describe('Sidewalls on leaning flights (audit 2026-10-03)', () => {
  // The sidewall-top spill edge must start at the trailing face at sidewall
  // height and end at the leading back face -- not at x = 0, which sits behind
  // a 75° or scoop flight where product can't get to it.
  const leaning = (flightType: 'deg75' | 'scoop', h: number) => ({
    ...sidewalls(h),
    flightType,
    flightThicknessIn: 0.16,
  })

  for (const flightType of ['deg75', 'scoop'] as const) {
    it(`${flightType}: sidewalls at or above the tip hold what walls hold, and volume never drops as they rise`, () => {
      const walls = computeTdBulkDensity({ ...leaning(flightType, 5), calcLabMode: true, dynamicDerateDeg: 0 }, 'fine')
      const vs = [2, 3, 4, 5, 6].map((h) => volume(leaning(flightType, h)))
      for (let i = 1; i < vs.length; i++) expect(vs[i]).toBeGreaterThanOrEqual(vs[i - 1] - 0.5)
      expectWithin(vs[3], walls.pocketVolumeIn3, 1)
      expectWithin(vs[4], walls.pocketVolumeIn3, 1)
    })
  }

  it('scoop: a sidewall just above the body holds at least what one at the body height does', () => {
    expect(volume(leaning('scoop', 4.7))).toBeGreaterThanOrEqual(volume(leaning('scoop', 4.48)) - 0.5)
  })
})

describe('Throughput (plan §3.7)', () => {
  const m = 0.61812
  const t = computeThroughput({
    massLb: m,
    inclineDeg: 52,
    spacingIn: 8,
    carryWidthIn: 9.5,
    beltWidthIn: 17.75,
    speedFpm: 60,
    targetLbPerHr: 2625,
    inclineLengthFt: 20,
  })
  it('T10: Q = 3,338 lb/h at 60 ft/min; v_min for 2,625 lb/h = 47.19 ft/min', () => {
    expect(t.throughputLbPerHr!).toBeCloseTo(3338, 0)
    expect(t.minSpeedFpm!).toBeCloseTo(47.19, 2)
    expect(t.flightsPerMin).toBe(90)
  })
  it('T11: F_flight = 0.487 lbf at α = 52', () => {
    expect(t.flightLoadLbf).toBeCloseTo(0.487, 3)
  })
  it('T12: q_area = 0.627 lb/ft² for W_b = 17.75, s = 8', () => {
    expect(t.areaLoadLbPerFt2).toBeCloseTo(0.627, 3)
  })
  it('incline totals: W_total = w_belt·L and F_lift = W_total·sin α', () => {
    expect(t.inclineProductLb!).toBeCloseTo(((m * 12) / 8) * 20, 9)
    expect(t.inclineLiftLbf!).toBeCloseTo(t.inclineProductLb! * Math.sin((52 * Math.PI) / 180), 9)
  })
})

describe('Calibration against CalcLab', () => {
  it('T18: Jacksons, 5 in standard scoop, CalcLab mode → A = 18.93 in², m = 0.6165 lb', () => {
    const r = computeTdBulkDensity(
      walls({
        flightType: 'scoop',
        reposeDeg: 0,
        densityLbFt3: 7.9,
        fillPct: 75,
      }),
      'fine',
    )
    expect(r.pocketAreaIn2).toBeCloseTo(18.93, 2)
    const mExact = massPerFlight(7.9, 75, r.pocketAreaIn2 * 9.5)
    expect(mExact).toBeCloseTo(0.6165, 3)
    expectWithin(mExact, 0.6181, 0.5)
    expectWithin(r.throughput!.massPerFlightLb, 0.6165, 0.5)
  })
})

describe('Jacksons Chips / Mez incline vs. CalcLab (2026-10-02)', () => {
  // CalcLab: 5 in scoop, 55°, 7.7 in spacing, 11.596 in flight width on a
  // 19.5 in belt, 7.5 lb/ft³, repose 40°, 75% fill -> 1.26 lb/flight,
  // 29.73 ft/min for 3,500 lb/h, 7,064.3 lb/h at 60 ft/min.
  const jacksons = makeInputs({
    flightType: 'scoop',
    flightHeightIn: 5,
    flightThicknessIn: 0,
    flightSpacingIn: 7.7,
    inclineDeg: 55,
    beltWidthIn: 19.5,
    containment: 'sidewalls',
    sidewallPitch: '50mm',
    sidewallIndentIn: 2,
    sidewallGapIn: 0.2,
    sidewallHeightIn: 4,
    densityLbFt3: 7.5,
    reposeDeg: 40,
    fillPct: 75,
    targetLbPerHr: 3500,
    beltSpeedFpm: 60,
  })

  it('CalcLab mode matches CalcLab within 1%', () => {
    const t = computeTdBulkDensity({ ...jacksons, calcLabMode: true }, 'fine').throughput!
    expectWithin(t.massPerFlightLb, 1.2591, 1)
    expectWithin(t.minSpeedFpm!, 29.73, 1)
    expectWithin(t.throughputLbPerHr!, 7064.3, 1)
  })

  it('the waterfall starts at CalcLab and ends at this result', () => {
    const r = computeTdBulkDensity({ ...jacksons, flightThicknessIn: 0.16 }, 'fine')
    const w = r.waterfall!
    expect(w.map((s) => s.id)).toEqual(['calclab', 'thickness', 'derate', 'edges'])
    expectWithin(w[0].massLb, 1.2591, 1)
    expectWithin(w[0].minSpeedFpm!, 29.73, 1)
    expect(w[3].massLb).toBeCloseTo(r.throughput!.massPerFlightLb, 9)
    // Each step's change chains to the next.
    for (let i = 1; i < w.length; i++) expect(w[i].massLb).toBeCloseTo(w[i - 1].massLb * (1 + w[i].deltaPct! / 100), 9)
    expect(computeTdBulkDensity({ ...jacksons, calcLabMode: true }, 'coarse').waterfall).toBeNull()
  })

  it('with nothing spilling at the flight ends, the last step changes nothing', () => {
    const r = computeTdBulkDensity({ ...jacksons, flightThicknessIn: 0.16, sidewallHeightIn: 6 }, 'fine')
    expectWithin(r.waterfall![3].massLb, r.waterfall![2].massLb, 0.5)
  })

  it('reports the flight load with the pocket brim-full (surge)', () => {
    const t = computeTdBulkDensity({ ...jacksons, flightThicknessIn: 0.16 }, 'fine').throughput!
    expect(t.flightLoadSurgeLbf!).toBeCloseTo(t.flightLoadLbf / 0.75, 9)
  })

  it('the real configuration (4 in sidewalls on a 5 in scoop, 5° derate) is below CalcLab', () => {
    const r = computeTdBulkDensity({ ...jacksons, flightThicknessIn: 0.16 }, 'fine')
    expect(r.width!.flightWidthIn).toBeCloseTo(11.596, 3)
    expect(r.throughput!.massPerFlightLb).toBeLessThan(1.26 * 0.8)
  })
})

describe('Rules (plan §4, §6)', () => {
  it('T14: a 1.0 in indent is an error citing p.75', () => {
    const r = computeTdBulkDensity(base({ indentLeftIn: 1.0 }), 'coarse')
    const w = r.warnings.find((x) => x.id === 'indent-min-left')
    expect(w?.severity).toBe('error')
    expect(w?.cite).toBe('p.75')
    expect(r.blocked).toBe(true)
  })
  it('T15: scoop on S8050 at 3.5 in spacing is an error, minimum 3.9 in', () => {
    const r = computeTdBulkDensity(
      base({ flightType: 'scoop', series: 'S8050', flightSpacingIn: 3.5, flightThicknessIn: 0.16 }),
      'coarse',
    )
    const w = r.warnings.find((x) => x.id === 'spacing-min')
    expect(w?.severity).toBe('error')
    expect(w?.message).toContain('3.9 in')
  })
  it('T16: sidewall mode is disabled for S8026', () => {
    const opts = availableOptions({ series: 'S8026', flightType: 'deg90', sidewallPitch: '50mm' })
    expect(opts.containments.find((c) => c.value === 'sidewalls')?.enabled).toBe(false)
    expect(opts.sidewallHeights).toEqual([])
    const r = computeTdBulkDensity(base({ series: 'S8026', containment: 'sidewalls' }), 'coarse')
    expect(r.warnings.find((x) => x.id === 'sidewall-series')?.severity).toBe('error')
  })
  it('sidewalls: the corrugations are drawn but not counted, and the tool says so', () => {
    const r = computeTdBulkDensity(sidewalls(4), 'coarse')
    // Carry width is the flight width -- nothing in the gap or the wave.
    expect(r.width!.carryWidthIn).toBeCloseTo(9.5, 9)
    expect(r.warnings.find((w) => w.id === 'sidewall-corrugation')?.message).toContain('conservative')
  })

  it('sidewall heights are filtered by series and pitch', () => {
    expect(availableOptions({ series: 'S8050', flightType: 'deg90', sidewallPitch: '25mm' }).sidewallHeights).toEqual([1, 2])
    expect(availableOptions({ series: 'S8140', flightType: 'deg90', sidewallPitch: '40mm' }).sidewallHeights).toEqual([2, 2.3, 3, 4])
  })
  it('hold-down width sets the required indent: max(1.25, w_hd + 0.25)', () => {
    const r = computeTdBulkDensity(base({ holdDownWidthIn: 1.5, indentLeftIn: 1.5, indentRightIn: 1.5 }), 'coarse')
    const w = r.warnings.find((x) => x.id === 'holddown-clearance')
    expect(w?.severity).toBe('warning')
    expect(w?.fix).toContain('1.75 in')
  })
  it('flight length over 36 in blocks; over 32 in blocks a short-top scoop', () => {
    expect(computeTdBulkDensity(base({ beltWidthIn: 40 }), 'coarse').warnings.some((w) => w.id === 'flight-length')).toBe(true)
    const st = computeTdBulkDensity(base({ flightType: 'shortTopScoop', beltWidthIn: 35, flightThicknessIn: 0.16 }), 'coarse')
    expect(st.warnings.some((w) => w.id === 'flight-length')).toBe(true)
  })
  it('the open-ends warning reports the spilled share', () => {
    const r = computeTdBulkDensity(open(), 'fine')
    const w = r.warnings.find((x) => x.id === 'open-loss')
    expect(w?.message).toMatch(/Open flight ends: 8\d% of the pocket spills/)
  })
  it('errors sort ahead of warnings ahead of info', () => {
    const r = computeTdBulkDensity(base({ indentLeftIn: 1.0, containment: 'open' }), 'coarse')
    const order = r.warnings.map((w) => w.severity)
    const rank = { error: 0, warning: 1, info: 2 }
    expect(order.map((s) => rank[s])).toEqual([...order.map((s) => rank[s])].sort())
  })
})

describe('Angle of repose warnings (Jake, 2026-10-05)', () => {
  const ids = (i: Partial<TdInputs>) => computeTdBulkDensity(makeInputs(i), 'coarse').warnings.map((w) => w.id)
  const warning = (i: Partial<TdInputs>, id: string) =>
    computeTdBulkDensity(makeInputs(i), 'coarse').warnings.find((w) => w.id === id)

  it('flags a 0° repose as a warning, not an error', () => {
    expect(warning({ reposeDeg: 0 }, 'repose-zero')?.severity).toBe('warning')
    expect(ids({ reposeDeg: 35 })).not.toContain('repose-zero')
  })

  it('warns when the repose (after the dynamic allowance) reaches the incline', () => {
    // 35° - 5° = 30° against a 30° incline: the level case.
    const w = warning({ inclineDeg: 30, reposeDeg: 35 }, 'case-level')
    expect(w?.severity).toBe('warning')
    expect(w?.message).toContain('30°')
    expect(w?.message).toContain('35° less the 5° dynamic allowance')
    expect(ids({ inclineDeg: 30, reposeDeg: 30 })).not.toContain('case-level')
  })

  it('above that point the pocket area stops changing; the warning says why', () => {
    const area = (r: number) => computeTdBulkDensity(makeInputs({ inclineDeg: 30, reposeDeg: r }), 'coarse').pocketAreaIn2
    expect(area(40)).toBeCloseTo(area(50), 6)
    expect(area(30)).toBeLessThan(area(40))
  })
})
