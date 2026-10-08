// "Why this differs from CalcLab": the chain from CalcLab's assumptions to
// this result, one assumption at a time, so a rep can explain the gap.
//
//   1. CalcLab        zero-thickness flight, walls at both ends, static repose
//   2. + thickness    the real flight thickness
//   3. + derate       dynamic repose on a moving incline
//   4. + flight ends  open ends / guards / sidewall height / notches
//
// Steps 1-3 are 2D pocket areas times the carry width (exact for walls at
// both ends); step 4 is the 3D heap the result already has. No extra heap runs.
import { computePocket2D } from './pocket2d'
import { buildProfile } from './profiles'
import { flightsPerMin, massPerFlight, minSpeedFpm } from './throughput'
import type { TdComputed } from './compute'

export interface WaterfallStep {
  id: 'calclab' | 'thickness' | 'derate' | 'edges'
  label: string
  /** Product per flight at the fill factor, lb. */
  massLb: number
  /** Throughput at the entered belt speed, lb/h, when there is one. */
  throughputLbPerHr: number | null
  /** Minimum speed for the target, ft/min, when there is one. */
  minSpeedFpm: number | null
  /** Change in product per flight from the previous step, %. Null for the first. */
  deltaPct: number | null
}

export function calcLabWaterfall(
  r: Pick<TdComputed, 'inputs' | 'width' | 'status' | 'pocketVolumeIn3' | 'gammaDynamicDeg'>,
): WaterfallStep[] | null {
  const i = r.inputs
  if (r.status !== 'ok' || !r.width || i.calcLabMode) return null
  const carry = r.width.carryWidthIn
  const isScoop = i.flightType === 'scoop' || i.flightType === 'shortTopScoop'
  const area = (thickness: number, gamma: number, calcLab = false) =>
    computePocket2D(
      buildProfile(i.flightType, i.flightHeightIn, thickness, i.profileOverride, calcLab),
      i.flightSpacingIn,
      i.inclineDeg,
      gamma,
    ).areaIn2

  const volumes: [WaterfallStep['id'], string, number][] = [
    ['calclab', 'CalcLab (thin flight, walls at both ends, static repose)', area(0, i.reposeDeg, true) * carry],
    ['thickness', isScoop ? '+ real flight (thickness, bulletin scoop shape)' : '+ real flight thickness', area(i.flightThicknessIn, i.reposeDeg) * carry],
    ['derate', `+ moving-incline derate (${i.reposeDeg}° → ${r.gammaDynamicDeg.toFixed(0)}° repose)`, area(i.flightThicknessIn, r.gammaDynamicDeg) * carry],
    ['edges', '+ what the flight ends let spill', r.pocketVolumeIn3],
  ]

  let prev: number | null = null
  return volumes.map(([id, label, v]) => {
    const m = massPerFlight(i.densityLbFt3, i.fillPct, v)
    const step: WaterfallStep = {
      id,
      label,
      massLb: m,
      throughputLbPerHr:
        i.beltSpeedFpm !== null && i.beltSpeedFpm > 0 ? m * flightsPerMin(i.beltSpeedFpm, i.flightSpacingIn) * 60 : null,
      minSpeedFpm:
        i.targetLbPerHr !== null && i.targetLbPerHr > 0 && m > 0 ? minSpeedFpm(i.targetLbPerHr, m, i.flightSpacingIn) : null,
      deltaPct: prev === null || prev === 0 ? null : (m / prev - 1) * 100,
    }
    prev = m
    return step
  })
}
