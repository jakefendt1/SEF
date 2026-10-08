// Every rule Patrick's configurator checks (validateVG, varWarn, the splice and
// max-section flags), as warnings in the same shape as the Bulk Density
// calculator's, so either tool can show them. Each fix says what to change.
import type { Warning } from '../tdBulkDensity/types'
import { formatLen, type UnitSystem } from '../tdBulkDensity/units'
import { IN, MIN_FLIGHT_SIDEWALL_GAP_MM, VGUIDE_EDGE_CLEARANCE_MM, VGUIDE_MIN_CHANNEL_MM, VGUIDE_WIDTH_MM } from './data'
import { FLIGHT_TYPES } from '../tdBulkDensity/data/flights'
import type { Series } from '../tdBulkDensity/types'
import { effective, flightMult, flightOptions, pitchMm, sidewallFootprint, type TdBelt } from './belt'
import { DRIVE_LABEL, findProduct } from './products'
import {
  edgeFeatureClearances,
  finalSpacingInfo,
  flightSegments,
  isPitchIncrement,
  laceWidthValid,
  maxSectionInfo,
  vgPositions,
} from './geometry'
import { snapToRows } from './rows'

const CITE = "Patrick's Belt Configurator v0.65"

function warn(id: string, severity: Warning['severity'], message: string, fix: string): Warning {
  return { id, severity, message, fix, cite: CITE }
}

/** A splice fix that removes no flight: a different start row or a length one row off. */
export interface SpliceFix {
  label: string
  patch: { varIndex: number; startRow: number } | { lengthMm: number }
}

export function spliceFixes(b: TdBelt, varIndex: number, system: UnitSystem): SpliceFix[] {
  const v = b.vars[varIndex]
  if (!v || !finalSpacingInfo(b, v).removed) return []
  const pitch = pitchMm(b)
  const mult = flightMult(b)
  const out: SpliceFix[] = []
  const halfStep = b.series === '8140' ? 0.5 : 1
  for (let d = halfStep; d < mult && out.length < 2; d += halfStep) {
    for (const sr of [v.startRow - d, v.startRow + d]) {
      if (sr < 1 || out.some((f) => 'varIndex' in f.patch && f.patch.startRow === sr)) continue
      const vars = b.vars.map((x, i) => (i === varIndex ? { ...x, startRow: sr } : x))
      if (!finalSpacingInfo({ ...b, vars }, vars[varIndex]).removed) out.push({ label: `Start row ${sr}`, patch: { varIndex, startRow: sr } })
    }
  }
  for (const dr of [-1, 1, -2, 2]) {
    const L = b.lengthMm + dr * pitch
    if (L > 0 && !finalSpacingInfo({ ...b, lengthMm: L }, v).removed) {
      out.push({ label: `Length ${formatLen(L / IN, system)} (${Math.round(L / pitch)} rows)`, patch: { lengthMm: L } })
      break
    }
  }
  return out
}

export function validateBelt(belt: TdBelt, system: UnitSystem = 'imperial'): Warning[] {
  const b = effective(belt)
  const out: Warning[] = []
  const L = (mm: number) => formatLen(mm / IN, system)
  const pitch = pitchMm(b)
  const many = b.vars.length > 1
  const vName = (i: number) => (many ? `Flight variation ${i + 1}` : 'Flights')
  if (!(b.widthMm > 0)) return out

  // ---- The belt's data sheet (2026 ThermoDrive Engineering Manual) ----
  const pr = findProduct(b)
  if (pr) {
    const w = b.widthMm / IN
    if (w < pr.minWidthIn - 1e-3 || w > pr.maxWidthIn + 1e-3) {
      const what = pr.drive === 'dual-lug' ? `${DRIVE_LABEL[pr.drive]} ${b.series} belts` : `${b.series} ${pr.surface} ${pr.material} belts`
      out.push(
        warn(
          'width-range',
          'error',
          `${what} are ${formatLen(pr.minWidthIn, system)} to ${formatLen(pr.maxWidthIn, system)} wide; this one is ${L(b.widthMm)}.${pr.drive === 'dual-lug' && w < pr.minWidthIn ? ' The two drive lugs are 24.13 in apart, so a narrower belt puts them at its edges.' : ''}`,
          pr.drive === 'dual-lug' && w < pr.minWidthIn ? 'Use a single-lug belt, or widen it to at least 30 in.' : 'Pick a width in that range or another belt.',
        ),
      )
    }
    if (b.joining === 'ThermoLace HDE' && Math.abs(w * 2 - Math.round(w * 2)) > 1e-3) {
      out.push(warn('lace-joining-width', 'warning', `ThermoLace HDE loops are on a 1/2 in pitch, so they can't stay centered on a ${L(b.widthMm)} belt.`, `A ${formatLen(Math.floor(w * 2) / 2, system)} or ${formatLen(Math.floor(w * 2) / 2 + 0.5, system)} belt takes the lace centered.`))
    }
  }

  // ---- Length on a whole row ----
  if (b.lengthMm > 0 && !isPitchIncrement(b)) {
    const snaps = snapToRows(b.series, b.lengthMm / IN)
    out.push(
      warn(
        'length-rows',
        'error',
        `Belt length ${L(b.lengthMm)} is ${(b.lengthMm / pitch).toFixed(2)} rows; a belt is a whole number of rows (${L(pitch)} each on ${b.series}).`,
        `Use ${snaps.map((s) => `${formatLen(s.lengthIn, system)} (${s.rows} rows)`).join(' or ')}.`,
      ),
    )
  }

  // ---- Flights ----
  if (b.flightsOn) {
    const rows = b.flightSpacingMm / pitch
    if (Math.abs(rows - Math.round(rows)) > 1e-3 || rows < 0.5) {
      const snaps = snapToRows(b.series, b.flightSpacingMm / IN)
      out.push(
        warn(
          'spacing-rows',
          'error',
          `Flight spacing ${L(b.flightSpacingMm)} isn't a whole number of ${b.series} rows (${L(pitch)}). Flights can only sit on a row.`,
          `Use ${snaps.map((s) => `${formatLen(s.lengthIn, system)} (${s.rows} rows)`).join(' or ')}.`,
        ),
      )
    }
    b.vars.forEach((v, i) => {
      const seg = flightSegments(b, v)
      if (!(v.heightMm > 0)) out.push(warn(`height-${i}`, 'warning', `${vName(i)}: enter a flight height.`, ''))
      else {
        // Flight type rules, from the manual's flight pages (p.75-77), shared with Bulk Density.
        const ft = FLIGHT_TYPES[v.flightType]
        const o = flightOptions(v.flightType)
        const h = v.heightMm / IN
        const ok = o.heightsIn ? o.heightsIn.some((x) => Math.abs(x - h) < 0.01) : h >= o.minIn - 0.01 && h <= o.maxIn + 0.01
        if (!ok) {
          out.push(
            warn(
              `flight-height-${i}`,
              'error',
              `${vName(i)}: ${ft.label}s come ${o.heightsIn ? `in ${o.heightsIn.join(', ')} in heights` : `${o.minIn} to ${o.maxIn} in high`}, not ${L(v.heightMm)} (${ft.cite}).`,
              'Pick an offered height.',
            ),
          )
        }
        if (!o.thicknessesIn.some((x) => Math.abs(x - v.thicknessMm / IN) < 0.01)) {
          out.push(warn(`flight-thickness-${i}`, 'warning', `${vName(i)}: ${ft.label}s come ${o.thicknessesIn.join(', ')} in thick.`, 'Pick an offered thickness.'))
        }
        const calcSeries = (b.series === '8126' ? 'S8026' : `S${b.series}`) as Series
        const minS = ft.minSpacingIn[calcSeries]
        if (b.flightSpacingMm / IN < minS - 0.01) {
          out.push(warn(`flight-spacing-min-${i}`, 'error', `${vName(i)}: ${ft.label}s on ${b.series} need at least ${formatLen(minS, system)} spacing (${ft.cite}).`, 'Increase the spacing.'))
        }
        const longest = Math.max(0, ...seg.segs.map(([a, c]) => c - a))
        if (longest / IN > o.maxLengthIn + 0.01) {
          out.push(warn(`flight-length-${i}`, 'error', `${vName(i)}: a flight piece is ${L(longest)} long; ${ft.label}s are ${formatLen(o.maxLengthIn, system)} max (p.75).`, 'Add a notch or ask Customer Service about multiple flights across the width.'))
        }
      }
      if (seg.over) {
        const what =
          v.notchOn && v.notchMode === 'position'
            ? 'notches overlap, fall outside the indents, or run past the usable width'
            : v.notchOn && v.notchMode === 'even'
              ? `${v.notchCount} notches of ${L(v.notchWMm)} don't fit between the indents`
              : v.notchOn
                ? 'the flight and notch widths add up to more than the usable width'
                : 'the indents leave no flight'
        out.push(warn(`notch-over-${i}`, 'error', `${vName(i)}: ${what}.`, 'Narrow or remove notches, or reduce the indents.'))
      }
      if (b.sidewallsOn) {
        const edge = b.sidewallInsetMm + sidewallFootprint(b).fp
        const need = edge + MIN_FLIGHT_SIDEWALL_GAP_MM
        const short: string[] = []
        if (v.indentLMm - edge < MIN_FLIGHT_SIDEWALL_GAP_MM - 1e-6) short.push('left')
        if (b.sidewallsBoth && v.indentRMm - edge < MIN_FLIGHT_SIDEWALL_GAP_MM - 1e-6) short.push('right')
        if (short.length) {
          out.push(
            warn(
              `sidewall-gap-${i}`,
              'error',
              `${vName(i)}: the ${short.join(' and ')} flight end${short.length > 1 ? 's are' : ' is'} closer than ${L(MIN_FLIGHT_SIDEWALL_GAP_MM)} to the sidewall.`,
              `Set the flight indent to at least ${L(need)} (sidewall inset + ${L(sidewallFootprint(b).fp)} footprint + ${L(MIN_FLIGHT_SIDEWALL_GAP_MM)} gap).`,
            ),
          )
        }
      }
      if (b.lengthMm > 0) {
        const info = finalSpacingInfo(b, v)
        if (info.removed) {
          const fixes = spliceFixes(b, i, system)
          out.push(
            warn(
              `splice-${i}`,
              'warning',
              `${vName(i)}: the flight at row ${+info.removed.row.toFixed(2)} ${info.removed.reason}, so it's left off.${info.finalGapMm !== undefined ? ` The gap across the splice is ${L(info.finalGapMm)} instead of ${L(info.spacingMm)}.` : ''}`,
              fixes.length
                ? `To keep it: ${fixes.map((f) => f.label.toLowerCase()).join(', or ')}.`
                : 'Change the start row or the belt length by a row.',
            ),
          )
        }
      }
    })
  }

  // ---- V-guides ----
  if (b.vgOn) {
    const pos = vgPositions(b)
    const VGW = VGUIDE_WIDTH_MM
    if (b.vgCount === 4) {
      if (pos.some((p, i) => i > 0 && p - pos[i - 1] <= 0)) out.push(warn('vg-order', 'error', 'The outer and inner pair spacings put the V-guides out of order.', 'Make the outer spacing larger than the inner.'))
      else if (b.vgInnerSpMm >= b.vgOuterSpMm) out.push(warn('vg-pairs', 'warning', 'The inner pair spacing is normally less than the outer.', ''))
    }
    if (pos.length && pos[0] - VGW / 2 < -1e-6) out.push(warn('vg-left', 'error', 'The left-most V-guide is off the belt.', 'Increase its indent or reduce the spacing.'))
    if (pos.length && pos[pos.length - 1] + VGW / 2 > b.widthMm + 1e-6) out.push(warn('vg-right', 'error', 'The right-most V-guide is off the belt.', 'Increase its indent or reduce the spacing.'))
    for (let i = 0; i < pos.length - 1; i++) {
      const gap = pos[i + 1] - pos[i] - VGW
      if (gap < VGUIDE_MIN_CHANNEL_MM - 1e-6) {
        out.push(warn(`vg-channel-${i}`, 'error', `V-guide channel ${i + 1} is ${L(Math.max(gap, 0))}; the minimum is ${L(VGUIDE_MIN_CHANNEL_MM)}.`, 'Widen the channel or use fewer guides.'))
      }
    }
    for (const side of ['L', 'R'] as const) {
      for (const { feature, gapMm } of edgeFeatureClearances(b, side)) {
        const s = side === 'L' ? 'left' : 'right'
        if (gapMm < -1e-6) out.push(warn(`vg-hit-${side}-${feature}`, 'error', `The ${s} V-guide runs into the ${feature} by ${L(-gapMm)}.`, `Leave at least ${L(VGUIDE_EDGE_CLEARANCE_MM)} between them.`))
        else if (gapMm < VGUIDE_EDGE_CLEARANCE_MM - 1e-6) out.push(warn(`vg-clear-${side}-${feature}`, 'error', `The ${s} V-guide is ${L(gapMm)} from the ${feature}; the minimum is ${L(VGUIDE_EDGE_CLEARANCE_MM)}.`, 'Move the guide or the feature.'))
      }
    }
  }

  // ---- Max section length ----
  const msi = maxSectionInfo(b)
  if (msi.ft === null) {
    out.push(warn('section-none', 'error', `The tallest feature is ${msi.tallestIn.toFixed(2)} in: there's no standard max section length over 6 in.`, 'Check with engineering.'))
  } else if (b.lengthMm > 0 && b.lengthMm > msi.m! * 1000 + 1e-6) {
    out.push(
      warn(
        'section-max',
        'warning',
        `The belt is longer than one section can be: ${msi.ft} ft / ${msi.m} m max with features ${msi.label}.`,
        'Split it into sections on the Sections tab.',
      ),
    )
  }
  return out
}

/** Repair (ThermoLace) checks: the width must be a 1/2 in multiple. */
export function validateRepair(belt: TdBelt, system: UnitSystem = 'imperial'): Warning[] {
  if (!(belt.widthMm > 0) || laceWidthValid(belt.widthMm)) return []
  const w = belt.widthMm / IN
  const lo = Math.floor(w * 2) / 2
  return [
    warn(
      'lace-width',
      'warning',
      `ThermoLace loops are on a 1/2 in pitch, so they can't stay centered on a ${formatLen(w, system)} belt.`,
      `A ${formatLen(lo, system)} or ${formatLen(lo + 0.5, system)} belt takes the lace centered.`,
    ),
  ]
}

