// Manual rules -> warnings (plan §4.3, §4.4, §6), and the option lists the
// UI's dropdowns are built from.
//
// The dropdown filters and the validator both read this file, so they cannot
// drift apart -- the same lesson as REQUIRED_RULES in the Spiral Eval form.
import { fromCalculatorSeries } from '../thermodrive/data'
import { offRowSnaps, pitchIn } from '../thermodrive/rows'
import { FLIGHT_TYPES } from './data/flights'
import {
  CENTER_NOTCH_ADVICE_WIDTH_IN,
  CONTAINMENT_CLEARANCE_IN,
  GUSSET_MIN_WIDTH_IN,
  LIMITER_CLEARANCE_IN,
  MAX_DYNAMIC_DERATE_DEG,
  MAX_SIDEWALL_BELT_WIDTH_IN,
  MIN_INDENT_IN,
  MIN_SIDEWALL_GAP_IN,
  MIN_SIDEWALL_INDENT_IN,
  ROLLER_LIMITER_MIN_IN,
  RVT_MAX_INCLINE_DEG,
  SIDEWALL_SPLICE_SPACE_IN,
} from './data/indents'
import {
  SEALED_POCKET,
  findSidewall,
  sidewallHeights,
  sidewallPitches,
} from './data/sidewalls'
import { formatLen, formatQty, type UnitSystem } from './units'
import type {
  Containment,
  GeometricCase,
  PocketLoad,
  Series,
  SidewallPitch,
  TdInputs,
  Warning,
  WidthModel,
} from './types'

export interface AvailableOptions {
  /** Fixed heights, or null for any height within the range. */
  flightHeights: number[] | null
  flightHeightRange: [number, number]
  thicknesses: number[]
  minSpacingIn: number
  maxFlightLengthIn: number
  containments: { value: Containment; enabled: boolean; reason?: string }[]
  sidewallPitches: SidewallPitch[]
  sidewallHeights: number[]
}

export const S8026_SIDEWALL_MESSAGE =
  'No synchronized sidewall offering listed for S8026 — confirm with Customer Service.'

export function sidewallsOffered(series: Series): boolean {
  return sidewallPitches(series).length > 0
}

export function sealedReason(series: Series, inputs?: Pick<TdInputs, 'flightType'>): string | undefined {
  if (!SEALED_POCKET.series.includes(series)) return 'Sealed Pocket is S8050 and S8140 Flat Top only.'
  if (inputs && inputs.flightType !== 'deg90') return 'Sealed Pocket takes 90-degree flights only.'
  return undefined
}

export function availableOptions(
  inputs: Pick<TdInputs, 'series' | 'flightType' | 'sidewallPitch'>,
): AvailableOptions {
  const ft = FLIGHT_TYPES[inputs.flightType]
  const pitches = sidewallPitches(inputs.series)
  const pitch = pitches.includes(inputs.sidewallPitch) ? inputs.sidewallPitch : pitches[0]
  const sealed = sealedReason(inputs.series, inputs)
  return {
    flightHeights: ft.heights,
    flightHeightRange: [ft.minHeightIn, ft.maxHeightIn],
    thicknesses: ft.thicknessesIn,
    minSpacingIn: ft.minSpacingIn[inputs.series],
    maxFlightLengthIn: ft.maxLengthIn,
    containments: [
      { value: 'open', enabled: true },
      { value: 'guards', enabled: true },
      {
        value: 'sidewalls',
        enabled: sidewallsOffered(inputs.series),
        reason: sidewallsOffered(inputs.series) ? undefined : S8026_SIDEWALL_MESSAGE,
      },
      { value: 'sealed', enabled: !sealed, reason: sealed },
    ],
    sidewallPitches: pitches,
    sidewallHeights: pitch ? sidewallHeights(inputs.series, pitch) : [],
  }
}

export interface RuleContext {
  width: WidthModel
  geometricCase: GeometricCase | null
  /** Edge loss vs walls at both ends, %, when the heap was computed. */
  edgeLossPct: number | null
  minSpeedFpm: number | null
  profileVerified: boolean
  /** The application's load per pocket, when computed. */
  load?: PocketLoad | null
}

/**
 * Length comparisons allow 0.01 in, so a metric user typing the manual's own
 * millimetre figure (99 mm for the 3.9 in minimum spacing = 3.898 in) is not
 * told they are below it.
 */
const LEN_TOL = 0.01

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 } as const

export function buildWarnings(
  inputs: TdInputs,
  ctx: RuleContext,
  system: UnitSystem = 'imperial',
): Warning[] {
  const out: Warning[] = []
  const len = (v: number) => formatLen(v, system)
  const add = (w: Warning) => out.push(w)

  const ft = FLIGHT_TYPES[inputs.flightType]
  const W_f = ctx.width.flightWidthIn
  const hasSidewalls = inputs.containment === 'sidewalls' || inputs.containment === 'sealed'
  const iReq = Math.max(MIN_INDENT_IN, inputs.holdDownWidthIn + LIMITER_CLEARANCE_IN)

  // ---------------------------------------------------------------- errors

  if (W_f <= 0) {
    add({
      id: 'no-flight-width',
      severity: 'error',
      message: `The indents${hasSidewalls ? ' and sidewalls' : ''} use up the whole ${len(inputs.beltWidthIn)} belt — there is no flight width left.`,
      cite: '',
      fix: 'Check the belt width, or reduce the indents.',
    })
  }

  const [hMin, hMax] = [ft.minHeightIn, ft.maxHeightIn]
  const heightOk = ft.heights
    ? ft.heights.some((h) => Math.abs(h - inputs.flightHeightIn) < 1e-6)
    : inputs.flightHeightIn >= hMin - LEN_TOL && inputs.flightHeightIn <= hMax + LEN_TOL
  if (!heightOk && !inputs.profileOverride) {
    add({
      id: 'flight-height',
      severity: 'error',
      message: ft.heights
        ? `${ft.label}s come in ${ft.heights.join(', ')} in heights, not ${len(inputs.flightHeightIn)} (${ft.cite}).`
        : `${ft.label}s can be cut from ${len(hMin)} to ${len(hMax)} high, not ${len(inputs.flightHeightIn)} (${ft.cite}).`,
      cite: ft.cite,
      fix: 'Pick an available height.',
    })
  }

  const minS = ft.minSpacingIn[inputs.series]
  if (inputs.flightSpacingIn < minS - LEN_TOL) {
    add({
      id: 'spacing-min',
      severity: 'error',
      message: `Flight spacing ${len(inputs.flightSpacingIn)} is below the ${len(minS)} minimum for ${ft.label.toLowerCase()}s on ${inputs.series} (${ft.cite}).`,
      cite: ft.cite,
      fix: `Increase spacing to at least ${len(minS)}${inputs.series === 'S8140' ? ' (or 2 rows)' : ''}.`,
    })
  }

  // Flights sit on belt rows, so spacing is a whole number of pitches
  // (Patrick's configurator snaps it; lib/thermodrive/rows.ts).
  const snaps = offRowSnaps(fromCalculatorSeries(inputs.series), inputs.flightSpacingIn)
  if (snaps) {
    add({
      id: 'spacing-rows',
      severity: 'warning',
      message: `Flight spacing ${len(inputs.flightSpacingIn)} isn't a whole number of ${inputs.series} rows (${len(pitchIn(fromCalculatorSeries(inputs.series)))} each). Flights can only sit on a row.`,
      cite: '',
      fix: `Use ${snaps.map((x) => `${len(x.lengthIn)} (${x.rows} rows)`).join(' or ')}.`,
    })
  }

  if (W_f > ft.maxLengthIn + LEN_TOL) {
    add({
      id: 'flight-length',
      severity: 'error',
      message: `Flight width ${len(W_f)} is over the ${len(ft.maxLengthIn)} maximum flight length for ${ft.label.toLowerCase()}s (p.75).`,
      cite: 'p.75',
      fix: 'Use a narrower belt or larger indents, or ask Customer Service about multiple flights across the width.',
    })
  }

  if (!hasSidewalls) {
    for (const [side, v] of [
      ['Left', inputs.indentLeftIn],
      ['Right', inputs.indentRightIn],
    ] as const) {
      if (v < MIN_INDENT_IN - LEN_TOL) {
        add({
          id: `indent-min-${side.toLowerCase()}`,
          severity: 'error',
          message: `${side} indent ${len(v)} is below the ${len(MIN_INDENT_IN)} manufacturable minimum (p.75).`,
          cite: 'p.75',
          fix: `Increase to ${len(MIN_INDENT_IN)} or flag as a special order.`,
        })
      }
    }
  }

  if (hasSidewalls && !sidewallsOffered(inputs.series)) {
    add({
      id: 'sidewall-series',
      severity: 'error',
      message: S8026_SIDEWALL_MESSAGE,
      cite: 'p.78',
      fix: 'Choose S8050 or S8140, or use frame guards.',
    })
  }

  if (inputs.containment === 'sidewalls' && sidewallsOffered(inputs.series)) {
    if (inputs.beltWidthIn > MAX_SIDEWALL_BELT_WIDTH_IN + LEN_TOL) {
      add({
        id: 'sidewall-belt-width',
        severity: 'error',
        message: `Belts with sidewalls can be at most ${len(MAX_SIDEWALL_BELT_WIDTH_IN)} wide; this one is ${len(inputs.beltWidthIn)} (p.78).`,
        cite: 'p.78',
        fix: 'Narrow the belt, or ask Customer Service about Sealed Pocket for wider belts.',
      })
    }
    if (!findSidewall(inputs.series, inputs.sidewallPitch, inputs.sidewallHeightIn)) {
      add({
        id: 'sidewall-height',
        severity: 'error',
        message: `A ${len(inputs.sidewallHeightIn)} sidewall at ${inputs.sidewallPitch} pitch isn't offered on ${inputs.series} (p.79–80).`,
        cite: 'p.79–80',
        fix: 'Pick a listed sidewall height.',
      })
    }
    if (inputs.sidewallGapIn < MIN_SIDEWALL_GAP_IN - LEN_TOL) {
      add({
        id: 'sidewall-gap',
        severity: 'error',
        message: `Sidewall-to-flight gap ${len(inputs.sidewallGapIn)} is below the ${len(MIN_SIDEWALL_GAP_IN)} minimum (p.78).`,
        cite: 'p.78',
        fix: `Increase the gap to ${len(MIN_SIDEWALL_GAP_IN)}.`,
      })
    }
  }

  if (hasSidewalls && inputs.sidewallIndentIn < MIN_SIDEWALL_INDENT_IN - LEN_TOL) {
    add({
      id: 'sidewall-indent',
      severity: 'error',
      message: `Sidewall indent ${len(inputs.sidewallIndentIn)} is below the ${len(MIN_SIDEWALL_INDENT_IN)} minimum (p.78).`,
      cite: 'p.78',
      fix: `Increase to ${len(MIN_SIDEWALL_INDENT_IN)} or flag as a special order.`,
    })
  }

  if (inputs.containment === 'sealed') {
    const reason = sealedReason(inputs.series, inputs)
    if (reason) {
      add({ id: 'sealed-eligibility', severity: 'error', message: `${reason} (p.75)`, cite: 'p.75', fix: 'Choose synchronized sidewalls instead.' })
    }
    if (inputs.beltWidthIn < SEALED_POCKET.minBeltWidthIn - LEN_TOL || inputs.beltWidthIn > SEALED_POCKET.maxBeltWidthIn + LEN_TOL) {
      add({
        id: 'sealed-belt-width',
        severity: 'error',
        message: `Sealed Pocket belts are ${len(SEALED_POCKET.minBeltWidthIn)} to ${len(SEALED_POCKET.maxBeltWidthIn)} wide (p.75).`,
        cite: 'p.75',
        fix: 'Adjust the belt width, or use synchronized sidewalls.',
      })
    }
    if (inputs.flightHeightIn > SEALED_POCKET.maxHeightIn + LEN_TOL) {
      add({
        id: 'sealed-height',
        severity: 'error',
        message: `Sealed Pocket flights and sidewalls can be at most ${len(SEALED_POCKET.maxHeightIn)} high (p.75).`,
        cite: 'p.75',
        fix: `Reduce the flight height to ${len(SEALED_POCKET.maxHeightIn)} or less.`,
      })
    }
    if (W_f > SEALED_POCKET.maxFlightWidthIn + LEN_TOL) {
      add({
        id: 'sealed-flight-width',
        severity: 'error',
        message: `Sealed Pocket flights can be at most ${len(SEALED_POCKET.maxFlightWidthIn)} wide (p.75).`,
        cite: 'p.75',
        fix: 'Increase the sidewall indent or narrow the belt.',
      })
    }
  }

  if (inputs.densityLbFt3 <= 0) {
    add({ id: 'density', severity: 'error', message: 'Bulk density must be more than zero.', cite: '', fix: 'Enter the measured or typical density.' })
  }
  if (inputs.fillPct < 10 || inputs.fillPct > 100) {
    add({ id: 'fill', severity: 'error', message: 'Fill factor must be between 10% and 100%.', cite: '', fix: 'Use 75% if unsure.' })
  }
  if (inputs.reposeDeg < 0 || inputs.reposeDeg >= 90) {
    add({ id: 'repose', severity: 'error', message: 'Angle of repose must be between 0° and 90°.', cite: '', fix: 'Measure it with the repose helper.' })
  }
  if (inputs.dynamicDerateDeg < 0 || inputs.dynamicDerateDeg > MAX_DYNAMIC_DERATE_DEG) {
    add({
      id: 'derate',
      severity: 'error',
      message: `Dynamic derate must be between 0° and ${MAX_DYNAMIC_DERATE_DEG}°.`,
      cite: '',
      fix: 'Use 5° unless you have a reason not to.',
    })
  }

  // -------------------------------------------------------------- warnings

  // 0 is an answer, but almost never a true one for a bulk product: it means
  // the product flows like a liquid, and with open flight ends it all spills.
  if (inputs.reposeDeg === 0) {
    add({
      id: 'repose-zero',
      severity: 'warning',
      message: 'Angle of repose is 0°: the product would flow like a liquid. Most bulk products are 25–45°.',
      cite: '',
      fix: 'Check the value, or measure it with the repose helper.',
    })
  }

  if (inputs.rollerLimiters) {
    const indents = hasSidewalls ? [inputs.sidewallIndentIn] : [inputs.indentLeftIn, inputs.indentRightIn]
    const short = indents.some((v) => v < ROLLER_LIMITER_MIN_IN - LEN_TOL)
    const notchShort = inputs.notchCount > 0 && inputs.notchWidthIn < ROLLER_LIMITER_MIN_IN - LEN_TOL
    if (short || notchShort) {
      add({
        id: 'roller-limiter',
        severity: 'warning',
        message: `Flighted roller limiters need indents${inputs.notchCount > 0 ? ' and notches' : ''} of at least ${len(ROLLER_LIMITER_MIN_IN)}.`,
        cite: '',
        fix: `Increase ${short ? 'indents' : ''}${short && notchShort ? ' and ' : ''}${notchShort ? 'notch width' : ''} to ${len(ROLLER_LIMITER_MIN_IN)}, and confirm the rule with Customer Service.`,
      })
    }
  }

  const indentForHoldDown = hasSidewalls
    ? [inputs.sidewallIndentIn]
    : [inputs.indentLeftIn, inputs.indentRightIn]
  if (indentForHoldDown.some((v) => v >= MIN_INDENT_IN - LEN_TOL && v < iReq - LEN_TOL)) {
    add({
      id: 'holddown-clearance',
      severity: 'warning',
      message: `A ${len(inputs.holdDownWidthIn)} hold-down needs a ${len(iReq)} indent to keep ${len(LIMITER_CLEARANCE_IN)} clear of the flight${hasSidewalls ? ' and sidewall' : ''} edge (p.114, p.123).`,
      cite: 'p.114',
      fix: `Increase the indent to ${len(iReq)}.`,
    })
  }

  if (inputs.containment === 'sealed' && inputs.sidewallIndentIn < SEALED_POCKET.recommendedMinIndentIn - LEN_TOL) {
    add({
      id: 'sealed-indent',
      severity: 'warning',
      message: `Sealed Pocket's recommended minimum sidewall indent is ${len(SEALED_POCKET.recommendedMinIndentIn)} (p.75).`,
      cite: 'p.75',
      fix: `Increase the sidewall indent to ${len(SEALED_POCKET.recommendedMinIndentIn)}.`,
    })
  }

  if (inputs.containment === 'guards' && inputs.guardClearanceIn !== null && !inputs.calcLabMode) {
    if (inputs.guardClearanceIn > inputs.smallestDimIn + LEN_TOL) {
      add({
        id: 'guard-open',
        severity: 'warning',
        message: `Guard clearance ${len(inputs.guardClearanceIn)} exceeds product size ${len(inputs.smallestDimIn)}: product drops into the indent channel and slides back. Treated as open ends.`,
        cite: '',
        fix: `Close the guard to ${len(inputs.smallestDimIn)} or less, or use synchronized sidewalls.`,
      })
    }
  }

  const effectivelyOpen =
    !inputs.calcLabMode &&
    (inputs.containment === 'open' ||
      (inputs.containment === 'guards' &&
        inputs.guardClearanceIn !== null &&
        inputs.guardClearanceIn > inputs.smallestDimIn + LEN_TOL))
  if (ctx.edgeLossPct !== null && ctx.edgeLossPct >= 10) {
    const pct = Math.round(ctx.edgeLossPct)
    if (effectivelyOpen) {
      add({
        id: 'open-loss',
        severity: 'warning',
        message: `Open flight ends: ${pct}% of the pocket spills at this repose.`,
        cite: '',
        fix: sidewallsOffered(inputs.series)
          ? 'Synchronized sidewalls at flight height recover it.'
          : 'Frame guards closer than the product size recover most of it.',
      })
    } else if (inputs.containment === 'sidewalls' && inputs.sidewallHeightIn < inputs.flightHeightIn - LEN_TOL) {
      add({
        id: 'sidewall-low',
        severity: 'info',
        message: `Sidewalls below flight height: ${pct}% of the pocket still spills over them.`,
        cite: '',
        fix: 'A sidewall at flight height recovers it — see the sidewall sweep.',
      })
    }
  }

  if (inputs.containment === 'sidewalls' && inputs.sidewallGapIn > 0.5 * inputs.smallestDimIn + LEN_TOL) {
    add({
      id: 'gap-leak',
      severity: 'warning',
      message: `Sidewall-to-flight gap ${len(inputs.sidewallGapIn)} exceeds half the product size (${len(inputs.smallestDimIn)}): expect leakage along the sidewalls.`,
      cite: '',
      fix: `Keep the gap at ${len(Math.max(MIN_SIDEWALL_GAP_IN, 0.5 * inputs.smallestDimIn))} or less where possible.`,
    })
  }

  const load = ctx.load
  if (load && load.source === 'target' && inputs.beltSpeedFpm !== null && inputs.targetLbPerHr !== null) {
    const pct = Math.round(load.fraction * 100)
    const speed = formatQty(inputs.beltSpeedFpm, 'speed', system)
    const target = formatQty(inputs.targetLbPerHr, 'massRate', system)
    if (load.overCapacity) {
      add({
        id: 'over-capacity',
        severity: 'warning',
        message: `At ${speed}, carrying ${target} needs each pocket ${pct}% full — more than it can hold.`,
        cite: '',
        fix:
          load.speedForFullFpm !== null
            ? `Run at ${formatQty(load.speedForFullFpm, 'speed', system)} or faster (pockets brim-full), allow for the fill factor on top, or add containment.`
            : 'Run faster or add containment.',
      })
    } else if (load.fraction > inputs.fillPct / 100 + 1e-9) {
      add({
        id: 'above-fill',
        severity: 'warning',
        message: `At ${speed}, carrying ${target} needs pockets ${pct}% full — more than the ${inputs.fillPct}% fill factor allows for.`,
        cite: '',
        fix:
          ctx.minSpeedFpm !== null
            ? `Run at ${formatQty(ctx.minSpeedFpm, 'speed', system)} or faster to stay within the fill factor.`
            : 'Run faster to stay within the fill factor.',
      })
    }
  }

  if (!ctx.profileVerified) {
    add({
      id: 'unverified-profile',
      severity: 'warning',
      message: 'Profile unverified at this height. Results are an estimate until the profile is confirmed.',
      cite: '',
      fix: 'Confirm the flight profile against Intralox CAD.',
    })
  }

  // ------------------------------------------------------------------ info

  if (inputs.calcLabMode) {
    add({
      id: 'calclab',
      severity: 'info',
      message: 'CalcLab-equivalent mode: walls at both flight ends and no dynamic derate.',
      cite: '',
      fix: 'Turn it off for the edge-containment result.',
    })
  }

  if (ctx.geometricCase === 'meets') {
    add({ id: 'case-meets', severity: 'info', message: 'Product surface meets the next flight (CalcLab intersection flag). Handled correctly — not an error.', cite: '', fix: '' })
  } else if (ctx.geometricCase === 'level') {
    // The product won't slide back against the flight, so the model fills the
    // pocket only level with the flight tips: anything heaped above them isn't
    // counted (it isn't held -- it falls off over the head shaft). So the
    // pocket area stops growing here while mass per flight can still rise as
    // less spills off the open ends. Say so, so the two don't look like a bug.
    const repose = inputs.calcLabMode ? inputs.reposeDeg : Math.max(0, inputs.reposeDeg - inputs.dynamicDerateDeg)
    const derated = inputs.calcLabMode || inputs.dynamicDerateDeg === 0 ? '' : ` (${inputs.reposeDeg}° less the ${inputs.dynamicDerateDeg}° dynamic allowance)`
    add({
      id: 'case-level',
      severity: 'warning',
      message:
        `Angle of repose ${repose}°${derated} is at or above the ${inputs.inclineDeg}° incline. The product won't slide back ` +
        'against the flight, so the pocket is counted only level with the flight tips; anything heaped above them is left out. ' +
        'The pocket area stops changing above this point, while mass per flight can still rise as less spills off the ends.',
      cite: '',
      fix: 'Treat the result as conservative, and confirm the repose with a measurement.',
    })
  }

  if (
    inputs.productMaxSpeedFpm !== null &&
    ctx.minSpeedFpm !== null &&
    ctx.minSpeedFpm > inputs.productMaxSpeedFpm
  ) {
    add({
      id: 'speed-max',
      severity: 'info',
      message: `Required speed ${formatQty(ctx.minSpeedFpm, 'speed', system)} is above the product's ${formatQty(inputs.productMaxSpeedFpm, 'speed', system)} maximum.`,
      cite: '',
      fix: 'Taller flights, closer spacing or sidewalls carry more per flight.',
    })
  }

  if (inputs.inclineDeg <= RVT_MAX_INCLINE_DEG) {
    add({
      id: 'rvt',
      severity: 'info',
      message: 'Flightless RVT may work here: Ribbed V-Top handles bulk product up to 30° without flights (p.13).',
      cite: 'p.13',
      fix: '',
    })
  }

  if (W_f > CENTER_NOTCH_ADVICE_WIDTH_IN) {
    add({
      id: 'center-notch',
      severity: 'info',
      message: 'Contact Customer Service for center notch recommendation (flights wider than 24 in, p.75).',
      cite: 'p.75',
      fix: '',
    })
  }

  if (inputs.flightType === 'scoop' && W_f > 32) {
    add({
      id: 'scoop-length',
      severity: 'info',
      message: 'Cold Use, Dura and polyurethane Embedded Diamond scoops are limited to 32 in (p.75).',
      cite: 'p.75',
      fix: '',
    })
  }

  if (inputs.series !== 'S8026' && W_f >= GUSSET_MIN_WIDTH_IN) {
    add({
      id: 'gusset',
      severity: 'info',
      message: 'Gussets are available on S8050/S8140 flights 7 in or wider, for heavily loaded applications (p.77).',
      cite: 'p.77',
      fix: '',
    })
  }

  if (inputs.containment === 'sidewalls') {
    const sw = findSidewall(inputs.series, inputs.sidewallPitch, inputs.sidewallHeightIn)
    if (sw) {
      add({
        id: 'sidewall-data',
        severity: 'info',
        message: `${len(sw.heightIn)} sidewall: min sprocket ${sw.minSprocket}; min backbend ${len(sw.backbendHighWrapIn)} high wrap / ${len(sw.backbendLowWrapIn)} low wrap${sw.note ? `. ${sw.note}` : ''} (${inputs.series === 'S8050' ? 'p.79' : 'p.80'}).`,
        cite: inputs.series === 'S8050' ? 'p.79' : 'p.80',
        fix: '',
      })
    }
  }
  if (hasSidewalls) {
    // The corrugation is a sine wave; product in its folds and in the gap is
    // real but not reliably held, so the engine takes the footprint's inner
    // edge as a flat wall at the flight ends. Say so -- it's a choice.
    const gap = ctx.width.left.gapIn
    add({
      id: 'sidewall-corrugation',
      severity: 'info',
      message: `Pocket taken as square at the flight ends: product in the sidewall corrugations${gap > 0 ? ` and the ${len(gap)} sidewall-to-flight gap` : ''} isn't counted, so these numbers are on the conservative side.`,
      cite: '',
      fix: '',
    })
    add({
      id: 'sidewall-splice',
      severity: 'info',
      message: `Sidewall belts with flights need ${len(SIDEWALL_SPLICE_SPACE_IN)} between flights at field-splice locations (p.75).`,
      cite: 'p.75',
      fix: '',
    })
  }

  add({
    id: 'limiter-position',
    severity: 'info',
    message: 'Position limiters at flight notches on the drive end, aligned with the sprocket. Do not use hold-down shoes for belt containment; use UHMW hold-down components at transitions (p.114).',
    cite: 'p.114',
    fix: '',
  })
  add({
    id: 'containment-clearance',
    severity: 'info',
    message: `Keep at least ${len(CONTAINMENT_CLEARANCE_IN)} between the belt and containment components (p.114).`,
    cite: 'p.114',
    fix: '',
  })

  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}
