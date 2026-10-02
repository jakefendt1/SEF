// The application's actual load per pocket, as opposed to its capacity.
//
// Capacity is the largest stable heap (heap3d). A real line usually carries
// less: either what the target throughput needs at the entered belt speed, or
// -- without both of those -- the pocket filled to the fill factor. The load
// is drawn with the same physics as capacity: product rests against the
// trailing flight at its repose angle, but starts rolling back from a lower
// crest on the flight face. The crest height is solved so the load's volume
// is what the application needs.
import { computeHeap, type HeapParams } from './heap3d'
import { flightsPerMin } from './throughput'
import type { GridSize, PocketLoad, TdInputs } from './types'

/** How much of the pocket's capacity the application needs, and why. */
export function loadFraction(
  inputs: TdInputs,
  capacityMassLb: number,
): { fraction: number; source: 'target' | 'fill'; massLb: number } {
  const v = inputs.beltSpeedFpm
  const q = inputs.targetLbPerHr
  if (v !== null && v > 0 && q !== null && q > 0 && capacityMassLb > 0) {
    const massLb = q / (flightsPerMin(v, inputs.flightSpacingIn) * 60)
    return { fraction: massLb / capacityMassLb, source: 'target', massLb }
  }
  const fraction = inputs.fillPct / 100
  return { fraction, source: 'fill', massLb: fraction * capacityMassLb }
}

/** Small grid for finding the crest; the drawn load uses LOAD_GRID. */
const SOLVE_GRID = { nx: 40, ny: 26, nz: 30 }
/**
 * Grid the load is drawn at. A second full-grid run would double the compute
 * time for a shape the eye can't tell apart; the headline numbers never come
 * from this field.
 */
const LOAD_GRID: Record<GridSize, { nx: number; ny: number; nz: number } | null> = {
  fine: { nx: 100, ny: 60, nz: 75 },
  // While typing, the solver's own last field is drawn: no extra run.
  coarse: null,
  sweep: null,
}
const MAX_STEPS = 10
const REL_TOL = 0.004

/**
 * Solve the crest height whose heap holds `fraction` of the capacity.
 * Volume rises smoothly with the crest, so a bracketing secant (Illinois)
 * step converges in a handful of evaluations on the small grid.
 */
export function solveLoad(
  base: HeapParams,
  fraction: number,
  grid: GridSize,
): { crestIn: number; heap: ReturnType<typeof computeHeap> } {
  const H = base.profile.tip[1]
  const small = { ...base, ...SOLVE_GRID }
  // The solve grid's own capacity, so the ratio isn't skewed by grid noise.
  const cap = computeHeap({ ...small, crestHeightIn: null }).volumeIn3
  const target = fraction * cap
  let last: { h: number; heap: ReturnType<typeof computeHeap> } | null = null
  const f = (h: number) => {
    last = { h, heap: computeHeap({ ...small, crestHeightIn: h }) }
    return last.heap.volumeIn3 - target
  }

  let a = -H
  let b = H
  let fa = f(a)
  // A crest at the tip is the capacity heap itself: no need to compute it.
  let fb = cap - target
  let side = 0
  let c = (a + b) / 2
  if (fa >= 0) c = a
  else if (fb <= 0) c = b
  else {
    for (let i = 0; i < MAX_STEPS; i++) {
      c = (a * fb - b * fa) / (fb - fa)
      const fc = f(c)
      if (Math.abs(fc) <= REL_TOL * Math.max(target, 1e-9)) break
      if (fc * fb > 0) {
        b = c
        fb = fc
        if (side === -1) fa /= 2
        side = -1
      } else {
        a = c
        fa = fc
        if (side === 1) fb /= 2
        side = 1
      }
    }
  }
  const display = LOAD_GRID[grid]
  if (!display) {
    // Reuse the solver's field only if it is the one at the final crest.
    const settled = last as { h: number; heap: ReturnType<typeof computeHeap> } | null
    const heap = settled && settled.h === c ? settled.heap : computeHeap({ ...small, crestHeightIn: c })
    return { crestIn: c, heap }
  }
  return { crestIn: c, heap: computeHeap({ ...base, ...display, crestHeightIn: c }) }
}

export function computePocketLoad(
  inputs: TdInputs,
  base: HeapParams,
  capacityVolumeIn3: number,
  capacityMassLb: number,
  grid: GridSize,
): PocketLoad {
  const { fraction, source, massLb } = loadFraction(inputs, capacityMassLb)
  const speedForFullFpm =
    inputs.targetLbPerHr !== null && inputs.targetLbPerHr > 0 && capacityMassLb > 0
      ? (inputs.targetLbPerHr / (capacityMassLb * 60)) * (inputs.flightSpacingIn / 12)
      : null
  const common = { fraction, source, massLb, overCapacity: fraction > 1 + 1e-9, speedForFullFpm }

  if (fraction >= 0.999 || capacityVolumeIn3 <= 0) {
    // Full (or more than full): the load is the capacity heap.
    return { ...common, crestIn: null, volumeIn3: capacityVolumeIn3, heap: null }
  }
  const { crestIn, heap } = solveLoad(base, fraction, grid)
  // The volume is the fraction of the (full-grid) capacity, exactly; the
  // field is for drawing.
  return { ...common, crestIn, volumeIn3: fraction * capacityVolumeIn3, heap: heap.field }
}
