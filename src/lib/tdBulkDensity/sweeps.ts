// Sensitivity sweeps (plan §7.4): throughput against sidewall height, incline
// angle and flight spacing. Each point is a full engine run on the sweep grid,
// so the curves come from the same model as the headline numbers.
//
// The y value is throughput at the entered belt speed when there is one, and
// product per flight otherwise -- never a throughput at an invented speed.
import { computeTdBulkDensity } from './compute'
import { FLIGHT_TYPES } from './data/flights'
import { sidewallHeights, sidewallPitches } from './data/sidewalls'
import { computePocket2D } from './pocket2d'
import { buildProfile } from './profiles'
import { sidewallsOffered } from './rules'
import { massPerFlight, throughputLbPerHr } from './throughput'
import type { Containment, TdInputs } from './types'
import { buildWidthModel } from './width'

export type SweepId = 'sidewall' | 'angle' | 'spacing'
export type YMetric = 'throughput' | 'mass'

export interface SweepPoint {
  x: number
  y: number | null
}

export interface SweepSeries {
  id: Containment | 'sidewall-height' | 'walls' | 'current'
  label: string
  points: SweepPoint[]
}

export interface Sweep {
  id: SweepId
  title: string
  /** x is an angle (°) or a length (in). */
  xKind: 'angle' | 'length'
  xLabel: string
  yMetric: YMetric
  series: SweepSeries[]
  /** Upper bound drawn as a dashed reference, not a series. */
  reference: SweepSeries | null
  /** Discrete values the user can actually pick (e.g. offered sidewall heights). */
  markers: { x: number; y: number | null }[]
  current: number | null
  /** Shade x below this as not allowed (minimum spacing). */
  disallowedBelow: number | null
  /** Why a sweep is empty, or what it assumes. */
  note: string
  /** Sidewall height used by the 'Sidewalls' line of the angle sweep, in. */
  sidewallHeightIn?: number
}

const N = 25

function range(a: number, b: number, n = N): number[] {
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))
}

export function yMetricFor(inputs: TdInputs): YMetric {
  return inputs.beltSpeedFpm !== null && inputs.beltSpeedFpm > 0 ? 'throughput' : 'mass'
}

function valueOf(inputs: TdInputs, metric: YMetric): number | null {
  const r = computeTdBulkDensity(inputs, 'sweep')
  if (r.status !== 'ok' || !r.throughput) return null
  return metric === 'throughput' ? r.throughput.throughputLbPerHr : r.throughput.massPerFlightLb
}

/** Walls at both ends, analytically: A_pocket x carry width. Exact and cheap. */
function wallsValue(inputs: TdInputs, metric: YMetric): number | null {
  const width = buildWidthModel(inputs)
  if (!(width.carryWidthIn > 0) || !(inputs.flightSpacingIn > inputs.flightThicknessIn)) return null
  const profile = buildProfile(inputs.flightType, inputs.flightHeightIn, inputs.flightThicknessIn, inputs.profileOverride)
  const gamma = inputs.calcLabMode ? inputs.reposeDeg : Math.max(0, inputs.reposeDeg - inputs.dynamicDerateDeg)
  const A = computePocket2D(profile, inputs.flightSpacingIn, inputs.inclineDeg, gamma).areaIn2
  const m = massPerFlight(inputs.densityLbFt3, inputs.fillPct, A * width.carryWidthIn)
  return metric === 'throughput' ? throughputLbPerHr(m, inputs.beltSpeedFpm as number, inputs.flightSpacingIn) : m
}

/** The sidewall height used when the sweep needs one and none is chosen. */
function defaultSidewallHeight(inputs: TdInputs): number | null {
  const pitch = sidewallPitches(inputs.series).includes(inputs.sidewallPitch)
    ? inputs.sidewallPitch
    : sidewallPitches(inputs.series)[0]
  if (!pitch) return null
  const hs = sidewallHeights(inputs.series, pitch)
  if (inputs.containment === 'sidewalls' && hs.some((h) => Math.abs(h - inputs.sidewallHeightIn) < 1e-6)) {
    return inputs.sidewallHeightIn
  }
  return hs.find((h) => h >= inputs.flightHeightIn - 1e-6) ?? hs[hs.length - 1]
}

export function sidewallSweep(inputs: TdInputs): Sweep {
  const metric = yMetricFor(inputs)
  const base: Sweep = {
    id: 'sidewall',
    title: 'Throughput vs. sidewall height',
    xKind: 'length',
    xLabel: 'Sidewall height',
    yMetric: metric,
    series: [],
    reference: null,
    markers: [],
    current: inputs.containment === 'sidewalls' ? inputs.sidewallHeightIn : null,
    disallowedBelow: null,
    note: '',
  }
  if (!sidewallsOffered(inputs.series)) {
    return { ...base, note: `No synchronized sidewall offering is listed for ${inputs.series}.` }
  }
  const pitch = sidewallPitches(inputs.series).includes(inputs.sidewallPitch)
    ? inputs.sidewallPitch
    : sidewallPitches(inputs.series)[0]
  const sw = (h: number): TdInputs => ({
    ...inputs,
    containment: 'sidewalls',
    sidewallPitch: pitch,
    sidewallHeightIn: h,
    calcLabMode: false,
  })
  const H = inputs.flightHeightIn
  const points = range(0, H + 2).map((h) => ({ x: h, y: valueOf(sw(h), metric) }))
  const markers = sidewallHeights(inputs.series, pitch).map((h) => ({
    x: h,
    y: valueOf(sw(h), metric),
  }))
  return {
    ...base,
    series: [{ id: 'sidewall-height', label: 'Sidewalls', points }],
    reference: { id: 'walls', label: 'Walls at both ends', points: points.map((p) => ({ x: p.x, y: wallsValue(sw(p.x), metric) })) },
    markers,
    note:
      inputs.containment === 'sidewalls'
        ? `Dots are the heights offered at ${pitch.replace('mm', ' mm')} pitch on ${inputs.series}.`
        : `Assumes sidewalls at ${pitch.replace('mm', ' mm')} pitch with the sidewall indent and gap from the Edges step — dots are the heights offered. The curve flattens once sidewalls reach flight height.`,
  }
}

export function angleSweep(inputs: TdInputs): Sweep {
  const metric = yMetricFor(inputs)
  const xs = range(10, 75)
  const series: SweepSeries[] = []
  const at = (over: Partial<TdInputs>) => (alpha: number) => ({ ...inputs, calcLabMode: false, ...over, inclineDeg: alpha })

  series.push({ id: 'open', label: 'Open ends', points: xs.map((a) => ({ x: a, y: valueOf(at({ containment: 'open' })(a), metric) })) })
  if (inputs.guardClearanceIn !== null) {
    series.push({
      id: 'guards',
      label: 'Frame guards',
      points: xs.map((a) => ({ x: a, y: valueOf(at({ containment: 'guards' })(a), metric) })),
    })
  }
  const swH = defaultSidewallHeight(inputs)
  if (swH !== null) {
    series.push({
      id: 'sidewalls',
      label: 'Sidewalls',
      points: xs.map((a) => ({ x: a, y: valueOf(at({ containment: 'sidewalls', sidewallHeightIn: swH })(a), metric) })),
    })
  }
  return {
    id: 'angle',
    title: 'Throughput vs. incline angle',
    xKind: 'angle',
    xLabel: 'Incline angle',
    yMetric: metric,
    series,
    reference: { id: 'walls', label: 'Walls at both ends', points: xs.map((a) => ({ x: a, y: wallsValue({ ...inputs, inclineDeg: a }, metric) })) },
    markers: [],
    sidewallHeightIn: swH ?? undefined,
    current: inputs.inclineDeg,
    disallowedBelow: null,
    note:
      inputs.guardClearanceIn === null
        ? 'No guard line: enter a guard clearance on the Edges step to add one.'
        : '',
  }
}

export function spacingSweep(inputs: TdInputs): Sweep {
  const metric = yMetricFor(inputs)
  const minS = FLIGHT_TYPES[inputs.flightType].minSpacingIn[inputs.series]
  const lo = Math.max(inputs.flightThicknessIn + 0.25, minS * 0.5)
  const hi = Math.max(inputs.flightSpacingIn * 2.5, minS * 3, inputs.flightHeightIn * 3)
  const points = range(lo, hi).map((s) => ({ x: s, y: valueOf({ ...inputs, flightSpacingIn: s }, metric) }))
  return {
    id: 'spacing',
    title: 'Throughput vs. flight spacing',
    xKind: 'length',
    xLabel: 'Flight spacing',
    yMetric: metric,
    series: [{ id: 'current', label: 'This configuration', points }],
    reference: null,
    markers: [],
    current: inputs.flightSpacingIn,
    disallowedBelow: minS,
    note:
      metric === 'throughput'
        ? 'Closer flights carry less each but pass more often; the peak is the best trade at this belt speed. Shaded: below the manual minimum.'
        : 'Shaded: below the manual minimum spacing. Enter a belt speed to see throughput, where more flights per minute count.',
  }
}

export function computeSweeps(inputs: TdInputs): Sweep[] {
  return [sidewallSweep(inputs), angleSweep(inputs), spacingSweep(inputs)]
}
