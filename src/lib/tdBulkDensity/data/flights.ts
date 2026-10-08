// Flight data from the 2026 ThermoDrive Engineering Manual, p.75-77.
// "Angled flight" in CalcLab means the manual's 75-degree flight.
import type { FlightType, Series } from '../types'

export interface FlightTypeData {
  label: string
  shortLabel: string
  /** Fixed heights offered, or null for "cut to any height" within min..max. */
  heights: number[] | null
  minHeightIn: number
  maxHeightIn: number
  thicknessesIn: number[]
  minSpacingIn: Record<Series, number>
  maxLengthIn: number
  cite: string
  /** Picker thumbnail under /td-bulk-density/. */
  image: string
  /** One-line description for the picker. */
  blurb: string
}

export const FLIGHT_TYPES: Record<FlightType, FlightTypeData> = {
  deg90: {
    label: '90-degree flight',
    shortLabel: '90°',
    heights: null,
    minHeightIn: 0.25,
    maxHeightIn: 6,
    thicknessesIn: [0.12, 0.16, 0.28],
    minSpacingIn: { S8026: 2.0, S8050: 1.9, S8140: 3.0 },
    maxLengthIn: 36,
    cite: 'p.76',
    image: 'flight-90deg.png',
    blurb: 'Straight, square to the belt. Cut to any height from 0.25 to 6 in.',
  },
  deg75: {
    label: '75-degree flight',
    shortLabel: '75°',
    heights: [3, 4, 5, 6],
    minHeightIn: 3,
    maxHeightIn: 6,
    thicknessesIn: [0.16, 0.28],
    minSpacingIn: { S8026: 3.0, S8050: 3.9, S8140: 3.0 },
    maxLengthIn: 36,
    cite: 'p.76',
    image: 'flight-75deg.png',
    blurb: 'Straight, leaning 15° over its own product.',
  },
  scoop: {
    label: 'Scoop flight',
    shortLabel: 'Scoop',
    // 2.95 in (75 mm): Special Product Offering Bulletin, ThermoDrive scoop dimensions.
    heights: [2.95, 3, 4, 5, 6],
    minHeightIn: 2.95,
    maxHeightIn: 6,
    thicknessesIn: [0.16, 0.28],
    minSpacingIn: { S8026: 3.0, S8050: 3.9, S8140: 3.0 },
    maxLengthIn: 36,
    cite: 'p.76',
    image: 'flight-scoop.png',
    blurb: 'Square body with a lip bent over the product at 100°, reaching 2 in from the back.',
  },
  shortTopScoop: {
    label: 'Short-top scoop flight',
    shortLabel: 'Short-top scoop',
    heights: [2.95, 3, 4, 5, 6],
    minHeightIn: 2.95,
    maxHeightIn: 6,
    thicknessesIn: [0.16, 0.28],
    minSpacingIn: { S8026: 3.0, S8050: 3.9, S8140: 3.0 },
    maxLengthIn: 32,
    cite: 'p.77',
    image: 'flight-short-top-scoop.png',
    blurb: 'Square body with a shorter lip bent over the product at 120°.',
  },
}

export const FLIGHT_TYPE_ORDER: FlightType[] = ['deg90', 'deg75', 'scoop', 'shortTopScoop']

type ScoopType = 'scoop' | 'shortTopScoop'

/**
 * Scoop lips from the Special Product Offering Bulletin (Patrick's "Thermodrive
 * Scoop Dimensions 6.pdf"). phi is the included angle between body and lip.
 * Reach is how far the lip tip sits from the flight's BACK face, by flight
 * thickness (4 mm = 0.157 in, 7 mm = 0.276 in). The lip is the same at every
 * height; only the body changes.
 *
 * The bulletin's product-face reaches agree with reach - thickness (1.72 in
 * for the 7 mm standard, 1.18 in for both short-tops) except the 4 mm standard
 * scoop, drawn at 1.65 in where 2.00 - 0.157 = 1.84; reach - thickness is used
 * throughout. Confirm with Patrick if that one matters.
 */
export const SCOOP_LIPS: Record<ScoopType, { phiDeg: number; reachFromBackIn: { mm4: number; mm7: number } }> = {
  scoop: { phiDeg: 100, reachFromBackIn: { mm4: 2.0, mm7: 2.0 } },
  shortTopScoop: { phiDeg: 120, reachFromBackIn: { mm4: 1.34, mm7: 1.46 } },
}

/**
 * The lips CalcLab draws (from Jake's sketch, calibrated against CalcLab: see
 * T18 and the Jacksons tests). Used only in CalcLab mode and the waterfall's
 * CalcLab step, so those still reproduce CalcLab.
 */
export const CALCLAB_SCOOP_LIPS: Record<ScoopType, { phiDeg: number; lipLengthIn: number }> = {
  scoop: { phiDeg: 105, lipLengthIn: 2.0 },
  shortTopScoop: { phiDeg: 125, lipLengthIn: 1.5 },
}

/** The bulletin's lip reach from the flight's back face, for the nearest offered thickness. */
export function scoopReachIn(type: ScoopType, thicknessIn: number): number {
  const r = SCOOP_LIPS[type].reachFromBackIn
  return thicknessIn < 0.22 ? r.mm4 : r.mm7
}

/** The lip to draw: angle and straight length along the lip. */
export function scoopLip(type: ScoopType, thicknessIn: number, calcLab = false): { phiDeg: number; lipLengthIn: number } {
  if (calcLab) return CALCLAB_SCOOP_LIPS[type]
  const { phiDeg } = SCOOP_LIPS[type]
  const frontReach = Math.max(0, scoopReachIn(type, thicknessIn) - thicknessIn)
  return { phiDeg, lipLengthIn: frontReach / Math.cos((phiDeg - 90) * (Math.PI / 180)) }
}

/** The 75-degree flight's angle to the belt. */
export const ANGLED_FLIGHT_DEG = 75

export const SERIES: Series[] = ['S8026', 'S8050', 'S8140']

export const SERIES_LABEL: Record<Series, string> = {
  S8026: 'Series 8026',
  S8050: 'Series 8050',
  S8140: 'Series 8140',
}
