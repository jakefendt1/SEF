// Illustration colours for the bulk density views: belt, flights, product
// and the governing-edge tokens from refs/diagrams/D_spill-edges-and-palette.
// The heap, the heatmap, the section views and the legend all read this one
// table, so "orange means open end" can't mean something else in another
// view. Illustration only -- never use these for UI state or emphasis; brand
// colour is --brand.
import type { EdgeKind } from '@/lib/tdBulkDensity/types'

export const TD_COLORS = {
  belt: '#0070AD',
  beltShadow: '#00548F',
  flight: '#0A84C6',
  product: '#E8B04B',
  productDark: '#B9862F',
  guard: '#5C6B7A',
  sidewall: '#2B8FC9',
  ghost: '#6B7280',
  ink: '#1F2937',
  dim: '#4B5563',
} as const

export const EDGE_COLORS: Record<EdgeKind, string> = {
  trailing: '#D64545',
  leading: '#8E5BD0',
  open: '#F08A24',
  sidewall: '#1FA67A',
  notch: '#D6409F',
}

export const EDGE_LABEL: Record<EdgeKind, string> = {
  trailing: 'Rolls back over the trailing flight',
  leading: 'Spills over the leading flight',
  open: 'Spills off an open flight end',
  sidewall: 'Spills over the sidewall',
  notch: 'Slumps into a notch',
}

/**
 * Line colours for the sweep charts, by containment mode. Validated with the
 * dataviz palette checker (lightness band, chroma, CVD separation all pass;
 * orange is under 3:1 on white, so every line is also direct-labelled and the
 * chart has a table view). Walls-at-both-ends is a dashed grey reference, not
 * a series.
 */
export const SWEEP_COLORS = {
  open: '#E07B17',
  guards: '#2F6FD6',
  sidewalls: '#1FA67A',
  sealed: '#1FA67A',
  'sidewall-height': '#1FA67A',
  current: '#2F6FD6',
  walls: '#6B7280',
} as const

/** Sequential ramp for product depth (one hue, light -> dark). */
export const DEPTH_RAMP = ['#FBF1DC', '#F3D79E', '#E8B04B', '#C88A22', '#8A5A12'] as const

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (shift: number) => {
    const x = (pa >> shift) & 255
    const y = (pb >> shift) & 255
    return Math.round(x + (y - x) * t)
  }
  return '#' + [16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, '0')).join('')
}

/**
 * The colour the 3D heap is actually painted where an edge governs: the edge
 * colour mixed into product amber, so it still reads as product. The 3D view
 * and its key both use this, so the key always matches what's on screen.
 */
export function heapColor(kind: EdgeKind): string {
  return mixHex(TD_COLORS.product, EDGE_COLORS[kind], 0.6)
}
