// The category tiles on the Parts screen, in display order. The tile grid,
// the category screen's filter chips, and the BOM's line order all read from
// here.

import type { LucideIcon } from 'lucide-react'
import {
  Circle,
  CircleDot,
  Cog,
  Disc,
  FileQuestion,
  Grip,
  Ruler,
  Rows3,
  Wrench,
  Eraser,
  Cylinder,
  Puzzle,
} from 'lucide-react'
import type { CategoryId } from './catalog'

export interface FilterDef {
  /** Key into `CatalogItem.attrs`. */
  key: string
  label: string
}

export interface CategoryDef {
  id: CategoryId
  label: string
  /** One plain line under the title on the category screen. */
  helper: string
  /** Tile picture, under public/. Null = use `icon` until artwork exists. */
  image: string | null
  icon: LucideIcon
  filters: readonly FilterDef[]
  /** Start the list filtered to the job's belt series. */
  bySeries: boolean
  /** Printed pages in the OneTrack menu. */
  pages: string
}

export const CATEGORIES: readonly CategoryDef[] = [
  {
    id: 'wearstrip',
    label: 'Wearstrip',
    helper: 'Measure the rails and pick a OneTrack wearstrip, or have CS match what is there.',
    image: '/onetrack/parts/flat-render.png',
    icon: Rows3,
    filters: [],
    bySeries: false,
    pages: '15–17',
  },
  {
    id: 'beltPullers',
    label: 'Belt pullers',
    helper: 'Puller sets for pulling a belt together to join it.',
    image: null,
    icon: Grip,
    filters: [],
    bySeries: true,
    pages: '6',
  },
  {
    id: 'rodRemovers',
    label: 'Rod removal tools',
    helper: 'Tools for pushing rods out and lacing ThermoDrive.',
    image: null,
    icon: Wrench,
    filters: [],
    bySeries: false,
    pages: '7',
  },
  {
    id: 'rulers',
    label: 'Belt rulers',
    helper: 'Belt replacement rulers (every belt except S2100).',
    image: null,
    icon: Ruler,
    filters: [],
    bySeries: false,
    pages: '8',
  },
  {
    id: 'cleanLockSprockets',
    label: 'CleanLock sprockets',
    helper: 'Sprockets by belt series, tooth count and bore.',
    image: null,
    icon: Cog,
    filters: [
      { key: 'teeth', label: 'Teeth' },
      { key: 'bore', label: 'Bore' },
    ],
    bySeries: true,
    pages: '9',
  },
  {
    id: 'cleanLockRollers',
    label: 'CleanLock returnway rollers',
    helper: 'Returnway rollers for square shaft.',
    image: null,
    icon: Cylinder,
    filters: [
      { key: 'od', label: 'OD' },
      { key: 'shaft', label: 'Square shaft' },
    ],
    bySeries: false,
    pages: '11',
  },
  {
    id: 'cleanLockAccessories',
    label: 'CleanLock accessories',
    helper: 'Shaft mounts and the roller tool set.',
    image: null,
    icon: Puzzle,
    filters: [],
    bySeries: false,
    pages: '12',
  },
  {
    id: 'straightRollers',
    label: 'Straight rollers',
    helper: 'Rollers for round shaft.',
    image: null,
    icon: Cylinder,
    filters: [
      { key: 'od', label: 'OD' },
      { key: 'shaft', label: 'Round shaft' },
      { key: 'material', label: 'Material' },
      { key: 'color', label: 'Color' },
    ],
    bySeries: false,
    pages: '13',
  },
  {
    id: 'flangedRollers',
    label: 'Flanged rollers',
    helper: 'Flanged rollers for round shaft.',
    image: null,
    icon: Disc,
    filters: [
      { key: 'od', label: 'OD' },
      { key: 'shaft', label: 'Round shaft' },
      { key: 'color', label: 'Color' },
    ],
    bySeries: false,
    pages: '14',
  },
  {
    id: 'retainerRings',
    label: 'Retainer rings',
    helper: 'Stainless retainer rings, sold singly.',
    image: null,
    icon: Circle,
    filters: [
      { key: 'shaft', label: 'Shaft' },
      { key: 'size', label: 'Size' },
      { key: 'type', label: 'Type' },
    ],
    bySeries: false,
    pages: '18',
  },
  {
    id: 'sprocketSpacers',
    label: 'Sprocket spacers',
    helper: 'Spacers for 1.5 in square shaft, sold singly.',
    image: null,
    icon: CircleDot,
    filters: [
      { key: 'width', label: 'Width' },
      { key: 'material', label: 'Material' },
    ],
    bySeries: false,
    pages: '19',
  },
  {
    id: 'scrapers',
    label: 'Scrapers',
    helper: 'EZ Mount scraper (wet environments only).',
    image: null,
    icon: Eraser,
    filters: [],
    bySeries: false,
    pages: '20',
  },
  {
    id: 'quoteOnly',
    label: 'Shafts & CIP (CS quotes)',
    helper: 'No part number. Tell CS what you need and they quote it.',
    image: null,
    icon: FileQuestion,
    filters: [],
    bySeries: false,
    pages: '10, 21',
  },
]


export function getCategory(id: CategoryId): CategoryDef {
  const c = CATEGORIES.find((x) => x.id === id)
  if (!c) throw new Error(`Unknown OneTrack category: ${id}`)
  return c
}

export const CATEGORY_ORDER: readonly CategoryId[] = CATEGORIES.map((c) => c.id)
