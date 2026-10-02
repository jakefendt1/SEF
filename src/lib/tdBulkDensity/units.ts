// Unit conversion at the UI edge. The engine works in canonical units (in, lb,
// ft/min, lb/h); everything a person reads or types goes through here.
import { MM_PER_IN } from '../measurement'

export type UnitSystem = 'imperial' | 'metric'

export type Quantity =
  | 'length'
  | 'lengthFt'
  | 'density'
  | 'massRate'
  | 'speed'
  | 'mass'
  | 'force'
  | 'forcePerLen'
  | 'area'
  | 'volume'
  | 'pressure'
  | 'linearLoad'
  | 'areaLoad'
  | 'angle'
  | 'pct'
  | 'count'
  | 'perMin'

const LB_KG = 0.45359237
const FT_M = 0.3048
const LBF_N = 4.4482216152605

interface QuantityDef {
  factor: number
  imperial: string
  metric: string
  dpImperial: number
  dpMetric: number
}

const DEFS: Record<Quantity, QuantityDef> = {
  length: { factor: MM_PER_IN, imperial: 'in', metric: 'mm', dpImperial: 2, dpMetric: 0 },
  lengthFt: { factor: FT_M, imperial: 'ft', metric: 'm', dpImperial: 1, dpMetric: 2 },
  density: { factor: 16.0185, imperial: 'lb/ft³', metric: 'kg/m³', dpImperial: 1, dpMetric: 0 },
  massRate: { factor: LB_KG, imperial: 'lb/h', metric: 'kg/h', dpImperial: 0, dpMetric: 0 },
  speed: { factor: FT_M, imperial: 'ft/min', metric: 'm/min', dpImperial: 1, dpMetric: 1 },
  mass: { factor: LB_KG, imperial: 'lb', metric: 'kg', dpImperial: 3, dpMetric: 3 },
  force: { factor: LBF_N, imperial: 'lbf', metric: 'N', dpImperial: 3, dpMetric: 2 },
  forcePerLen: { factor: LBF_N / MM_PER_IN, imperial: 'lbf/in', metric: 'N/mm', dpImperial: 3, dpMetric: 4 },
  area: { factor: 6.4516, imperial: 'in²', metric: 'cm²', dpImperial: 2, dpMetric: 1 },
  volume: { factor: 16.387064, imperial: 'in³', metric: 'cm³', dpImperial: 1, dpMetric: 0 },
  pressure: { factor: 6.894757, imperial: 'psi', metric: 'kPa', dpImperial: 4, dpMetric: 3 },
  linearLoad: { factor: LB_KG / FT_M, imperial: 'lb/ft', metric: 'kg/m', dpImperial: 3, dpMetric: 3 },
  areaLoad: { factor: LB_KG / (FT_M * FT_M), imperial: 'lb/ft²', metric: 'kg/m²', dpImperial: 3, dpMetric: 2 },
  angle: { factor: 1, imperial: '°', metric: '°', dpImperial: 1, dpMetric: 1 },
  pct: { factor: 1, imperial: '%', metric: '%', dpImperial: 0, dpMetric: 0 },
  count: { factor: 1, imperial: '', metric: '', dpImperial: 0, dpMetric: 0 },
  perMin: { factor: 1, imperial: '/min', metric: '/min', dpImperial: 1, dpMetric: 1 },
}

export function unitLabel(q: Quantity, system: UnitSystem): string {
  return DEFS[q][system]
}

export function fromCanonical(value: number, q: Quantity, system: UnitSystem): number {
  return system === 'metric' ? value * DEFS[q].factor : value
}

export function toCanonical(value: number, q: Quantity, system: UnitSystem): number {
  return system === 'metric' ? value / DEFS[q].factor : value
}

export function decimalsFor(q: Quantity, system: UnitSystem): number {
  return system === 'metric' ? DEFS[q].dpMetric : DEFS[q].dpImperial
}

/** Round without trailing zeros -- for putting a number back into an input box. */
export function trimNumber(value: number, dp: number): string {
  return String(Number.parseFloat(value.toFixed(dp)))
}

/** Display a canonical value in the chosen system, with thousands separators and unit. */
export function formatQty(
  value: number,
  q: Quantity,
  system: UnitSystem,
  opts: { dp?: number; unit?: boolean } = {},
): string {
  const v = fromCanonical(value, q, system)
  const dp = opts.dp ?? decimalsFor(q, system)
  const text = v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })
  if (opts.unit === false) return text
  const u = unitLabel(q, system)
  if (!u) return text
  return u === '°' || u === '%' || u.startsWith('/') ? `${text}${u}` : `${text} ${u}`
}

/** Short length for warning text: trims trailing zeros. */
export function formatLen(inches: number, system: UnitSystem): string {
  const v = fromCanonical(inches, 'length', system)
  const dp = system === 'metric' ? 1 : 3
  return `${trimNumber(v, dp)} ${unitLabel('length', system)}`
}
