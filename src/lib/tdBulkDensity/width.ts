// Width model across the belt (plan §3.3).
//
// Carry width is the flight width, never the belt width: product in the
// indents has no flight behind it and slides back down the incline.
import { SIDEWALL_FOOTPRINT_IN } from './data/sidewalls'
import type { EndTreatment, Segment, SideBand, TdInputs, WidthModel } from './types'

export type WidthInputs = Pick<
  TdInputs,
  | 'containment'
  | 'beltWidthIn'
  | 'indentLeftIn'
  | 'indentRightIn'
  | 'sidewallIndentIn'
  | 'sidewallGapIn'
  | 'sidewallPitch'
  | 'notchCount'
  | 'notchWidthIn'
>

export function buildWidthModel(inputs: WidthInputs): WidthModel {
  const hasSidewalls = inputs.containment === 'sidewalls' || inputs.containment === 'sealed'
  let left: SideBand
  let right: SideBand

  if (hasSidewalls) {
    const band: SideBand = {
      indentIn: inputs.sidewallIndentIn,
      footprintIn: SIDEWALL_FOOTPRINT_IN[inputs.sidewallPitch],
      // A sealed pocket's flights are joined to the sidewall: no gap.
      gapIn: inputs.containment === 'sealed' ? 0 : inputs.sidewallGapIn,
    }
    left = band
    right = band
  } else {
    left = { indentIn: inputs.indentLeftIn, footprintIn: 0, gapIn: 0 }
    right = { indentIn: inputs.indentRightIn, footprintIn: 0, gapIn: 0 }
  }

  const sideTotal = (b: SideBand) => b.indentIn + b.footprintIn + b.gapIn
  const flightWidthIn = inputs.beltWidthIn - sideTotal(left) - sideTotal(right)

  const n = Math.max(0, Math.floor(inputs.notchCount))
  const wn = n > 0 ? inputs.notchWidthIn : 0
  const segW = (flightWidthIn - n * wn) / (n + 1)

  const segments: Segment[] = []
  const notches: Segment[] = []
  let z = 0
  for (let i = 0; i <= n; i++) {
    segments.push({ z0: z, z1: z + segW })
    z += segW
    if (i < n) {
      notches.push({ z0: z, z1: z + wn })
      z += wn
    }
  }

  return {
    flightWidthIn,
    flightOffsetIn: sideTotal(left),
    segments,
    notches,
    carryWidthIn: Math.max(0, segW) * (n + 1),
    left,
    right,
  }
}

/**
 * What the outer flight ends do to the heap, or null when guard mode is
 * missing the clearance it needs to decide.
 */
export function endTreatment(inputs: TdInputs): EndTreatment | null {
  if (inputs.calcLabMode) return { kind: 'wall' }
  switch (inputs.containment) {
    case 'open':
      return { kind: 'open' }
    case 'guards':
      if (inputs.guardClearanceIn === null) return null
      // A tight guard holds product like a wall. A wide one lets it drop into
      // the indent channel, which has no flight behind it: an open end.
      return guardActsAsWall(inputs) ? { kind: 'wall' } : { kind: 'open' }
    case 'sidewalls':
      return { kind: 'sidewall', heightIn: inputs.sidewallHeightIn }
    case 'sealed':
      // Sealed pocket sidewalls are the flight height by rule (p.75).
      return { kind: 'sidewall', heightIn: inputs.flightHeightIn }
  }
}

export function guardActsAsWall(inputs: TdInputs): boolean {
  return inputs.guardClearanceIn !== null && inputs.guardClearanceIn <= inputs.smallestDimIn
}
