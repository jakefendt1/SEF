// Product presets (plan §5). These are starting estimates, NOT Intralox data.
// The UI must label them "Typical range — confirm with customer".

export interface ProductPreset {
  id: string
  label: string
  /** Typical bulk density range, lb/ft³. */
  densityRange: [number, number]
  densityLbFt3: number
  reposeDeg: number
  smallestDimIn: number
}

export const PRODUCT_PRESETS: ProductPreset[] = [
  { id: 'potato-chips', label: 'Potato chips, thin cut', densityRange: [4, 7], densityLbFt3: 5.5, reposeDeg: 40, smallestDimIn: 1.0 },
  { id: 'kettle-chips', label: 'Kettle chips', densityRange: [7, 10], densityLbFt3: 8.0, reposeDeg: 40, smallestDimIn: 1.0 },
  { id: 'tortilla-chips', label: 'Tortilla chips', densityRange: [8, 14], densityLbFt3: 11, reposeDeg: 38, smallestDimIn: 1.0 },
  { id: 'corn-chips', label: 'Corn chips (extruded/fried)', densityRange: [12, 18], densityLbFt3: 15, reposeDeg: 35, smallestDimIn: 0.5 },
  { id: 'puffs', label: 'Extruded puffs / cheese curls', densityRange: [3, 6], densityLbFt3: 4.5, reposeDeg: 35, smallestDimIn: 0.5 },
  { id: 'popcorn', label: 'Popcorn, popped', densityRange: [1.5, 3], densityLbFt3: 2.2, reposeDeg: 40, smallestDimIn: 0.75 },
  { id: 'pretzel-twists', label: 'Pretzels, twists', densityRange: [12, 18], densityLbFt3: 15, reposeDeg: 35, smallestDimIn: 0.75 },
  { id: 'pretzel-sticks', label: 'Pretzels, sticks/rods', densityRange: [15, 22], densityLbFt3: 18, reposeDeg: 30, smallestDimIn: 0.2 },
  { id: 'crackers', label: 'Small crackers / bites', densityRange: [15, 22], densityLbFt3: 18, reposeDeg: 30, smallestDimIn: 0.5 },
  { id: 'pellets', label: 'Snack pellets (unexpanded)', densityRange: [30, 40], densityLbFt3: 35, reposeDeg: 28, smallestDimIn: 0.15 },
  { id: 'nuts', label: 'Peanuts / tree nuts', densityRange: [35, 42], densityLbFt3: 38, reposeDeg: 30, smallestDimIn: 0.3 },
  { id: 'croutons', label: 'Croutons', densityRange: [10, 16], densityLbFt3: 13, reposeDeg: 35, smallestDimIn: 0.5 },
  { id: 'cereal-flakes', label: 'RTE cereal, flakes', densityRange: [6, 10], densityLbFt3: 8, reposeDeg: 35, smallestDimIn: 0.4 },
  { id: 'cereal-puffed', label: 'RTE cereal, puffed', densityRange: [3, 6], densityLbFt3: 4.5, reposeDeg: 32, smallestDimIn: 0.3 },
]

export const CUSTOM_PRODUCT_ID = 'custom'

export function findPreset(id: string): ProductPreset | undefined {
  return PRODUCT_PRESETS.find((p) => p.id === id)
}
