// Layer toggles and key for the 3D view. Each row is a 48px tap target with
// a swatch that matches what's drawn; the product row carries the key for
// the spill-edge colours (the blended shades the heap is actually painted in).
import { Checkbox } from '@/components/ui/checkbox'
import { EDGE_KINDS } from '@/lib/tdBulkDensity/types'
import { LAYER_INFO, LAYER_ORDER, type LayerId, type LayerState } from './layers'
import { EDGE_LABEL, TD_COLORS, heapColor } from './palette'

function Swatch({ id }: { id: LayerId }) {
  const common = 'inline-block size-5 rounded shrink-0 border'
  switch (id) {
    case 'product':
      return <span className={common} style={{ background: TD_COLORS.product, borderColor: TD_COLORS.productDark }} />
    case 'ghost':
      return (
        <span
          className={common}
          style={{
            borderColor: TD_COLORS.ghost,
            background: `repeating-linear-gradient(45deg, transparent 0 3px, ${TD_COLORS.ghost}55 3px 4px)`,
          }}
        />
      )
    case 'flights':
      return <span className={common} style={{ background: TD_COLORS.flight, borderColor: TD_COLORS.beltShadow }} />
    case 'walls':
      return <span className={common} style={{ background: `${TD_COLORS.sidewall}73`, borderColor: TD_COLORS.sidewall }} />
    case 'belt':
      return <span className={common} style={{ background: TD_COLORS.belt, borderColor: TD_COLORS.beltShadow }} />
    case 'cuts':
      return <span className={common} style={{ background: `${TD_COLORS.ink}1f`, borderColor: TD_COLORS.ink, borderStyle: 'dashed' }} />
  }
}

export function LayerPanel({
  layers,
  onChange,
  edgeKinds,
  hasWalls,
}: {
  layers: LayerState
  onChange: (l: LayerState) => void
  /** Governing-edge kinds present in the heap (EDGE_KINDS indexes). */
  edgeKinds: number[]
  hasWalls: boolean
}) {
  const rows = LAYER_ORDER.filter((id) => id !== 'walls' || hasWalls)
  return (
    <fieldset className="rounded-lg border border-border bg-white px-3 py-2">
      <legend className="px-1 text-sm font-semibold text-foreground/80">Layers — tap to show or hide</legend>
      <ul className="grid gap-x-4 sm:grid-cols-2">
        {rows.map((id) => (
          <li key={id}>
            <label className="flex items-start gap-3 min-h-[48px] py-2 cursor-pointer">
              <Checkbox
                checked={layers[id]}
                onCheckedChange={(v) => onChange({ ...layers, [id]: v === true })}
                className="size-6 mt-0.5"
                aria-label={`Show ${LAYER_INFO[id].label}`}
              />
              <Swatch id={id} />
              <span className="text-base leading-snug">
                {LAYER_INFO[id].label}
                {LAYER_INFO[id].detail && (
                  <span className="block text-sm text-muted-foreground">{LAYER_INFO[id].detail}</span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {layers.product && (
        <div className="border-t border-border mt-1 pt-2 pb-1 space-y-1">
          <label className="flex items-center gap-3 min-h-[48px] cursor-pointer">
            <Checkbox
              checked={layers.colorByEdge}
              onCheckedChange={(v) => onChange({ ...layers, colorByEdge: v === true })}
              className="size-6"
            />
            <span className="text-base">Colour the product by where it would spill</span>
          </label>
          {layers.colorByEdge && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 pl-9 text-sm text-muted-foreground" aria-label="Product colour key">
              {edgeKinds.map((k) => {
                const kind = EDGE_KINDS[k]
                if (!kind) return null
                return (
                  <li key={kind} className="flex items-center gap-1.5">
                    <span className="inline-block size-4 rounded-sm" style={{ background: heapColor(kind) }} aria-hidden="true" />
                    {EDGE_LABEL[kind]}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </fieldset>
  )
}
