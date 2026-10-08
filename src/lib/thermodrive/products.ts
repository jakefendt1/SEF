// ThermoDrive belts as the 2026 ThermoDrive Engineering Manual lists them:
// one row per data sheet (BarDrive pp.16-44, LugDrive pp.45-60), with its
// width range, colors, joining options and which accessories it takes
// ("Available with flights, sidewall, and V-guide"). The perforated style is
// p.74 (Belt Perforations). This replaces Patrick's style/material/color
// table for picking a belt: his lumps colors across materials (e.g. a white
// 8140 polyurethane belt the manual doesn't list) and misses the 8026 Nub Top
// 6.3 mm and the 8050 EDT in PUR A23.
import type { BeltSeries } from './data'

export type Joining = 'endless' | 'prepared ends' | 'ThermoLace HDE' | 'metal lace'
export type Drive = 'bar' | 'single-lug' | 'dual-lug'

export interface Product {
  series: BeltSeries
  drive: Drive
  /** Surface style and thickness, e.g. "Flat Top E (7.0 mm)". */
  surface: string
  material: string
  colors: string[]
  minWidthIn: number
  maxWidthIn: number
  joining: Joining[]
  flights: boolean
  sidewalls: boolean
  vguides: boolean
}

const PE: Joining[] = ['prepared ends', 'endless']
const ALL: Joining[] = ['prepared ends', 'endless', 'ThermoLace HDE', 'metal lace']
const NO_LACE: Joining[] = ['prepared ends', 'endless', 'metal lace']

function p(
  series: BeltSeries,
  drive: Drive,
  surface: string,
  material: string,
  colors: string[],
  [minWidthIn, maxWidthIn]: [number, number],
  joining: Joining[],
  acc: '' | 'F' | 'FS' | 'FV' | 'FSV',
): Product {
  return { series, drive, surface, material, colors, minWidthIn, maxWidthIn, joining, flights: acc.includes('F'), sidewalls: acc.includes('S'), vguides: acc.includes('V') }
}

export const PRODUCTS: readonly Product[] = [
  p('8026', 'bar', 'Flat Top E (5.3 mm)', 'Polyurethane', ['Blue', 'White'], [1, 72], NO_LACE, 'F'),
  p('8026', 'bar', 'Flat Top E (6.0 mm)', 'Polyurethane', ['Blue', 'White'], [1, 72], ALL, 'F'),
  p('8026', 'bar', 'Flat Top E (6.0 mm)', 'Cold Use', ['Blue'], [1, 72], NO_LACE, 'F'),
  p('8026', 'bar', 'Flat Top E (6.0 mm)', 'Polyurethane A23', ['Blue'], [1, 72], ALL, 'F'),
  p('8026', 'bar', 'Embedded Diamond Top E (6.3 mm)', 'Polyurethane', ['Blue'], [1, 72], ALL, 'F'),
  p('8026', 'bar', 'Nub Top (6.3 mm)', 'Polyurethane', ['Blue'], [1, 24], ['prepared ends', 'endless', 'ThermoLace HDE'], 'F'),
  p('8026', 'bar', 'Nub Top E (7.4 mm)', 'Polyurethane', ['Blue'], [1, 72], ALL, 'F'),
  p('8050', 'bar', 'Flat Top E (7.0 mm)', 'Polyurethane', ['Blue', 'White'], [1, 72], ALL, 'FS'),
  p('8050', 'bar', 'Flat Top E (7.0 mm)', 'Cold Use', ['Blue'], [1, 72], NO_LACE, 'FS'),
  p('8050', 'bar', 'Flat Top E (7.0 mm)', 'Dura', ['Blue'], [1, 72], ALL, 'F'),
  p('8050', 'bar', 'Flat Top E (7.0 mm)', 'High Temperature Heavy Load', ['Natural'], [1, 50], NO_LACE, ''),
  p('8050', 'bar', 'Flat Top E (7.0 mm)', 'Polyurethane A23', ['Blue', 'White'], [1, 72], ALL, 'FS'),
  p('8050', 'bar', 'Perforated Flat Top E (7.0 mm), 1/4 in holes', 'Polyurethane', ['Blue', 'White'], [4, 72], ALL, 'FS'),
  p('8050', 'bar', 'Embedded Diamond Top E (7.5 mm)', 'Polyurethane', ['Blue'], [1, 72], ALL, 'FS'),
  p('8050', 'bar', 'Embedded Diamond Top E (7.5 mm)', 'Polyurethane A23', ['Blue'], [1, 48], ALL, 'F'),
  p('8050', 'bar', 'Nub Top E (8.0 mm)', 'Polyurethane', ['Blue'], [1, 42], ALL, 'F'),
  p('8050', 'bar', 'Ribbed V-Top E (9.5 mm)', 'Polyurethane', ['Blue'], [2, 42], ['prepared ends', 'endless', 'ThermoLace HDE'], ''),
  p('8126', 'single-lug', 'Flat Top (6.0 mm)', 'Polyurethane', ['Blue'], [10, 24], PE, ''),
  p('8140', 'single-lug', 'Flat Top E (10.5 mm)', 'Polyurethane', ['Blue'], [5, 36], ALL, 'FSV'),
  p('8140', 'single-lug', 'Flat Top E (10.5 mm)', 'Polyurethane A23', ['Blue', 'White'], [5, 36], ALL, 'FSV'),
  p('8140', 'single-lug', 'Flat Top E (10.5 mm)', 'Dura', ['Blue'], [5, 36], ALL, 'F'),
  p('8140', 'single-lug', 'Embedded Diamond Top E (11.5 mm)', 'Polyurethane', ['Blue'], [5, 36], ALL, 'FSV'),
  p('8140', 'dual-lug', 'Flat Top E (10.5 mm)', 'Polyurethane', ['Blue'], [30, 60], ALL, 'FSV'),
  p('8140', 'dual-lug', 'Flat Top E (10.5 mm)', 'Polyurethane A23', ['Blue', 'White'], [30, 60], ALL, 'FV'),
  p('8140', 'dual-lug', 'Flat Top E (10.5 mm)', 'Dura', ['Blue'], [30, 60], ALL, 'F'),
  p('8140', 'dual-lug', 'Embedded Diamond Top E (11.5 mm)', 'Polyurethane', ['Blue'], [30, 60], ALL, 'FSV'),
]

export const DRIVE_LABEL: Record<Drive, string> = { bar: 'BarDrive', 'single-lug': 'Single lug', 'dual-lug': 'Dual lug' }

/** The belt's "style" string: drive and surface, e.g. "Dual-Lug Flat Top E (10.5 mm)". */
export function styleOf(x: Pick<Product, 'series' | 'drive' | 'surface'>): string {
  if (x.series !== '8140') return x.surface
  return `${x.drive === 'dual-lug' ? 'Dual-Lug' : 'Single-Lug'} ${x.surface}`
}

export function drivesFor(series: BeltSeries): Drive[] {
  return [...new Set(PRODUCTS.filter((x) => x.series === series).map((x) => x.drive))]
}
export function surfacesFor(series: BeltSeries, drive: Drive): string[] {
  return [...new Set(PRODUCTS.filter((x) => x.series === series && x.drive === drive).map((x) => x.surface))]
}
export function materialsFor(series: BeltSeries, drive: Drive, surface: string): string[] {
  return PRODUCTS.filter((x) => x.series === series && x.drive === drive && x.surface === surface).map((x) => x.material)
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9.]/g, '')

/** The data sheet behind a belt's series/style/material, or null for a combination the manual doesn't list. */
export function findProduct(b: { series: BeltSeries; style: string; material: string }): Product | null {
  return PRODUCTS.find((x) => x.series === b.series && norm(styleOf(x)) === norm(b.style) && norm(x.material) === norm(b.material)) ?? null
}

/** A drive inferred from a style string (also reads Patrick's "DUAL LUG" names). */
export function driveOfStyle(series: BeltSeries, style: string): Drive {
  if (series !== '8140' && series !== '8126') return 'bar'
  return /dual[- ]lug/i.test(style) ? 'dual-lug' : 'single-lug'
}
