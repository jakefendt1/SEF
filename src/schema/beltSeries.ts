// Nominal pitch per Intralox belt series, in inches.
//
// Source: 2026 MPB Engineering Manual. This is the whole basis of the
// elongation calculation, so it lives in one place with a test rather than
// inline in the component -- a wrong pitch here produces a confident,
// wrong-by-percent answer in front of a customer.
//
// Not every series Intralox makes is listed; anything missing is handled by
// the "Other / custom pitch" option, which lets the rep type the pitch off
// the manual.

export interface BeltSeriesDef {
  /** Series number as printed in the manual, e.g. "1400". */
  series: string
  /** Nominal pitch in inches. */
  pitchIn: number
}

export const BELT_SERIES: BeltSeriesDef[] = [
  { series: '100', pitchIn: 1.0 },
  { series: '200', pitchIn: 2.0 },
  { series: '400', pitchIn: 2.0 },
  { series: '560', pitchIn: 0.315 },
  { series: '570', pitchIn: 0.315 },
  { series: '800', pitchIn: 2.0 },
  { series: '850', pitchIn: 2.0 },
  { series: '888', pitchIn: 1.99 },
  { series: '900', pitchIn: 1.07 },
  { series: '1000', pitchIn: 0.6 },
  { series: '1100', pitchIn: 0.6 },
  { series: '1200', pitchIn: 1.44 },
  { series: '1400', pitchIn: 1.0 },
  { series: '1500', pitchIn: 0.5 },
  { series: '1600', pitchIn: 1.0 },
  { series: '1650', pitchIn: 1.0 },
  { series: '1700', pitchIn: 1.5 },
  { series: '1750', pitchIn: 1.52 },
  { series: '1800', pitchIn: 2.5 },
  { series: '1900', pitchIn: 2.07 },
  { series: '2200', pitchIn: 1.5 },
  { series: '2300', pitchIn: 1.0 },
  { series: '2400', pitchIn: 1.0 },
  { series: '2600', pitchIn: 2.0 },
  { series: '2700', pitchIn: 2.0 },
  { series: '2800', pitchIn: 1.5 },
  { series: '2900', pitchIn: 1.5 },
  { series: '2950', pitchIn: 1.5 },
  { series: '3000', pitchIn: 2.0 },
  { series: '4000', pitchIn: 1.0 },
  { series: '4400', pitchIn: 2.0 },
  { series: '4500', pitchIn: 2.0 },
  { series: '9000', pitchIn: 1.0 },
  { series: '10000', pitchIn: 3.0 },
]

/** The value the series `<select>` uses for "I'll type the pitch myself". */
export const CUSTOM_SERIES = 'custom'

/**
 * Series 900 is the one these reps meet most often on a spiral, so it is the
 * default rather than making them scroll from the top of the list every time.
 */
export const DEFAULT_SERIES = '900'

export function seriesPitchIn(series: string): number | undefined {
  return BELT_SERIES.find((s) => s.series === series)?.pitchIn
}

/** Label for the picker: "Series 900 — 1.07 in pitch". */
export function seriesLabel(def: BeltSeriesDef): string {
  return `Series ${def.series} — ${def.pitchIn} in pitch`
}
