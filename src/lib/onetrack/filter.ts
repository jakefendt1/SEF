// Filtering a category's items by the chips the rep taps, and by the job's
// belt series for the categories where that matters (sprockets, pullers).

import type { CatalogItem } from './catalog'

/**
 * The bare series number from however a rep typed it: "S1600", "1600",
 * "Series 1600 Flush Grid" and "s 1600" all give "1600". Null when there's no
 * series number in it.
 */
export function normalizeSeries(raw: string | null | undefined): string | null {
  const m = raw?.match(/\d{3,5}/)
  return m ? m[0] : null
}

/** Display form, e.g. "S1600". */
export function seriesLabel(series: string): string {
  return `S${series}`
}

export interface FilterResult {
  items: CatalogItem[]
  /** The series the list is filtered to, or null when it isn't. */
  seriesApplied: string | null
  /**
   * The job has a series but nothing in this category is listed for it. The
   * list then shows everything, and the UI says so rather than showing an
   * empty list.
   */
  seriesNoMatch: boolean
}

export function filterItems(
  items: readonly CatalogItem[],
  opts: {
    /** Chip selections, attr key -> value. Missing / null = no filter on that key. */
    chips?: Readonly<Record<string, string | null | undefined>>
    /** The job's belt series as typed. Applied only when `bySeries` is true. */
    beltSeries?: string | null
    bySeries?: boolean
  } = {},
): FilterResult {
  const chips = Object.entries(opts.chips ?? {}).filter(
    (e): e is [string, string] => typeof e[1] === 'string' && e[1] !== '',
  )
  const list = items.filter((i) => chips.every(([k, v]) => i.attrs[k] === v))

  const series = opts.bySeries ? normalizeSeries(opts.beltSeries) : null
  if (!series) return { items: list, seriesApplied: null, seriesNoMatch: false }

  // Judge "nothing for this series" on the whole category, not on what the
  // chips left, so a chip choice can't masquerade as a series mismatch.
  if (!items.some((i) => i.series.includes(series))) {
    return { items: list, seriesApplied: null, seriesNoMatch: true }
  }
  return {
    items: list.filter((i) => i.series.includes(series)),
    seriesApplied: series,
    seriesNoMatch: false,
  }
}

/** The distinct values of one attribute, in catalog order, for a chip row. */
export function chipOptions(items: readonly CatalogItem[], key: string): string[] {
  const seen: string[] = []
  for (const i of items) {
    const v = i.attrs[key]
    if (v !== undefined && !seen.includes(v)) seen.push(v)
  }
  return seen
}

/**
 * True when a part is for specific belt series and the job's series isn't one
 * of them. Feeds the "this sprocket is for S800; the job says S1600" warning.
 */
export function seriesMismatch(item: CatalogItem, beltSeries: string | null | undefined): boolean {
  const series = normalizeSeries(beltSeries)
  return !!series && item.series.length > 0 && !item.series.includes(series)
}
