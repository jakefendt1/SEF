// Synchronized sidewall data, 2026 ThermoDrive Engineering Manual p.78-80.
// S8026 has no sidewall offering listed, so it has no rows here.
import type { Series, SidewallPitch } from '../types'

/** Corrugation footprint by pitch. Its inner edge is the containment face. */
export const SIDEWALL_FOOTPRINT_IN: Record<SidewallPitch, number> = {
  '25mm': 0.953,
  '40mm': 1.495,
  '50mm': 1.752,
}

export interface SidewallOption {
  pitch: SidewallPitch
  heightIn: number
  /** Minimum recommended sprocket PD, as the manual words it per material. */
  minSprocket: string
  backbendHighWrapIn: number
  backbendLowWrapIn: number
  note?: string
}

export const SIDEWALL_OPTIONS: Record<Series, SidewallOption[]> = {
  S8026: [],
  S8050: [
    { pitch: '25mm', heightIn: 1.0, minSprocket: '4.0 in (6T)', backbendHighWrapIn: 4.0, backbendLowWrapIn: 4.0, note: 'Polyurethane smooth only' },
    { pitch: '25mm', heightIn: 2.0, minSprocket: '4.0 in (6T)', backbendHighWrapIn: 7.0, backbendLowWrapIn: 4.0, note: 'Polyurethane smooth only' },
    { pitch: '50mm', heightIn: 2.0, minSprocket: '5.2 in (8T) Cold Use / PUR A23 smooth; 6.5 in (10T) EDT and Dura', backbendHighWrapIn: 8.8, backbendLowWrapIn: 4.0 },
    { pitch: '50mm', heightIn: 2.3, minSprocket: '5.2 in (8T) PU / Cold Use / PUR A23 smooth; 6.5 in (10T) EDT and Dura', backbendHighWrapIn: 8.8, backbendLowWrapIn: 4.0 },
    { pitch: '50mm', heightIn: 3.0, minSprocket: '6.5 in (10T)', backbendHighWrapIn: 11.2, backbendLowWrapIn: 4.0 },
    { pitch: '50mm', heightIn: 4.0, minSprocket: '7.7 in (12T)', backbendHighWrapIn: 15.0, backbendLowWrapIn: 4.0 },
    { pitch: '50mm', heightIn: 6.0, minSprocket: '10.3 in (16T)', backbendHighWrapIn: 20.8, backbendLowWrapIn: 4.0, note: 'Polyurethane and PUR A23 only' },
  ],
  S8140: [
    { pitch: '40mm', heightIn: 2.0, minSprocket: 'PUR A23 smooth 4.0 in (8T); PU EDT 6.0 in (10T); Dura 6.0 in (12T)', backbendHighWrapIn: 8.0, backbendLowWrapIn: 4.0 },
    { pitch: '40mm', heightIn: 2.3, minSprocket: 'PUR A23 smooth 4.0 in (8T); PU EDT 6.0 in (10T); Dura 6.0 in (12T)', backbendHighWrapIn: 10.0, backbendLowWrapIn: 4.0 },
    { pitch: '40mm', heightIn: 3.0, minSprocket: 'PUR A23 smooth 5.0 in (10T); PU EDT 6.0 in (10T); Dura 6.0 in (12T)', backbendHighWrapIn: 12.5, backbendLowWrapIn: 4.0 },
    { pitch: '40mm', heightIn: 4.0, minSprocket: '6.0 in (12T)', backbendHighWrapIn: 16.0, backbendLowWrapIn: 4.0 },
  ],
}

export function sidewallPitches(series: Series): SidewallPitch[] {
  return [...new Set(SIDEWALL_OPTIONS[series].map((o) => o.pitch))]
}

export function sidewallHeights(series: Series, pitch: SidewallPitch): number[] {
  return SIDEWALL_OPTIONS[series].filter((o) => o.pitch === pitch).map((o) => o.heightIn)
}

export function findSidewall(
  series: Series,
  pitch: SidewallPitch,
  heightIn: number,
): SidewallOption | undefined {
  return SIDEWALL_OPTIONS[series].find(
    (o) => o.pitch === pitch && Math.abs(o.heightIn - heightIn) < 1e-6,
  )
}

export const PITCH_LABEL: Record<SidewallPitch, string> = {
  '25mm': '25 mm pitch',
  '40mm': '40 mm pitch',
  '50mm': '50 mm pitch',
}

/** Sealed Pocket, p.75. */
export const SEALED_POCKET = {
  series: ['S8050', 'S8140'] as Series[],
  minBeltWidthIn: 24,
  maxBeltWidthIn: 59,
  maxHeightIn: 4,
  recommendedMinIndentIn: 2,
  maxFlightWidthIn: 55,
}
