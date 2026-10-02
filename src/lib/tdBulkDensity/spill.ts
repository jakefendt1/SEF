// Spill edges and the closed-form minimum along each (plan §3.4).
//
// The largest stable heap is S(p) = min over spill edges q of
// [E_q + tan(γ_d) · |p − q|_horizontal]. For a straight spill segment the
// minimum over its points has a closed form because f(s) is convex.
// Ported from seg_min in reference/pile.py.
import { EDGE_KINDS, type EdgeKind } from './types'

export type Vec3 = readonly [number, number, number]

export interface SpillEdge {
  kind: EdgeKind
  /** Endpoints in the belt frame (x, y, z), inches. */
  q0: Vec3
  q1: Vec3
}

/** A spill edge precomputed for fast evaluation in world coordinates. */
export interface SpillSeg {
  kindIndex: number
  /** Plan-view start (world horizontal X, across-belt Z) and elevation. */
  hx: number
  hz: number
  E0: number
  /** Unit direction in plan view, and plan length. */
  ux: number
  uz: number
  L: number
  /** Elevation slope along the segment, ΔE / L. */
  b: number
  k: number
  /** b / sqrt(k² − b²) when k > |b|, else NaN (only endpoints count). */
  shift: number
  isPoint: boolean
}

/** Belt frame -> world: X horizontal uphill, E elevation. */
export function toWorld(x: number, y: number, cosA: number, sinA: number): [number, number] {
  return [x * cosA - y * sinA, x * sinA + y * cosA]
}

export function prepareSeg(edge: SpillEdge, k: number, cosA: number, sinA: number): SpillSeg {
  const [hx, E0] = toWorld(edge.q0[0], edge.q0[1], cosA, sinA)
  const [hx1, E1] = toWorld(edge.q1[0], edge.q1[1], cosA, sinA)
  const hz = edge.q0[2]
  const dx = hx1 - hx
  const dz = edge.q1[2] - hz
  const L = Math.hypot(dx, dz)
  const isPoint = L < 1e-12
  const b = isPoint ? 0 : (E1 - E0) / L
  return {
    kindIndex: EDGE_KINDS.indexOf(edge.kind),
    hx,
    hz,
    E0,
    ux: isPoint ? 0 : dx / L,
    uz: isPoint ? 0 : dz / L,
    L,
    b,
    k,
    shift: k > Math.abs(b) ? b / Math.sqrt(k * k - b * b) : Number.NaN,
    isPoint,
  }
}

/** min over the segment of E_q + k·|p − q| for plan-view point (X, Z). */
export function segMin(seg: SpillSeg, X: number, Z: number): number {
  const rx = X - seg.hx
  const rz = Z - seg.hz
  const k = seg.k
  if (seg.isPoint) return seg.E0 + k * Math.hypot(rx, rz)

  const along = rx * seg.ux + rz * seg.uz
  const d = Math.abs(rx * seg.uz - rz * seg.ux)
  const d2 = d * d
  const E0 = seg.E0
  const b = seg.b
  const L = seg.L

  let a = -along
  let m = E0 + k * Math.sqrt(a * a + d2)
  a = L - along
  const fL = E0 + b * L + k * Math.sqrt(a * a + d2)
  if (fL < m) m = fL
  if (seg.shift === seg.shift) {
    // not NaN: interior stationary point
    let s = along - seg.shift * d
    if (s < 0) s = 0
    else if (s > L) s = L
    a = s - along
    const fs = E0 + b * s + k * Math.sqrt(a * a + d2)
    if (fs < m) m = fs
  }
  return m
}
