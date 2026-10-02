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
    heights: [3, 4, 5, 6],
    minHeightIn: 3,
    maxHeightIn: 6,
    thicknessesIn: [0.16, 0.28],
    minSpacingIn: { S8026: 3.0, S8050: 3.9, S8140: 3.0 },
    maxLengthIn: 36,
    cite: 'p.76',
    image: 'flight-scoop.png',
    blurb: 'Square body with a 2 in lip bent over the product at 105°.',
  },
  shortTopScoop: {
    label: 'Short-top scoop flight',
    shortLabel: 'Short-top scoop',
    heights: [3, 4, 5, 6],
    minHeightIn: 3,
    maxHeightIn: 6,
    thicknessesIn: [0.16, 0.28],
    minSpacingIn: { S8026: 3.0, S8050: 3.9, S8140: 3.0 },
    maxLengthIn: 32,
    cite: 'p.77',
    image: 'flight-short-top-scoop.png',
    blurb: 'Square body with a 1.5 in lip bent over the product at 125°.',
  },
}

export const FLIGHT_TYPE_ORDER: FlightType[] = ['deg90', 'deg75', 'scoop', 'shortTopScoop']

/**
 * Parametric scoop lips (plan §4.1, from Jake's side-profile sketch and
 * calibrated against CalcLab: see T18). phi is the included angle between body
 * and lip; the lip is fixed across heights, only the body length changes.
 */
export const SCOOP_LIPS: Record<'scoop' | 'shortTopScoop', { phiDeg: number; lipLengthIn: number }> = {
  scoop: { phiDeg: 105, lipLengthIn: 2.0 },
  shortTopScoop: { phiDeg: 125, lipLengthIn: 1.5 },
}

/** The 75-degree flight's angle to the belt. */
export const ANGLED_FLIGHT_DEG = 75

export const SERIES: Series[] = ['S8026', 'S8050', 'S8140']

export const SERIES_LABEL: Record<Series, string> = {
  S8026: 'Series 8026',
  S8050: 'Series 8050',
  S8140: 'Series 8140',
}
