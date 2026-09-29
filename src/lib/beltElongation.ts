// Belt elongation from a tape measure.
//
// The Intralox elongation ruler reads the answer directly off the belt. This
// tool is for the visit where nobody has one: count pitches, measure the span
// with a tape, compare to nominal.
//
//   elongation % = (measured span − pitches × nominal pitch)
//                  ÷ (pitches × nominal pitch) × 100
//
// Everything here is pure and works in inches. The thresholds and the wording
// that goes with them live together on purpose: a verdict sentence that drifts
// away from the number it describes is how a rep ends up telling a customer
// "you're fine" over a red gauge.

import { TAPE_RESOLUTION_IN, formatLength, type Unit } from './measurement'

/**
 * Growth in the first weeks of service. Normal, not a defect --
 * 2026 MPB Engineering Manual p. 494.
 */
export const BREAK_IN_PCT = 1

/**
 * Default "replace at" figure. The manual does not publish a replacement
 * limit, so this is a starting point the user is expected to override, and the
 * UI says so. Do not present it as an Intralox specification.
 */
export const DEFAULT_REPLACE_LIMIT_PCT = 3

/**
 * How much tape error we're willing to let through when recommending a span.
 * At 0.25% a misread of one sixteenth can't move the verdict across a band.
 */
export const TARGET_TAPE_ERROR_PCT = 0.25

export interface ElongationInput {
  nominalPitchIn: number
  pitchCount: number
  /** One entry per tape reading, in inches. Averaged. */
  readingsIn: number[]
}

export interface ElongationResult {
  nominalSpanIn: number
  /** Mean of the readings. */
  measuredSpanIn: number
  actualPitchIn: number
  elongationPct: number
  readingCount: number
  /** Widest disagreement between readings, in inches. */
  spreadIn: number
  /** ± percent that reading the tape to the nearest 1/16 in accounts for. */
  precisionPct: number
}

/**
 * Null -- not zero -- when there isn't enough to compute. A zero here would
 * render as "0.00%: within normal break-in growth", which is a confident
 * answer to a question nobody asked.
 */
export function computeElongation({
  nominalPitchIn,
  pitchCount,
  readingsIn,
}: ElongationInput): ElongationResult | null {
  const readings = readingsIn.filter((v) => Number.isFinite(v) && v > 0)
  if (!(nominalPitchIn > 0) || !(pitchCount > 0) || readings.length === 0) return null

  const nominalSpanIn = nominalPitchIn * pitchCount
  const measuredSpanIn = readings.reduce((a, b) => a + b, 0) / readings.length

  return {
    nominalSpanIn,
    measuredSpanIn,
    actualPitchIn: measuredSpanIn / pitchCount,
    elongationPct: ((measuredSpanIn - nominalSpanIn) / nominalSpanIn) * 100,
    readingCount: readings.length,
    spreadIn: Math.max(...readings) - Math.min(...readings),
    precisionPct: (TAPE_RESOLUTION_IN / nominalSpanIn) * 100,
  }
}

export type VerdictLevel = 'short' | 'normal' | 'watch' | 'replace'

export interface Verdict {
  level: VerdictLevel
  /** Three or four words, big. */
  headline: string
  /** What to do about it, in plain language. */
  detail: string
}

export function verdictFor(elongationPct: number, limitPct: number): Verdict {
  const limit = limitPct > 0 ? limitPct : DEFAULT_REPLACE_LIMIT_PCT

  if (elongationPct < 0) {
    return {
      level: 'short',
      headline: 'Shorter than nominal',
      detail:
        'A belt does not shrink. Re-count the pitches, make sure the span was under tension, and check you read the same point at both ends.',
    }
  }
  if (elongationPct >= limit) {
    return {
      level: 'replace',
      headline: 'At your replacement limit',
      detail:
        'Plan a replacement. Check take-up travel and sprocket engagement now, and confirm the limit with Modular TSG before you quote it.',
    }
  }
  if (elongationPct <= BREAK_IN_PCT) {
    return {
      level: 'normal',
      headline: 'Normal for a belt in service',
      detail:
        'This is within the 0.5–1% break-in growth the engineering manual calls normal. Nothing to do.',
    }
  }
  return {
    level: 'watch',
    headline: 'Growing — keep an eye on it',
    detail:
      'Past break-in but not at your limit. Note the reading, watch sag and sprocket engagement, and measure the same span again on your next visit.',
  }
}

/**
 * True when the readings disagree by more than the tape can explain, which in
 * practice means a miscounted pitch rather than a stretched belt.
 */
export function readingsDisagree(result: ElongationResult): boolean {
  if (result.readingCount < 2) return false
  return result.spreadIn > Math.max(2 * TAPE_RESOLUTION_IN, result.nominalSpanIn * 0.0025)
}

/**
 * How many pitches to span so a one-sixteenth misread stays under
 * `maxErrorPct`. Short spans are the single biggest source of nonsense
 * results: over three pitches of Series 1500, 1/16 in *is* 4% elongation.
 */
export function recommendedPitchCount(
  nominalPitchIn: number,
  maxErrorPct = TARGET_TAPE_ERROR_PCT,
): number {
  if (!(nominalPitchIn > 0) || !(maxErrorPct > 0)) return 0
  return Math.ceil((TAPE_RESOLUTION_IN * 100) / (maxErrorPct * nominalPitchIn))
}

/** What the tape would read at a given elongation. The field-usable number. */
export function spanAtPct(nominalSpanIn: number, pct: number): number {
  return nominalSpanIn * (1 + pct / 100)
}

/** Inches a whole belt of `totalLengthIn` has grown at this elongation. */
export function growthOverBeltIn(totalLengthIn: number, elongationPct: number): number {
  return totalLengthIn * (elongationPct / 100)
}

/**
 * Number of full pitches a belt has gained -- the practical consequence, since
 * that is what the take-up has to absorb.
 */
export function pitchesGained(
  totalLengthIn: number,
  elongationPct: number,
  nominalPitchIn: number,
): number | null {
  if (!(totalLengthIn > 0) || !(nominalPitchIn > 0)) return null
  return growthOverBeltIn(totalLengthIn, elongationPct) / nominalPitchIn
}

/**
 * The one-paragraph write-up a rep pastes into a call report or an email.
 *
 * Deliberately restates the inputs, not just the answer: a bare "3.1%" in a
 * thread six weeks later is unauditable, and the number means nothing without
 * the series, the span, and the limit it was judged against.
 */
export function summarizeResult(args: {
  result: ElongationResult
  seriesLabel: string
  pitchCount: number
  limitPct: number
  unit: Unit
  totalBeltLengthIn?: number | null
}): string {
  const { result, seriesLabel, pitchCount, limitPct, unit, totalBeltLengthIn } = args
  const verdict = verdictFor(result.elongationPct, limitPct)

  const lines = [
    `Belt elongation check — ${seriesLabel}`,
    `${result.elongationPct.toFixed(2)}% elongation (±${result.precisionPct.toFixed(2)}% tape accuracy) — ${verdict.headline.toLowerCase()}.`,
    `${pitchCount} pitches: nominal ${formatLength(result.nominalSpanIn, unit)}, measured ${formatLength(result.measuredSpanIn, unit)}${
      result.readingCount > 1 ? ` (average of ${result.readingCount} readings)` : ''
    }.`,
    `Actual pitch ${formatLength(result.actualPitchIn, unit)} vs nominal ${formatLength(result.nominalSpanIn / pitchCount, unit)}.`,
    `Judged against a ${limitPct}% replacement limit.`,
  ]

  if (totalBeltLengthIn && totalBeltLengthIn > 0) {
    lines.push(
      `Over a ${formatLength(totalBeltLengthIn, unit)} belt that is ${formatLength(
        growthOverBeltIn(totalBeltLengthIn, result.elongationPct),
        unit,
      )} of growth.`,
    )
  }

  lines.push('Measured with a tape measure, not an elongation ruler.')
  return lines.join('\n')
}
