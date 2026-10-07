// ThermoDrive belt data, ported from Patrick's Belt Configurator
// (TD Bulk Density/refs/From Patrick Colab/Thermodrive Visualizer
// 2.0.260929.html, APP_VERSION 0.65, "PRODUCT DATA & RULES"). Values are his,
// verbatim; lengths in mm unless a name says otherwise.
//
// STATUS (2026-10-07): groundwork for the shared belt engine (plan step 2).
// Not used by any screen yet. Next: geometry (flight segments, splice,
// V-guides, sections, ThermoLace) and validateBelt(), then wiring into the
// Bulk Density calculator and the Belt Configurator tile.

export const IN = 25.4

export type BeltSeries = '8026' | '8050' | '8126' | '8140'

export const BELT_SERIES: readonly BeltSeries[] = ['8026', '8050', '8126', '8140']

/** Product codes: series -> style -> allowed materials (m) and colors (c). */
export const CONFIG: Readonly<Record<BeltSeries, Readonly<Record<string, { m: readonly string[]; c: readonly string[] }>>>> = {
  '8026': {
    'EMBEDDED DIAMOND TOP (6.3 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
    'EMBED DIAMOND TOP E (6.3 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
    'FLAT TOP (5.3 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
    'FLAT TOP E (5.3 MM)': { m: ['POLYURETHANE'], c: ['BLUE', 'WHITE'] },
    'FLAT TOP E (6 MM)': { m: ['COLD USE', 'POLYURETHANE', 'POLYURETHANE A23'], c: ['BLUE', 'WHITE'] },
    'FLAT TOP E V2 (6 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
    'NUB TOP E (7.4 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
  },
  '8050': {
    'EMBED DIAMOND TOP E (7.5 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
    'FLAT TOP (7 MM)': { m: ['POLYURETHANE'], c: ['BLUE', 'WHITE'] },
    'FLAT TOP E (7 MM)': { m: ['COLD USE', 'DURA', 'HIGH TEMPERATURE HEAVY LOAD', 'POLYURETHANE', 'POLYURETHANE A23'], c: ['BLUE', 'NATURAL', 'WHITE'] },
    'NUB TOP E (8 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
    'PFT 1/4" ROUND HOLE E (7 MM)': { m: ['POLYURETHANE'], c: ['BLUE', 'WHITE'] },
    'RIBBED V TOP E (9.5 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
  },
  '8126': {
    'FLAT TOP (6 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
  },
  '8140': {
    'EDT E DUAL LUG (11.5 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
    'EDT E DUAL LUG (11 MM)': { m: ['POLYURETHANE A23'], c: ['BLUE'] },
    'EMBED DIAMOND TOP E (11.5 MM)': { m: ['POLYURETHANE'], c: ['BLUE'] },
    'FLAT TOP E (10.5 MM)': { m: ['DURA', 'POLYURETHANE', 'POLYURETHANE A23'], c: ['BLUE', 'WHITE'] },
    'FLAT TOP E DUAL LUG (10.5 MM)': { m: ['DURA', 'POLYURETHANE', 'POLYURETHANE A23'], c: ['BLUE', 'WHITE'] },
  },
}

/** Actual belt pitch (one row), mm. */
export const PITCH_MM: Readonly<Record<BeltSeries, number>> = {
  '8026': 1.004 * IN,
  '8126': 1.004 * IN,
  '8050': 1.956 * IN,
  '8140': 1.558 * IN,
}
export const PITCH_NOMINAL_MM: Readonly<Record<BeltSeries, number>> = { '8026': 26, '8126': 26, '8050': 50, '8140': 40 }
/** Row of the first flight, from the splice. */
export const START_ROW: Readonly<Record<BeltSeries, number>> = { '8026': 2, '8126': 2, '8050': 2, '8140': 2.5 }
/** Sidewall heights offered (inches) by series. */
export const SSW_HEIGHTS_IN: Readonly<Partial<Record<BeltSeries, readonly number[]>>> = { '8050': [1, 2, 3, 4, 6], '8140': [1, 2, 3, 4] }
/** Sidewall footprint and thickness (mm) by sidewall pitch (mm). */
export const SSW_FP: Readonly<Record<25 | 40 | 50, { fp: number; th: number }>> = {
  25: { fp: 24.21, th: 1.5 },
  40: { fp: 37.97, th: 2 },
  50: { fp: 44.49, th: 2 },
}
export const MIN_FLIGHT_SIDEWALL_GAP_MM = 0.2 * IN
export const VGUIDE_WIDTH_MM = 0.512 * IN // K13
export const VGUIDE_MIN_CHANNEL_MM = 0.512 * IN
export const VGUIDE_EDGE_CLEARANCE_MM = 0.512 * IN
export const DRIVE_LUG_WIDTH_MM = 3 * IN
export const DRIVE_DUAL_CENTERS_MM = 24.13 * IN
export const LACE_PITCH_MM = 0.5 * IN
/** No flight within this many rows of a ThermoLace, a belt end, or a section joint. */
export const FLIGHT_CLEAR_ROWS = 1
export const REPAIR_FIXED_ROWS: Readonly<Record<BeltSeries, number>> = { '8050': 18, '8026': 36, '8126': 36, '8140': 24 }
export const NOMINAL_10FT_ROWS: Readonly<Record<BeltSeries, number>> = { '8026': 120, '8126': 120, '8050': 60, '8140': 76 }

/** Max fabrication section length by tallest feature (belt fabrications chart). First match wins. */
export const SECTION_RULES: readonly { maxIn: number; ft: number; m: number; label: string }[] = [
  { maxIn: 1.0, ft: 100, m: 30.48, label: 'up to 1.0"' },
  { maxIn: 3.0, ft: 60, m: 18.29, label: '1.1" to 3.0"' },
  { maxIn: 4.0, ft: 50, m: 15.24, label: '3.1" to 4.0"' },
  { maxIn: 6.0, ft: 40, m: 12.19, label: '4.1" to 6.0"' },
]

/** The Bulk Density calculator names series 'S8050'; the configurator '8050'. */
export function fromCalculatorSeries(s: 'S8026' | 'S8050' | 'S8140'): BeltSeries {
  return s.slice(1) as BeltSeries
}
