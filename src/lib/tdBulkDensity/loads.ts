// Edge loads on sidewalls and guards (plan §3.6).
//
// Lateral pressure on a containing wall uses the Rankine active coefficient
// with internal friction angle φ ≈ γ_d (the lower angle is the conservative
// one: it gives the larger K_a).
import type { WallLoad } from './types'

const DEG = Math.PI / 180

export function rankineKa(phiDeg: number): number {
  const s = Math.sin(phiDeg * DEG)
  return (1 - s) / (1 + s)
}

/**
 * @param densityLbIn3 bulk density, lb/in³
 * @param depthAreaIn3 ∫ depth dA over the wetted wall, from the heap
 * @param maxDepthIn deepest wetted point below the free surface
 */
export function wallLoad(
  phiDeg: number,
  densityLbIn3: number,
  depthAreaIn3: number,
  maxDepthIn: number,
): WallLoad {
  const Ka = rankineKa(phiDeg)
  return {
    maxPressurePsi: Ka * densityLbIn3 * maxDepthIn,
    forcePerPocketLbf: Ka * densityLbIn3 * depthAreaIn3,
  }
}

/** Stationary guards drag on the product: F_drag = μ_w · F_wall per pocket per side. */
export function guardDragPerPocket(mu: number, wallForceLbf: number): number {
  return mu * wallForceLbf
}

/** Total guard drag on the incline, both sides, for the belt-pull calc. */
export function guardDragTotal(
  dragPerPocketLbf: number,
  inclineLengthFt: number,
  spacingIn: number,
): number {
  const pockets = (inclineLengthFt * 12) / spacingIn
  return dragPerPocketLbf * 2 * pockets
}
