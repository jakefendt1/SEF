// The 3D view's layers: what each one is, and whether it's showing. The
// toggles, the key and the scene all read this list.

export type LayerId = 'product' | 'ghost' | 'flights' | 'walls' | 'belt' | 'cuts'

export type LayerState = Record<LayerId, boolean> & {
  /** Colour the product by the edge it would spill from, or plain product amber. */
  colorByEdge: boolean
}

export const DEFAULT_LAYERS: LayerState = {
  product: true,
  ghost: true,
  flights: true,
  walls: true,
  belt: true,
  cuts: true,
  colorByEdge: true,
}

export const LAYER_INFO: Record<LayerId, { label: string; detail: string }> = {
  product: { label: 'Product', detail: 'What the pocket holds at this repose.' },
  ghost: { label: 'Full containment', detail: 'Grey mesh: what walls at both flight ends would hold. The gap to the product is the edge loss.' },
  flights: { label: 'Flights', detail: 'At their true profile.' },
  walls: { label: 'Sidewalls / guards', detail: 'Corrugated sidewalls drawn as their real wave; guards as flat plates.' },
  belt: { label: 'Belt', detail: '' },
  cuts: { label: 'Section cuts', detail: 'Where the side and end sections are taken.' },
}

export const LAYER_ORDER: LayerId[] = ['product', 'ghost', 'flights', 'walls', 'belt', 'cuts']
