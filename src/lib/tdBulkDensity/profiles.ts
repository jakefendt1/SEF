// Flight profiles as polylines (plan §3.1, §4.1).
//
// Each profile is the product-side (uphill) face in local (u, v): base at the
// origin, u along the belt uphill, v normal to the belt. The back face is the
// face shifted by -thickness along u -- acceptable for flights 0.28 in thick
// or less.
import { ANGLED_FLIGHT_DEG, SCOOP_LIPS } from './data/flights'
import type { FlightProfile, FlightType, Point } from './types'

const DEG = Math.PI / 180

/**
 * Build a flight profile. `override` is a CAD-verified face (from the dev-only
 * import) that replaces the parametric one without a code change.
 */
export function buildProfile(
  type: FlightType,
  heightIn: number,
  thicknessIn: number,
  override?: Point[] | null,
): FlightProfile {
  let face: Point[]

  const H = heightIn
  if (override && override.length >= 2) {
    face = override
  } else if (type === 'deg90') {
    face = [
      [0, 0],
      [0, H],
    ]
  } else if (type === 'deg75') {
    // Nominal height is the normal height; the tip leans uphill over its own
    // product, matching CalcLab's angled-flight diagram.
    face = [
      [0, 0],
      [H / Math.tan(ANGLED_FLIGHT_DEG * DEG), H],
    ]
  } else {
    // Body normal to the belt, then a straight lip bent toward the product.
    // H is the tip's normal height, not the body length (T18 depends on it).
    const { phiDeg, lipLengthIn } = SCOOP_LIPS[type]
    const lambda = (phiDeg - 90) * DEG
    const bodyIn = H - lipLengthIn * Math.sin(lambda)
    face = [
      [0, 0],
      [0, bodyIn],
      [lipLengthIn * Math.cos(lambda), H],
    ]
  }

  const tip = face[face.length - 1]
  return {
    type,
    // An imported face defines its own height.
    heightIn: override && override.length >= 2 ? tip[1] : heightIn,
    thicknessIn,
    face,
    tip,
    // Every parametric profile ships verified (plan §11 M8).
    verified: true,
  }
}

/** Scoop body length for a nominal height -- used in the UI's dimension callouts. */
export function scoopBodyIn(type: 'scoop' | 'shortTopScoop', heightIn: number): number {
  const { phiDeg, lipLengthIn } = SCOOP_LIPS[type]
  return heightIn - lipLengthIn * Math.sin((phiDeg - 90) * DEG)
}

/**
 * Dev-only profile import: a pasted point list ("u,v" per line, or a DXF
 * LWPOLYLINE's vertex list copied as pairs), base first, tip last.
 * Returns the parsed face or an error message.
 */
export function parsePointList(text: string): { face: Point[] } | { error: string } {
  const nums = text
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number)
  if (nums.some((n) => !Number.isFinite(n))) return { error: 'Every value must be a number.' }
  if (nums.length < 4 || nums.length % 2 !== 0) {
    return { error: 'Need at least two points, as u,v pairs.' }
  }
  const face: Point[] = []
  for (let i = 0; i < nums.length; i += 2) face.push([nums[i], nums[i + 1]])
  const [u0, v0] = face[0]
  if (Math.abs(u0) > 1e-6 || Math.abs(v0) > 1e-6) {
    return { error: 'The first point must be the flight base, at 0,0.' }
  }
  return { face }
}
