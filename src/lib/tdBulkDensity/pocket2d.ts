// The pocket in the travel plane (plan §3.2).
//
// The trailing flight's base sits at x = 0, the leading flight's at x = s.
// The void polygon is everything product could occupy between them; the free
// surface through the trailing tip (the overflow lip) cuts it down to the
// pocket. One method covers every CalcLab case: surface clears the next
// flight, meets it, or product stacks level with the tips.
import type { FlightProfile, GeometricCase, Point } from './types'

const DEG = Math.PI / 180

/** x of the leading flight's back-face tip: the right-hand wall of the pocket at the top. */
export function leadingTipX(profile: FlightProfile, spacingIn: number): number {
  return spacingIn + profile.tip[0] - profile.thicknessIn
}

/** Highest point of the profile -- the top of the modelled region. */
export function profileTopIn(profile: FlightProfile): number {
  return Math.max(...profile.face.map((p) => p[1]))
}

/**
 * Closed, counter-clockwise void polygon (plan §3.2 step 1). Traced clockwise
 * as the plan lists it, then reversed.
 */
export function buildVoidPolygon(profile: FlightProfile, spacingIn: number): Point[] {
  const H = profileTopIn(profile)
  const yBig = 10 * H
  const tipU = profile.tip[0]
  const back = (p: Point): Point => [spacingIn + p[0] - profile.thicknessIn, p[1]]
  const leadTipX = leadingTipX(profile, spacingIn)

  const cw: Point[] = [
    ...profile.face, // trailing face, base -> tip
    [tipU, yBig], // straight up from the trailing tip
    [leadTipX, yBig], // across the top
    ...[...profile.face].reverse().map(back), // leading back face, tip -> base
  ]
  // Closing edge runs along the belt back to the trailing base.
  return dedupe(cw).reverse()
}

function dedupe(points: Point[]): Point[] {
  const out: Point[] = []
  for (const p of points) {
    const last = out[out.length - 1]
    if (!last || Math.abs(last[0] - p[0]) > 1e-12 || Math.abs(last[1] - p[1]) > 1e-12) out.push(p)
  }
  return out
}

/** θ = α − γ_d: the free surface's slope relative to the belt. */
export function surfaceAngleDeg(inclineDeg: number, gammaDeg: number): number {
  return inclineDeg - gammaDeg
}

/**
 * Free surface height y_s(x) through the trailing tip (plan §3.2 step 2).
 * For θ ≤ 0 product stacks level with the tips.
 */
export function surfaceY(profile: FlightProfile, inclineDeg: number, gammaDeg: number, x: number) {
  const [xT, yT] = profile.tip
  const theta = surfaceAngleDeg(inclineDeg, gammaDeg)
  if (theta <= 0) return yT
  return yT - (x - xT) * Math.tan(theta * DEG)
}

export function ringArea(ring: readonly Point[]): number {
  let a = 0
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    a += x1 * y2 - x2 * y1
  }
  return a / 2
}

export interface Pocket2D {
  voidPolygon: Point[]
  rings: Point[][]
  areaIn2: number
  geometricCase: GeometricCase
}

export function computePocket2D(
  profile: FlightProfile,
  spacingIn: number,
  inclineDeg: number,
  gammaDeg: number,
): Pocket2D {
  const voidPolygon = buildVoidPolygon(profile, spacingIn)
  const [xT, yT] = profile.tip
  const theta = surfaceAngleDeg(inclineDeg, gammaDeg)

  const clipped = clipBelowSurface(voidPolygon, profile, inclineDeg, gammaDeg)
  const rings: Point[][] = clipped.length >= 3 ? [clipped] : []
  const areaIn2 = rings.length ? Math.abs(ringArea(clipped)) : 0

  let geometricCase: GeometricCase
  if (theta <= 0) {
    geometricCase = 'level'
  } else {
    // Does the surface still have height where the leading flight's back face
    // meets the belt?
    const leadBaseX = spacingIn - profile.thicknessIn
    const reach = xT + yT / Math.tan(theta * DEG)
    geometricCase = reach > leadBaseX + 1e-9 ? 'meets' : 'clears'
  }

  return { voidPolygon, rings, areaIn2, geometricCase }
}

/** Plain-language wording for the geometric case (plan §6). */
export const CASE_WORDING: Record<GeometricCase, string> = {
  clears: 'Product surface clears the next flight.',
  meets: 'Product surface meets the next flight.',
  level: 'Product stacks level with the flight tips.',
}

/**
 * Clip a polygon to the half-plane below the free surface, {y <= y_s(x)}.
 *
 * Exact for one half-plane. The plan suggested polygon-clipping here, but the
 * surface always passes through the trailing tip -- a polygon vertex -- and
 * that library's ring builder throws on exactly that degenerate case (it
 * failed on the scoop profiles). A non-convex result comes back as one ring
 * joined by zero-area bridges along the surface line, which leaves the area
 * exact; the 3D heap reads the unclipped void polygon, not this ring.
 */
export function clipBelowSurface(
  poly: readonly Point[],
  profile: FlightProfile,
  inclineDeg: number,
  gammaDeg: number,
): Point[] {
  const [xT, yT] = profile.tip
  const theta = surfaceAngleDeg(inclineDeg, gammaDeg)
  const m = theta <= 0 ? 0 : Math.tan(theta * DEG)
  // Signed distance-like value: <= 0 means kept.
  const f = (p: Point) => p[1] - (yT - (p[0] - xT) * m)
  const eps = 1e-12
  const out: Point[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const fa = f(a)
    const fb = f(b)
    if (fa <= eps) out.push(a)
    if ((fa < -eps && fb > eps) || (fa > eps && fb < -eps)) {
      const t = fa / (fa - fb)
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
    }
  }
  return dedupe(out)
}

/** Even-odd point-in-polygon test. */
export function pointInPolygon(x: number, y: number, poly: readonly Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
