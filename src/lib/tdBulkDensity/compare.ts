// A/B compare (plan §7.5): what changed between the pinned configuration (A)
// and the live one (B), and what it bought.
import type { TdComputed } from './compute'
import { FLIGHT_TYPES } from './data/flights'
import type { Containment, TdInputs } from './types'
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
