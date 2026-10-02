// Slices of the heap field for the section views. Every view reads the same
// columns the engine returned; nothing is redrawn from separate math.
import type { HeapField } from './types'

export interface ColumnSample {
  /** Along-belt x (side cut) or across-flight z (end cut), cell centre, in. */
  pos: number
  bottom: number
  top: number
  governing: number
  ghostTop: number
}

export function indexAt(fraction: number, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.floor(fraction * n)))
}

/** Columns along x at one z index: the side section. */
export function sliceAtZ(field: HeapField, iz: number): ColumnSample[] {
  const out: ColumnSample[] = []
  for (let ix = 0; ix < field.nx; ix++) {
    const c = ix * field.nz + iz
    out.push({
      pos: field.x0 + (ix + 0.5) * field.dx,
      bottom: field.bottom[c],
      top: field.top[c],
      governing: field.governing[c],
      ghostTop: field.ghostTop[c],
    })
  }
  return out
}

/** Columns across z at one x index: the end section. */
export function sliceAtX(field: HeapField, ix: number): ColumnSample[] {
  const out: ColumnSample[] = []
  for (let iz = 0; iz < field.nz; iz++) {
    const c = ix * field.nz + iz
    out.push({
      pos: (iz + 0.5) * field.dz,
      bottom: field.bottom[c],
      top: field.top[c],
      governing: field.governing[c],
      ghostTop: field.ghostTop[c],
    })
  }
  return out
}

/**
 * Split a slice into runs of filled columns and turn each into a closed
 * outline (tops left to right, bottoms back), as cell-edge positions.
 */
export function sliceOutlines(
  samples: ColumnSample[],
  cell: number,
): { points: [number, number][] }[] {
  const shapes: { points: [number, number][] }[] = []
  let run: ColumnSample[] = []
  const flush = () => {
    if (run.length) {
      const tops: [number, number][] = []
      const bottoms: [number, number][] = []
      for (const s of run) {
        tops.push([s.pos - cell / 2, s.top], [s.pos + cell / 2, s.top])
        bottoms.push([s.pos - cell / 2, s.bottom], [s.pos + cell / 2, s.bottom])
      }
      shapes.push({ points: [...tops, ...bottoms.reverse()] })
    }
    run = []
  }
  for (const s of samples) {
    if (Number.isNaN(s.top)) flush()
    else run.push(s)
  }
  flush()
  return shapes
}

/** Which governing-edge kinds actually appear in the field (for the legend). */
export function governingKindsPresent(field: HeapField): number[] {
  const seen = new Set<number>()
  for (let i = 0; i < field.governing.length; i++) {
    if (field.count[i] > 0 || !Number.isNaN(field.ghostTop[i])) seen.add(field.governing[i])
  }
  return [...seen].filter((k) => k !== 255).sort()
}

/** Heap height (belt-normal) summary for headlines and the heatmap scale. */
export function maxTop(field: HeapField): number {
  let m = 0
  for (let i = 0; i < field.top.length; i++) if (field.top[i] > m) m = field.top[i]
  return m
}
