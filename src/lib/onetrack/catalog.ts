// The OneTrack catalog in the one shape the app uses.
//
// `data/menu.ts` holds the menu's rows as printed; this file normalises every
// one of them -- wearstrip, sprocket, ring, shaft -- to a CatalogItem, so the
// category screen, the BOM, the PDF and the email text all read one list.

import {
  BELT_PULLERS,
  CLEANLOCK_ACCESSORIES,
  CLEANLOCK_ROLLERS,
  CLEANLOCK_SPROCKETS,
  FLANGED_ROLLERS,
  QUOTE_ONLY,
  RETAINER_RINGS,
  ROD_REMOVERS,
  RULERS,
  SCRAPERS,
  SPROCKET_SPACERS,
  STRAIGHT_ROLLERS,
  WEARSTRIPS,
  type FrameSize,
  type RawWearstrip,
  type WearstripFamily,
} from './data/menu'

export type { FrameSize, WearstripFamily } from './data/menu'

export type CategoryId =
  | 'wearstrip'
  | 'beltPullers'
  | 'rodRemovers'
  | 'rulers'
  | 'cleanLockSprockets'
  | 'cleanLockRollers'
  | 'cleanLockAccessories'
  | 'straightRollers'
  | 'flangedRollers'
  | 'retainerRings'
  | 'sprocketSpacers'
  | 'scrapers'
  | 'quoteOnly'

/** Part number placeholder for lines CS prices from the rep's note. */
export const CS_TO_QUOTE = 'TBD: CS to quote'

export interface CatalogItem {
  /** Stable id: the part number in lower case, or a fixed id for quote-only items. */
  id: string
  category: CategoryId
  /** Null only for quote-only items (CS prices them from the line note). */
  partNumber: string | null
  /** Plain words: what the item card, BOM, PDF and email show. */
  description: string
  /** Values the category's filter chips read, keyed by `CategoryDef.filters[].key`. */
  attrs: Readonly<Record<string, string>>
  /** Belt series this part is for, as bare numbers ("1600"). Empty = any belt. */
  series: readonly string[]
  /** Unit of measure. Rings and spacers are sold singly (Jake, 2026-10-05). */
  uom: string
  /** Printed page in the OneTrack menu. */
  page: number
  /** Quote-only items: what CS needs the rep to write in the line note. */
  notePrompt?: string
  /** Picture cropped from the menu page, under public/. */
  image?: string
}

export interface WearstripItem extends CatalogItem {
  category: 'wearstrip'
  partNumber: string
  family: WearstripFamily
  color: 'Natural' | 'Blue'
  frameIn: FrameSize | null
  /** Stock length one unit of `uom` buys, in inches (120 = 10 ft, 6000 = 500 ft). */
  stockLengthIn: number
  dims: RawWearstrip['dims'] | null
}

const lower = (s: string) => s.toLowerCase()

/**
 * Descriptions for rows the menu prints only as a table of attributes.
 * One function, so the wording is consistent and tested in one place.
 */
export const describe = {
  sprocket: (r: (typeof CLEANLOCK_SPROCKETS)[number]) =>
    `CleanLock sprocket, S${r.series}, ${r.teeth} teeth, ${r.pd} PD, ${r.bore} square bore`,
  cleanLockRoller: (r: (typeof CLEANLOCK_ROLLERS)[number]) =>
    `CleanLock returnway roller, ${r.od} OD × ${r.width} wide, ${r.squareShaft} square shaft, ${r.material}, ${lower(r.color)}`,
  straightRoller: (r: (typeof STRAIGHT_ROLLERS)[number]) =>
    `Straight roller, ${r.od} OD × ${r.width} wide, ${r.roundShaft} round shaft, ${r.material}, ${lower(r.color)}`,
  flangedRoller: (r: (typeof FLANGED_ROLLERS)[number]) =>
    `Flanged roller, ${r.od} OD × ${r.width} wide, ${r.flangeHeight} flange, ${r.roundShaft} round shaft, ${r.material}, ${lower(r.color)}`,
  spacer: (r: (typeof SPROCKET_SPACERS)[number]) =>
    `Sprocket spacer, ${r.squareBore} square bore, ${r.width} wide, ${r.material}`,
}

const pnId = (pn: string) => pn.toLowerCase()

const wearstrips: WearstripItem[] = WEARSTRIPS.map((w) => ({
  id: w.id,
  category: 'wearstrip',
  partNumber: w.partNumber,
  description: w.description,
  attrs: { color: w.color, ...(w.frameIn ? { frame: `${w.frameIn} in` } : {}) },
  series: [],
  uom: w.uom,
  page: w.page,
  family: w.family,
  color: w.color,
  frameIn: w.frameIn ?? null,
  stockLengthIn: w.lengthFt * 12,
  dims: w.dims ?? null,
}))

const items: CatalogItem[] = [
  ...wearstrips,
  ...BELT_PULLERS.map((r) => ({
    id: pnId(r.partNumber),
    category: 'beltPullers' as const,
    partNumber: r.partNumber,
    description: r.description,
    attrs: {},
    series: r.series,
    uom: 'set',
    page: r.page,
  })),
  ...ROD_REMOVERS.map((r) => simple('rodRemovers', r)),
  ...RULERS.map((r) => simple('rulers', r)),
  ...CLEANLOCK_SPROCKETS.map((r) => ({
    id: pnId(r.partNumber),
    category: 'cleanLockSprockets' as const,
    partNumber: r.partNumber,
    description: describe.sprocket(r),
    attrs: { teeth: String(r.teeth), bore: r.bore },
    series: [r.series],
    uom: 'each',
    page: r.page,
  })),
  ...CLEANLOCK_ROLLERS.map((r) => ({
    id: pnId(r.partNumber),
    category: 'cleanLockRollers' as const,
    partNumber: r.partNumber,
    description: describe.cleanLockRoller(r),
    attrs: { od: r.od, shaft: r.squareShaft },
    series: [],
    uom: 'each',
    page: r.page,
  })),
  ...CLEANLOCK_ACCESSORIES.map((r) => simple('cleanLockAccessories', r)),
  ...STRAIGHT_ROLLERS.map((r) => ({
    id: pnId(r.partNumber),
    category: 'straightRollers' as const,
    partNumber: r.partNumber,
    description: describe.straightRoller(r),
    attrs: { od: r.od, shaft: r.roundShaft, material: r.material, color: r.color },
    series: [],
    uom: 'each',
    page: r.page,
  })),
  ...FLANGED_ROLLERS.map((r) => ({
    id: pnId(r.partNumber),
    category: 'flangedRollers' as const,
    partNumber: r.partNumber,
    description: describe.flangedRoller(r),
    attrs: { od: r.od, shaft: r.roundShaft, color: r.color },
    series: [],
    uom: 'each',
    page: r.page,
  })),
  ...RETAINER_RINGS.map((r) => ({
    ...simple('retainerRings', r),
    attrs: { shaft: r.shaft, size: r.size, type: r.type },
  })),
  ...SPROCKET_SPACERS.map((r) => ({
    id: pnId(r.partNumber),
    category: 'sprocketSpacers' as const,
    partNumber: r.partNumber,
    description: describe.spacer(r),
    attrs: { width: r.width, material: r.material },
    series: [],
    uom: 'each',
    page: r.page,
  })),
  ...SCRAPERS.map((r) => simple('scrapers', r)),
  ...QUOTE_ONLY.map((r) => ({
    id: r.id,
    category: 'quoteOnly' as const,
    partNumber: null,
    description: r.description,
    attrs: {},
    series: [],
    uom: 'each',
    page: r.page,
    notePrompt: r.prompt,
  })),
]

function simple(
  category: CategoryId,
  r: { description: string; partNumber: string; page: number },
): CatalogItem {
  return {
    id: pnId(r.partNumber),
    category,
    partNumber: r.partNumber,
    description: r.description,
    attrs: {},
    series: [],
    uom: 'each',
    page: r.page,
  }
}

// Pictures cropped from the OneTrack menu (public/onetrack/menu/), so a rep
// can match a part to the page a customer is holding.
const menuImage = (name: string) => `/onetrack/menu/${name}.jpg`
const IMAGE_BY_ID: Record<string, string> = {
  'c3sf087xxxxx-00': menuImage('puller-3link'),
  'c3sf125xxxxx-00': menuImage('puller-5link'),
  'c3sf101xxxhb-00': menuImage('puller-td'),
  'c3j7xxxxxxxx-00': menuImage('rod-remover'),
  'h2a5bjixxxxx-00': menuImage('td-pliers'),
  'h2a4bhixxxxx-00': menuImage('td-pliers'),
  'c3sk127a02mv-00': menuImage('shaft-mount'),
  'c3ss129xxxxx-00': menuImage('roller-tool'),
  'quote-cleanlock-shaft': menuImage('cleanlock-shaft'),
  'quote-ss-shaft': menuImage('ss-shaft'),
  'quote-cip': menuImage('cip'),
}
const IMAGE_BY_CATEGORY: Partial<Record<CategoryId, string>> = {
  rulers: menuImage('ruler'),
  cleanLockSprockets: menuImage('sprocket'),
  cleanLockRollers: menuImage('cleanlock-rollers'),
  straightRollers: menuImage('straight-rollers'),
  flangedRollers: menuImage('flanged-rollers'),
  sprocketSpacers: menuImage('spacers'),
  scrapers: menuImage('scraper'),
}
for (const item of items) {
  const image =
    IMAGE_BY_ID[item.id] ??
    (item.category === 'retainerRings'
      ? menuImage(item.attrs.type === 'Snap ring' ? 'ring-snap' : 'ring-split')
      : IMAGE_BY_CATEGORY[item.category])
  if (image) item.image = image
}

export const CATALOG: readonly CatalogItem[] = items
export const WEARSTRIP_ITEMS: readonly WearstripItem[] = wearstrips

const byId = new Map(CATALOG.map((i) => [i.id, i]))

export function getItem(id: string): CatalogItem | undefined {
  return byId.get(id)
}

export function itemsIn(category: CategoryId): CatalogItem[] {
  return CATALOG.filter((i) => i.category === category)
}

/** The wearstrip part for a family + color (flat / flanged) or frame (radius). */
export function findWearstrip(
  family: WearstripFamily,
  opts: { color?: 'Natural' | 'Blue' | null; frameIn?: FrameSize | null },
): WearstripItem | null {
  return (
    WEARSTRIP_ITEMS.find(
      (w) =>
        w.family === family &&
        (w.frameIn === null ? w.color === opts.color : w.frameIn === opts.frameIn),
    ) ?? null
  )
}
