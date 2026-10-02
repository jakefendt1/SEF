// Mass, throughput, speed and forces (plan §3.7). Canonical units:
// in, lb, ft/min, lb/h.
import type { ThroughputResult } from './types'

const DEG = Math.PI / 180

export function densityLbIn3(densityLbFt3: number): number {
  return densityLbFt3 / 1728
}

export function massPerFlight(densityLbFt3: number, fillPct: number, volumeIn3: number): number {
  return densityLbIn3(densityLbFt3) * (fillPct / 100) * volumeIn3
}

export function flightsPerMin(speedFpm: number, spacingIn: number): number {
  return (speedFpm * 12) / spacingIn
}

export function throughputLbPerHr(massLb: number, speedFpm: number, spacingIn: number): number {
  return massLb * flightsPerMin(speedFpm, spacingIn) * 60
}

export function minSpeedFpm(targetLbPerHr: number, massLb: number, spacingIn: number): number {
  return (targetLbPerHr / (massLb * 60)) * (spacingIn / 12)
}

export interface ThroughputParams {
  massLb: number
  inclineDeg: number
  spacingIn: number
  carryWidthIn: number
  beltWidthIn: number
  speedFpm: number | null
  targetLbPerHr: number | null
  inclineLengthFt: number | null
}

export function computeThroughput(p: ThroughputParams): ThroughputResult {
  const m = p.massLb
  const sinA = Math.sin(p.inclineDeg * DEG)
  const flightLoad = m * sinA
  const beltLoad = (m * 12) / p.spacingIn
  const hasSpeed = p.speedFpm !== null && p.speedFpm > 0
  const hasTarget = p.targetLbPerHr !== null && p.targetLbPerHr > 0 && m > 0
  const hasLength = p.inclineLengthFt !== null && p.inclineLengthFt > 0
  const W_total = hasLength ? beltLoad * (p.inclineLengthFt as number) : null

  return {
    massPerFlightLb: m,
    flightsPerMin: hasSpeed ? flightsPerMin(p.speedFpm as number, p.spacingIn) : null,
    throughputLbPerHr: hasSpeed ? throughputLbPerHr(m, p.speedFpm as number, p.spacingIn) : null,
    minSpeedFpm: hasTarget ? minSpeedFpm(p.targetLbPerHr as number, m, p.spacingIn) : null,
    flightLoadLbf: flightLoad,
    flightLoadLbfPerIn: p.carryWidthIn > 0 ? flightLoad / p.carryWidthIn : 0,
    beltLoadLbPerFt: beltLoad,
    // CalcLab-compatible belt-pull input: spread over the full belt width.
    areaLoadLbPerFt2: m / ((p.beltWidthIn * p.spacingIn) / 144),
    inclineProductLb: W_total,
    inclineLiftLbf: W_total === null ? null : W_total * sinA,
  }
}
