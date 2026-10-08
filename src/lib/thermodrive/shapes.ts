// Shapes the configurator's 2D and 3D views share. Flights use the Bulk
// Density calculator's profiles (so a scoop has the bulletin's lip); the
// sidewall is drawn as what it is, a corrugated wall: a sine wave at the
// sidewall pitch, filling its footprint.
import { buildProfile } from '../tdBulkDensity/profiles'
import { IN } from './data'
import type { FlightVar } from './belt'

/**
 * A flight's side outline in mm: (u along belt travel, height). The product
 * face is u >= 0 at the base; the back face sits one thickness behind it. A
 * scoop's lip reaches forward over the product, in the direction of travel.
 */
export function flightOutline(v: Pick<FlightVar, 'flightType' | 'heightMm' | 'thicknessMm'>): [number, number][] {
  const t = v.thicknessMm
  const prof = buildProfile(v.flightType, v.heightMm / IN, t / IN)
  const face = prof.face.map(([u, h]) => [u * IN, h * IN] as [number, number])
  const back = [...face].reverse().map(([u, h]) => [u - t, h] as [number, number])
  return [...face, ...back]
}

/**
 * The sidewall's wave seen from above, from x = 0 to length: points (x, z)
 * in mm, z across the belt from `z0` (the footprint's edge). Amplitude keeps
 * the wall inside its footprint.
 */
export function sidewallWave(lengthMm: number, pitchMm: number, z0: number, { fp, th }: { fp: number; th: number }, stepsPerPitch = 16): [number, number][] {
  const mid = z0 + fp / 2
  const amp = Math.max(0, (fp - th) / 2)
  const n = Math.max(2, Math.ceil((lengthMm / pitchMm) * stepsPerPitch))
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = (lengthMm * i) / n
    return [x, mid + amp * Math.sin((2 * Math.PI * x) / pitchMm)] as [number, number]
  })
}
