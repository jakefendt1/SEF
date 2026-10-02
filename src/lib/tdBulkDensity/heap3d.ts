// The 3D critical-slope heap (plan §3.4) -- the core of the tool.
//
// A cell (x, y, z) holds product when it is inside the pocket void, inside a
// flight segment, and at or below the heap surface S over its plan position.
// Ported from volume() in reference/pile.py, then generalised from a bare
// 90-degree flight to the void polygon, notches, sidewalls and guards.
//
// The result is returned as columns over the (x, z) footprint. The 3D view,
// the section cuts and the heatmap all draw from these columns.
import { leadingTipX, pointInPolygon, profileTopIn, surfaceY } from './pocket2d'
import { prepareSeg, segMin, toWorld, type SpillEdge, type SpillSeg, type Vec3 } from './spill'
import {
  EDGE_NONE,
  type EndTreatment,
  type FlightProfile,
  type GridSize,
  type HeapField,
  type Point,
  type WidthModel,
} from './types'

const DEG = Math.PI / 180

export const GRID: Record<GridSize, { nx: number; ny: number; nz: number }> = {
  fine: { nx: 160, ny: 100, nz: 120 },
  coarse: { nx: 80, ny: 50, nz: 60 },
  sweep: { nx: 60, ny: 40, nz: 48 },
}

export interface HeapParams {
  profile: FlightProfile
  spacingIn: number
  inclineDeg: number
  gammaDeg: number
  width: WidthModel
  end: EndTreatment
  voidPolygon: Point[]
  nx: number
  ny: number
  nz: number
  /**
   * For a partial load: product starts to roll back from this height on the
   * trailing flight face instead of from the tip. Null = full capacity.
   */
  crestHeightIn?: number | null
}

export interface HeapResult {
  field: HeapField
  edges: SpillEdge[]
  volumeIn3: number
  /** ∫ depth dA over one containing end wall (in³), averaged over both ends. */
  wallDepthAreaIn3: number
  /** Deepest wetted point on a containing end wall, in (vertical). */
  wallMaxDepthIn: number
}

/** u of the trailing face at height v (linear along the face polyline). */
export function faceUAt(profile: FlightProfile, v: number): number {
  const f = profile.face
  if (v <= f[0][1]) return f[0][0]
  for (let i = 1; i < f.length; i++) {
    const [u0, v0] = f[i - 1]
    const [u1, v1] = f[i]
    if (v <= v1) return v1 === v0 ? u1 : u0 + ((u1 - u0) * (v - v0)) / (v1 - v0)
  }
  return f[f.length - 1][0]
}

/** Every spill edge for one pocket (plan §3.4 table). */
export function buildSpillEdges(
  profile: FlightProfile,
  spacingIn: number,
  width: WidthModel,
  end: EndTreatment,
  crestHeightIn: number | null = null,
): SpillEdge[] {
  const [tipU, tipV] = profile.tip
  const leadX = leadingTipX(profile, spacingIn)
  const baseEnd = spacingIn - profile.thicknessIn
  const edges: SpillEdge[] = []

  const along = (kind: SpillEdge['kind'], y: number, z: number) =>
    edges.push({ kind, q0: [0, y, z], q1: [baseEnd, y, z] })

  // A partial load's crest: a line across the trailing face, below the tip.
  // Same physics as the tip -- product above it rolls back -- just lower.
  if (crestHeightIn !== null) {
    const u = faceUAt(profile, crestHeightIn)
    for (const s of width.segments) {
      edges.push({ kind: 'trailing', q0: [u, crestHeightIn, s.z0], q1: [u, crestHeightIn, s.z1] })
    }
  }

  // Outer flight ends first: they are the edges most likely to reject a cell,
  // which lets the volume loop exit early.
  for (const z of [0, width.flightWidthIn]) {
    if (end.kind === 'open') along('open', 0, z)
    else if (end.kind === 'sidewall') along('sidewall', end.heightIn, z)
  }
  for (const n of width.notches) {
    along('notch', 0, n.z0)
    along('notch', 0, n.z1)
  }
  for (const s of width.segments) {
    const a: Vec3 = [tipU, tipV, s.z0]
    const b: Vec3 = [tipU, tipV, s.z1]
    edges.push({ kind: 'trailing', q0: a, q1: b })
  }
  for (const s of width.segments) {
    edges.push({ kind: 'leading', q0: [leadX, tipV, s.z0], q1: [leadX, tipV, s.z1] })
  }
  return edges
}

export function computeHeap(p: HeapParams): HeapResult {
  const { profile, spacingIn, inclineDeg, gammaDeg, width, end, voidPolygon, nx, ny, nz } = p
  const al = inclineDeg * DEG
  const cosA = Math.cos(al)
  const sinA = Math.sin(al)
  const k = Math.tan(Math.max(0, gammaDeg) * DEG)

  const H = profileTopIn(profile)
  const xMax = Math.max(...voidPolygon.map((q) => q[0]))
  const x0 = 0
  const dx = (xMax - x0) / nx
  const dy = H / ny
  const W = width.flightWidthIn
  const dz = W / nz

  const edges = buildSpillEdges(profile, spacingIn, width, end, p.crestHeightIn ?? null)
  const segs: SpillSeg[] = edges.map((e) => prepareSeg(e, k, cosA, sinA))
  const nSeg = segs.length

  // Which flight segment (if any) each z column belongs to.
  const zc = new Float64Array(nz)
  const inSeg = new Uint8Array(nz)
  for (let iz = 0; iz < nz; iz++) {
    const z = (iz + 0.5) * dz
    zc[iz] = z
    inSeg[iz] = width.segments.some((s) => z >= s.z0 && z < s.z1) ? 1 : 0
  }

  // 2D void mask, and world coordinates of each (x, y) cell.
  const nxy = nx * ny
  const mask = new Uint8Array(nxy)
  const Xw = new Float64Array(nxy)
  const Ew = new Float64Array(nxy)
  for (let ix = 0; ix < nx; ix++) {
    const x = x0 + (ix + 0.5) * dx
    for (let iy = 0; iy < ny; iy++) {
      const y = (iy + 0.5) * dy
      const i = ix * ny + iy
      mask[i] = pointInPolygon(x, y, voidPolygon) ? 1 : 0
      const [X, E] = toWorld(x, y, cosA, sinA)
      Xw[i] = X
      Ew[i] = E
    }
  }

  const ncol = nx * nz
  const count = new Uint16Array(ncol)
  const bottom = new Float32Array(ncol).fill(Number.NaN)
  const top = new Float32Array(ncol).fill(Number.NaN)
  const governing = new Uint8Array(ncol).fill(EDGE_NONE)
  const ghostTop = new Float32Array(ncol).fill(Number.NaN)

  const walled = end.kind !== 'open'
  let wallDepthArea = 0
  let wallMaxDepth = 0
  let total = 0
  const tol = 1e-9

  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      const i = ix * ny + iy
      if (!mask[i]) continue
      const X = Xw[i]
      const E = Ew[i] - tol
      const yc = (iy + 0.5) * dy
      for (let iz = 0; iz < nz; iz++) {
        if (!inSeg[iz]) continue
        const Z = zc[iz]
        let S = Infinity
        let held = true
        for (let e = 0; e < nSeg; e++) {
          const v = segMin(segs[e], X, Z)
          if (v < E) {
            held = false
            break
          }
          if (v < S) S = v
        }
        if (!held) continue
        total++
        const c = ix * nz + iz
        count[c]++
        if (!(bottom[c] <= yc)) bottom[c] = yc
        top[c] = yc
        if (walled && (iz === 0 || iz === nz - 1)) {
          const depth = S - Ew[i]
          if (depth > 0) {
            wallDepthArea += depth * dx * dy
            if (depth > wallMaxDepth) wallMaxDepth = depth
          }
        }
      }
    }
  }

  // Column tops and bottoms as cell edges, and the governing edge at the top.
  for (let ix = 0; ix < nx; ix++) {
    const x = x0 + (ix + 0.5) * dx
    // Ghost: walls at both ends is the 2D pocket extruded.
    const ys = Math.min(H, surfaceY(profile, inclineDeg, gammaDeg, x))
    let ghost = Number.NaN
    let firstVoidY = Number.NaN
    for (let iy = 0; iy < ny; iy++) {
      if (!mask[ix * ny + iy]) continue
      const yc = (iy + 0.5) * dy
      if (!(firstVoidY <= yc)) firstVoidY = yc
      if (yc <= ys + tol) ghost = yc + dy / 2
    }
    for (let iz = 0; iz < nz; iz++) {
      if (!inSeg[iz]) continue
      const c = ix * nz + iz
      ghostTop[c] = ghost
      if (Number.isNaN(firstVoidY)) continue
      let yProbe: number
      if (count[c] > 0) {
        bottom[c] -= dy / 2
        top[c] += dy / 2
        yProbe = top[c]
      } else {
        yProbe = firstVoidY
      }
      const [X] = toWorld(x, yProbe, cosA, sinA)
      let best = Infinity
      let gov = EDGE_NONE
      for (let e = 0; e < nSeg; e++) {
        const v = segMin(segs[e], X, zc[iz])
        if (v < best) {
          best = v
          gov = segs[e].kindIndex
        }
      }
      governing[c] = gov
    }
  }

  const cell = dx * dy * dz
  return {
    field: { nx, ny, nz, dx, dy, dz, x0, bottom, top, governing, count, ghostTop },
    edges,
    volumeIn3: total * cell,
    wallDepthAreaIn3: walled ? wallDepthArea / 2 : 0,
    wallMaxDepthIn: walled ? wallMaxDepth : 0,
  }
}
