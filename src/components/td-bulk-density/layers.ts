// The 3D view's layers: what each one is, and whether it's showing. The
// toggles, the key and the scene all read this list.

export type LayerId = 'product' | 'capacity' | 'ghost' | 'flights' | 'walls' | 'belt' | 'cuts'

export type LayerState = Record<LayerId, boolean> & {
  /** Colour the product by the edge it would spill from, or plain product amber. */
  colorByEdge: boolean
}

// By default the view shows one thing: the product your line actually
// carries, in plain product colour. Capacity, full containment and the
// spill-edge colours are analysis layers -- shown together by default they
// made a normal partial load look like overloaded flights.
export const DEFAULT_LAYERS: LayerState = {
  product: true,
  capacity: false,
  ghost: false,
  flights: true,
  walls: true,
  belt: true,
  cuts: false,
  colorByEdge: false,
}

export const LAYER_INFO: Record<LayerId, { label: string; detail: string }> = {
  product: {
    label: 'Your load',
    detail: 'What each pocket carries for your target throughput at your belt speed — or, without both, at your fill factor.',
  },
  capacity: {
    label: 'Pocket capacity',
    detail: 'Clear amber: the most a pocket can hold at this repose before it spills. Turn on to compare with your load.',
  },
  ghost: { label: 'Full containment', detail: 'Grey mesh: what walls at both flight ends would hold. The gap to the capacity is the edge loss.' },
  flights: { label: 'Flights', detail: 'At their true profile.' },
  walls: { label: 'Sidewalls / guards', detail: 'The far side only, so you can see in. Sidewalls drawn as their real corrugated wave.' },
  belt: { label: 'Belt', detail: '' },
  cuts: { label: 'Section cuts', detail: 'Where the side and end sections are taken.' },
}

export const LAYER_ORDER: LayerId[] = ['product', 'capacity', 'ghost', 'flights', 'walls', 'belt', 'cuts']
