// Field measurement helpers (plan §5): bulk density from a container and a
// scale, angle of repose from a poured pile.

export type VolumeUnit = 'gal' | 'qt' | 'L' | 'in3'
export type WeightUnit = 'lb' | 'oz' | 'kg' | 'g'

export const VOLUME_IN3: Record<VolumeUnit, number> = {
  gal: 231,
  qt: 57.75,
  L: 61.0237441,
  in3: 1,
}

export const WEIGHT_LB: Record<WeightUnit, number> = {
  lb: 1,
  oz: 1 / 16,
  kg: 2.20462262,
  g: 0.00220462262,
}

export const VOLUME_LABEL: Record<VolumeUnit, string> = {
  gal: 'US gallons',
  qt: 'US quarts',
  L: 'liters',
  in3: 'cubic inches',
}

export const WEIGHT_LABEL: Record<WeightUnit, string> = {
  lb: 'lb',
  oz: 'oz',
  kg: 'kg',
  g: 'g',
}

/** ρ = weight / volume, in lb/ft³. Null if either is missing or not positive. */
export function bulkDensityLbFt3(
  volume: number | null,
  volumeUnit: VolumeUnit,
  weight: number | null,
  weightUnit: WeightUnit,
): number | null {
  if (volume === null || weight === null || volume <= 0 || weight <= 0) return null
  const ft3 = (volume * VOLUME_IN3[volumeUnit]) / 1728
  return (weight * WEIGHT_LB[weightUnit]) / ft3
}

/** γ = atan(2h / D), degrees. Any consistent length unit. */
export function reposeFromPile(heightLen: number | null, diameterLen: number | null): number | null {
  if (heightLen === null || diameterLen === null || heightLen <= 0 || diameterLen <= 0) return null
  return (Math.atan((2 * heightLen) / diameterLen) * 180) / Math.PI
}
