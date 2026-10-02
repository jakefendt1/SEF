import { describe, expect, it } from 'vitest'
import { compareRuns } from './compare'
import { computeTdBulkDensity } from './compute'
import { makeInputs } from './defaults'
import { angleSweep, sidewallSweep, spacingSweep } from './sweeps'

const base = makeInputs({
  beltWidthIn: 16,
  flightHeightIn: 5,
  flightSpacingIn: 8,
  inclineDeg: 52,
  reposeDeg: 35,
  beltSpeedFpm: 60,
  densityLbFt3: 7.9,
})

describe('sweeps (plan §7.4)', () => {
  it('sidewall height: rises, then plateaus at flight height', () => {
    const s = sidewallSweep(base)
    const pts = s.series[0].points.filter((p) => p.y !== null) as { x: number; y: number }[]
    const at = (h: number) => pts.reduce((best, p) => (Math.abs(p.x - h) < Math.abs(best.x - h) ? p : best)).y
    expect(at(2)).toBeGreaterThan(at(0))
    expect(at(4)).toBeGreaterThan(at(2))
    expect(Math.abs(at(6.5) - at(5.2)) / at(5.2)).toBeLessThan(0.02)
    // Dots are the offered heights for S8050 at 50 mm pitch.
    expect(s.markers.map((m) => m.x)).toEqual([2, 2.3, 3, 4, 6])
    expect(s.yMetric).toBe('throughput')
  })

  it('sidewall sweep explains itself on S8026 rather than drawing a curve', () => {
    const s = sidewallSweep({ ...base, series: 'S8026' })
    expect(s.series).toEqual([])
    expect(s.note).toContain('S8026')
  })

  it('angle: open ends never beat walls, and the guard line needs a clearance', () => {
    const s = angleSweep(base)
    expect(s.series.map((x) => x.id)).toEqual(['open', 'sidewalls'])
    const open = s.series[0].points
    s.reference!.points.forEach((w, i) => {
      if (w.y !== null && open[i].y !== null) expect(open[i].y!).toBeLessThanOrEqual(w.y * 1.03)
    })
    expect(angleSweep({ ...base, guardClearanceIn: 0.5 }).series.map((x) => x.id)).toContain('guards')
  })

  it('spacing: shades below the manual minimum; without a speed, plots product per flight', () => {
    const s = spacingSweep({ ...base, beltSpeedFpm: null })
    expect(s.disallowedBelow).toBe(1.9)
    expect(s.yMetric).toBe('mass')
    const ys = s.series[0].points.map((p) => p.y!)
    expect(ys[ys.length - 1]).toBeGreaterThan(ys[0])
  })
})

describe('A/B compare (plan §7.5)', () => {
  it('names the change and what it bought', () => {
    const inputs = { ...base, targetLbPerHr: 2625 }
    const A = computeTdBulkDensity({ ...inputs, containment: 'open' }, 'coarse')
    const B = computeTdBulkDensity(
      { ...inputs, containment: 'sidewalls', sidewallHeightIn: 4, sidewallPitch: '50mm' },
      'coarse',
    )
    const c = compareRuns(A, B, 'imperial')
    expect(c.changes).toContain('Open ends → Sidewalls 4 in')
    expect(c.summary).toMatch(/^Open ends → Sidewalls 4 in: [\d,]+ → [\d,]+ lb\/h at 60\.0 ft\/min \(\+\d+%\); min speed for 2,625 lb\/h drops from \d+ to \d+ ft\/min\.$/)
    expect(c.throughputPct!).toBeGreaterThan(0)
  })

  it('says so when nothing changed', () => {
    const A = computeTdBulkDensity(base, 'coarse')
    expect(compareRuns(A, A, 'imperial').summary).toMatch(/^No input changes: /)
  })
})
