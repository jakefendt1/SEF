// A/B compare (plan §7.5): what changed between the pinned configuration (A)
// and the live one (B), and what it bought.
import type { TdComputed } from './compute'
import { FLIGHT_TYPES } from './data/flights'
import type { Containment, TdInputs } from './types'
import { densityLbIn3 } from './throughput'
import { formatLen, formatQty, type UnitSystem } from './units'

const CONTAINMENT_NAME: Record<Containment, string> = {
  open: 'Open ends',
  guards: 'Frame guards',
  sidewalls: 'Sidewalls',
  sealed: 'Sealed Pocket',
}

/** Short description of the edge treatment, e.g. "Sidewalls 4 in". */
export function containmentLabel(i: TdInputs, system: UnitSystem): string {
  if (i.calcLabMode) return 'CalcLab mode (walls)'
  if (i.containment === 'sidewalls') return `Sidewalls ${formatLen(i.sidewallHeightIn, system)}`
  if (i.containment === 'guards') {
    return i.guardClearanceIn === null ? 'Frame guards' : `Guards at ${formatLen(i.guardClearanceIn, system)}`
  }
  return CONTAINMENT_NAME[i.containment]
}

/** The inputs that differ, in plain words ("Spacing 8 in → 6 in"). */
export function inputChanges(a: TdInputs, b: TdInputs, system: UnitSystem): string[] {
  const out: string[] = []
  const len = (v: number) => formatLen(v, system)
  const cmp = (label: string, va: unknown, vb: unknown, fa: string, fb: string) => {
    if (va !== vb) out.push(`${label} ${fa} → ${fb}`)
  }
  cmp('Series', a.series, b.series, a.series, b.series)
  cmp('Belt width', a.beltWidthIn, b.beltWidthIn, len(a.beltWidthIn), len(b.beltWidthIn))
  cmp('Incline', a.inclineDeg, b.inclineDeg, `${a.inclineDeg}°`, `${b.inclineDeg}°`)
  cmp('Flight', a.flightType, b.flightType, FLIGHT_TYPES[a.flightType].shortLabel, FLIGHT_TYPES[b.flightType].shortLabel)
  cmp('Flight height', a.flightHeightIn, b.flightHeightIn, len(a.flightHeightIn), len(b.flightHeightIn))
  cmp('Spacing', a.flightSpacingIn, b.flightSpacingIn, len(a.flightSpacingIn), len(b.flightSpacingIn))
  const ca = containmentLabel(a, system)
  const cb = containmentLabel(b, system)
  if (ca !== cb) out.push(`${ca} → ${cb}`)
  cmp('Notches', a.notchCount, b.notchCount, String(a.notchCount), String(b.notchCount))
  cmp('Density', a.densityLbFt3, b.densityLbFt3, formatQty(a.densityLbFt3, 'density', system), formatQty(b.densityLbFt3, 'density', system))
  cmp('Repose', a.reposeDeg, b.reposeDeg, `${a.reposeDeg}°`, `${b.reposeDeg}°`)
  cmp('Fill', a.fillPct, b.fillPct, `${a.fillPct}%`, `${b.fillPct}%`)
  cmp('Derate', a.dynamicDerateDeg, b.dynamicDerateDeg, `${a.dynamicDerateDeg}°`, `${b.dynamicDerateDeg}°`)
  if (a.beltSpeedFpm !== b.beltSpeedFpm && a.beltSpeedFpm !== null && b.beltSpeedFpm !== null) {
    out.push(`Speed ${formatQty(a.beltSpeedFpm, 'speed', system)} → ${formatQty(b.beltSpeedFpm, 'speed', system)}`)
  }
  return out
}

export interface CompareSummary {
  changes: string[]
  /** One sentence, e.g. "Sidewalls 4 in: 835 → 4,683 lb/h at 60 ft/min (+461%); …" */
  summary: string
  throughputPct: number | null
}

export function compareRuns(A: TdComputed, B: TdComputed, system: UnitSystem): CompareSummary {
  const changes = inputChanges(A.inputs, B.inputs, system)
  const ta = A.throughput
  const tb = B.throughput
  const parts: string[] = []
  let throughputPct: number | null = null

  if (ta && tb && ta.throughputLbPerHr !== null && tb.throughputLbPerHr !== null) {
    throughputPct = ta.throughputLbPerHr > 0 ? (tb.throughputLbPerHr / ta.throughputLbPerHr - 1) * 100 : null
    const sameSpeed = A.inputs.beltSpeedFpm === B.inputs.beltSpeedFpm
    const pct = throughputPct === null ? '' : ` (${throughputPct >= 0 ? '+' : ''}${throughputPct.toFixed(0)}%)`
    parts.push(
      `${formatQty(ta.throughputLbPerHr, 'massRate', system, { unit: false })} → ${formatQty(tb.throughputLbPerHr, 'massRate', system)}` +
        (sameSpeed ? ` at ${formatQty(B.inputs.beltSpeedFpm as number, 'speed', system)}` : '') +
        pct,
    )
  } else if (ta && tb) {
    const pct = ta.massPerFlightLb > 0 ? (tb.massPerFlightLb / ta.massPerFlightLb - 1) * 100 : null
    parts.push(
      `${formatQty(ta.massPerFlightLb, 'mass', system, { unit: false })} → ${formatQty(tb.massPerFlightLb, 'mass', system)} per flight` +
        (pct === null ? '' : ` (${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%)`),
    )
  }
  if (
    ta?.minSpeedFpm != null &&
    tb?.minSpeedFpm != null &&
    A.inputs.targetLbPerHr === B.inputs.targetLbPerHr
  ) {
    const verb = tb.minSpeedFpm < ta.minSpeedFpm ? 'drops' : 'rises'
    parts.push(
      `min speed for ${formatQty(B.inputs.targetLbPerHr as number, 'massRate', system)} ${verb} from ${formatQty(ta.minSpeedFpm, 'speed', system, { unit: false, dp: 0 })} to ${formatQty(tb.minSpeedFpm, 'speed', system, { dp: 0 })}`,
    )
  }

  const lead = changes.length === 0 ? 'No input changes' : changes.length === 1 ? changes[0] : `${changes.length} changes`
  return {
    changes,
    summary: parts.length ? `${lead}: ${parts.join('; ')}.` : `${lead}.`,
    throughputPct,
  }
}

/** One row of the side-by-side table. */
export interface CompareRow {
  label: string
  a: string
  b: string
  /** Inputs: true when A and B differ. Results: the change as text ("+25%"). */
  changed: boolean
  delta: string | null
  /** Results only: is B's change good news? null when neither (or not a result). */
  better: boolean | null
}

export interface CompareTable {
  inputs: CompareRow[]
  results: CompareRow[]
}

const DASH = '—'

function pct(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || !(Math.abs(a) > 1e-9)) return null
  return (b / a - 1) * 100
}

/**
 * Every input and headline result for A and B side by side, e.g. a 24 in vs a
 * 30 in belt for the same product. Inputs flag what differs; results give the
 * change from A to B and whether it's an improvement.
 */
export function compareTable(A: TdComputed, B: TdComputed, system: UnitSystem): CompareTable {
  const a = A.inputs
  const b = B.inputs
  const len = (v: number) => formatLen(v, system)
  const inputRow = (label: string, fa: string, fb: string): CompareRow => ({
    label,
    a: fa,
    b: fb,
    changed: fa !== fb,
    delta: null,
    better: null,
  })
  const speed = (v: number | null) => (v === null ? DASH : formatQty(v, 'speed', system))
  const rate = (v: number | null) => (v === null ? DASH : formatQty(v, 'massRate', system))
  const inputs: CompareRow[] = [
    inputRow('Series', a.series, b.series),
    inputRow('Belt width', len(a.beltWidthIn), len(b.beltWidthIn)),
    inputRow('Incline', `${a.inclineDeg}°`, `${b.inclineDeg}°`),
    inputRow('Flight', FLIGHT_TYPES[a.flightType].shortLabel, FLIGHT_TYPES[b.flightType].shortLabel),
    inputRow('Flight height', len(a.flightHeightIn), len(b.flightHeightIn)),
    inputRow('Flight spacing', len(a.flightSpacingIn), len(b.flightSpacingIn)),
    inputRow('Flight ends', containmentLabel(a, system), containmentLabel(b, system)),
    inputRow('Notches', String(a.notchCount), String(b.notchCount)),
    inputRow('Density', formatQty(a.densityLbFt3, 'density', system), formatQty(b.densityLbFt3, 'density', system)),
    inputRow('Repose', `${a.reposeDeg}°`, `${b.reposeDeg}°`),
    inputRow('Fill', `${a.fillPct}%`, `${b.fillPct}%`),
    inputRow('Belt speed', speed(a.beltSpeedFpm), speed(b.beltSpeedFpm)),
    inputRow('Target', rate(a.targetLbPerHr), rate(b.targetLbPerHr)),
  ]

  /** A result row. `higherIsBetter` null means the change is neither good nor bad. */
  const resultRow = (
    label: string,
    va: number | null | undefined,
    vb: number | null | undefined,
    fmt: (v: number) => string,
    higherIsBetter: boolean | null,
    /** Already a percentage: give the change in points, not percent of a percent. */
    points = false,
  ): CompareRow => {
    const p = points ? (va != null && vb != null ? vb - va : null) : pct(va, vb)
    const changed = va != null && vb != null ? fmt(va) !== fmt(vb) : va != vb
    return {
      label,
      a: va == null ? DASH : fmt(va),
      b: vb == null ? DASH : fmt(vb),
      changed,
      delta: p === null || !changed ? null : `${p >= 0 ? '+' : ''}${p.toFixed(0)}${points ? ' pts' : '%'}`,
      better: p === null || !changed || higherIsBetter === null ? null : p > 0 === higherIsBetter,
    }
  }
  const q = (k: Parameters<typeof formatQty>[1]) => (v: number) => formatQty(v, k, system)
  const ta = A.throughput
  const tb = B.throughput
  const capacity = (r: TdComputed) => densityLbIn3(r.inputs.densityLbFt3) * r.pocketVolumeIn3
  const results: CompareRow[] = [
    resultRow('Throughput at belt speed', ta?.throughputLbPerHr, tb?.throughputLbPerHr, q('massRate'), true),
    resultRow('Minimum belt speed', ta?.minSpeedFpm, tb?.minSpeedFpm, q('speed'), false),
    resultRow('Product per flight', ta?.massPerFlightLb, tb?.massPerFlightLb, q('mass'), true),
    resultRow('Pocket capacity, brim-full', A.heap ? capacity(A) : null, B.heap ? capacity(B) : null, q('mass'), true),
    resultRow('Pocket volume', A.pocketVolumeIn3, B.pocketVolumeIn3, q('volume'), true),
    resultRow('Edge loss', A.edgeLossPct, B.edgeLossPct, (v) => `${v.toFixed(0)}%`, false, true),
    resultRow('Flight load', ta?.flightLoadLbfPerIn, tb?.flightLoadLbfPerIn, q('forcePerLen'), null),
    resultRow('Product load on belt', ta?.beltLoadLbPerFt, tb?.beltLoadLbPerFt, q('linearLoad'), null),
  ]
  return { inputs, results }
}

/**
 * Column names: when exactly one input differs, name the columns by it
 * ("24 in" / "30 in"), which is how people talk about the comparison.
 */
export function compareNames(a: TdComputed, b: TdComputed | null, system: UnitSystem): { a: string; b: string } {
  if (!b) return { a: 'A', b: 'B' }
  const changed = compareTable(a, b, system).inputs.filter((r) => r.changed)
  if (changed.length !== 1) return { a: 'A', b: 'B' }
  return { a: `A · ${changed[0].a}`, b: `B · ${changed[0].b}` }
}
