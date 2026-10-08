// The belt the ThermoDrive Belt Configurator describes, ported from Patrick's
// v0.65 model (`state()` + `model` in his HTML). Lengths in mm, as in his file;
// the UI converts. Pure data; geometry.ts and validate.ts work on it.
import { CONFIG, IN, PITCH_MM, START_ROW, SSW_FP, SSW_HEIGHTS_IN, type BeltSeries } from './data'

export type NotchMode = 'even' | 'manual' | 'position'

/** One flight variation (Patrick's newVar). A belt carries one or two. */
export interface FlightVar {
  /** Row of the first flight from the splice (half rows allowed on 8140). */
  startRow: number
  indentLMm: number
  indentRMm: number
  heightMm: number
  notchOn: boolean
  notchMode: NotchMode
  /** even: how many notches and how wide. */
  notchCount: number
  notchWMm: number
  /** manual: n+1 flight widths and heights, n notch widths. */
  flightWidthsMm: number[]
  flightHeightsMm: number[]
  notchWidthsMm: number[]
  /** position: each notch's left edge from the belt's left edge. */
  notchPosMm: number[]
}

export type VgMode = 'channel' | 'centerline'

export interface TdBelt {
  series: BeltSeries
  style: string
  material: string
  color: string
  widthMm: number
  lengthMm: number
  flightsOn: boolean
  /** Flight spacing; a whole number of rows once snapped. */
  flightSpacingMm: number
  vars: FlightVar[]
  sidewallsOn: boolean
  sidewallHeightIn: number
  sidewallInsetMm: number
  sidewallsBoth: boolean
  vgOn: boolean
  vgCount: number
  vgMode: VgMode
  vgIndentLMm: number
  vgIndentRMm: number
  /** channel mode: the n-2 interior channel widths. */
  vgChannelsMm: number[]
  /** centerline mode: the n-2 interior centerlines from the left edge. */
  vgCenterlinesMm: number[]
  /** 4 guides: pairs centered on the belt. */
  vgOuterSpMm: number
  vgInnerSpMm: number
}

export const DEFAULT_INDENT_MM = 1.25 * IN
export const DEFAULT_VG_INDENT_MM = 0.5 * IN
export const DEFAULT_CHANNEL_MM = 1.0 * IN
export const DEFAULT_SPACING_MM = 149

export function newVar(startRow: number): FlightVar {
  return {
    startRow,
    indentLMm: DEFAULT_INDENT_MM,
    indentRMm: DEFAULT_INDENT_MM,
    heightMm: 0,
    notchOn: false,
    notchMode: 'even',
    notchCount: 5,
    notchWMm: 25,
    flightWidthsMm: [],
    flightHeightsMm: [],
    notchWidthsMm: [],
    notchPosMm: [],
  }
}

/** Patrick's DEFAULTS: width and length start at 0 (nothing pre-filled). */
export function freshBelt(series: BeltSeries = '8050'): TdBelt {
  const style = Object.keys(CONFIG[series])[0]
  const sr = START_ROW[series]
  return {
    series,
    style,
    material: CONFIG[series][style].m[0],
    color: CONFIG[series][style].c[0],
    widthMm: 0,
    lengthMm: 0,
    flightsOn: true,
    flightSpacingMm: DEFAULT_SPACING_MM,
    vars: [newVar(sr)],
    sidewallsOn: false,
    sidewallHeightIn: SSW_HEIGHTS_IN[series]?.[1] ?? 2,
    sidewallInsetMm: DEFAULT_INDENT_MM,
    sidewallsBoth: true,
    vgOn: false,
    vgCount: 2,
    vgMode: 'channel',
    vgIndentLMm: DEFAULT_VG_INDENT_MM,
    vgIndentRMm: DEFAULT_VG_INDENT_MM,
    vgChannelsMm: [DEFAULT_CHANNEL_MM, DEFAULT_CHANNEL_MM],
    vgCenterlinesMm: [150, 300],
    vgOuterSpMm: 520,
    vgInnerSpMm: 180,
  }
}

export const pitchMm = (b: Pick<TdBelt, 'series'>): number => PITCH_MM[b.series]

export const sidewallsAvailable = (series: BeltSeries): boolean => !!SSW_HEIGHTS_IN[series]
export const vguidesAvailable = (series: BeltSeries): boolean => series === '8140'

/** Sidewall pitch (mm): 40 on 8140; 25 for 1 in polyurethane on 8050; else 50. */
export function sidewallPitch(b: Pick<TdBelt, 'series' | 'sidewallHeightIn' | 'material'>): 25 | 40 | 50 {
  if (b.series === '8140') return 40
  if (b.series === '8050' && b.sidewallHeightIn === 1 && b.material === 'POLYURETHANE') return 25
  return 50
}

export function sidewallFootprint(b: Pick<TdBelt, 'series' | 'sidewallHeightIn' | 'material'>): { fp: number; th: number } {
  return SSW_FP[sidewallPitch(b)]
}

/** Flights per spacing: the spacing in whole rows (at least 1). */
export function flightMult(b: Pick<TdBelt, 'series' | 'flightSpacingMm'>): number {
  return Math.max(1, Math.round(b.flightSpacingMm / pitchMm(b)))
}

/** Sidewalls and V-guides count only where the series offers them. */
export function effective(b: TdBelt): TdBelt {
  return {
    ...b,
    sidewallsOn: b.sidewallsOn && sidewallsAvailable(b.series),
    vgOn: b.vgOn && vguidesAvailable(b.series),
  }
}

/** Change series the way Patrick's cascade does: first valid style/material/color, start rows, offered heights. */
export function withSeries(b: TdBelt, series: BeltSeries): TdBelt {
  const styles = CONFIG[series]
  const style = b.style in styles ? b.style : Object.keys(styles)[0]
  const e = styles[style]
  const heights = SSW_HEIGHTS_IN[series] ?? []
  return {
    ...b,
    series,
    style,
    material: e.m.includes(b.material) ? b.material : e.m[0],
    color: e.c.includes(b.color) ? b.color : e.c[0],
    vars: b.vars.map((v, i) => ({ ...v, startRow: START_ROW[series] + i })),
    sidewallHeightIn: heights.includes(b.sidewallHeightIn) ? b.sidewallHeightIn : (heights[0] ?? b.sidewallHeightIn),
    sidewallsOn: b.sidewallsOn && sidewallsAvailable(series),
    vgOn: b.vgOn && vguidesAvailable(series),
  }
}

/** Style change: keep material and color when the new style allows them. */
export function withStyle(b: TdBelt, style: string): TdBelt {
  const e = CONFIG[b.series][style]
  if (!e) return b
  return { ...b, style, material: e.m.includes(b.material) ? b.material : e.m[0], color: e.c.includes(b.color) ? b.color : e.c[0] }
}
