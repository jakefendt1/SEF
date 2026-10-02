import { EDGE_KINDS } from '@/lib/tdBulkDensity/types'
import { EDGE_COLORS, EDGE_LABEL, TD_COLORS } from './palette'

/** Colour key for the governing spill edge -- shared by every view. */
export function EdgeLegend({ kinds, ghost = true }: { kinds: number[]; ghost?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label="Colour key">
      {kinds.map((k) => {
        const kind = EDGE_KINDS[k]
        if (!kind) return null
        return (
          <li key={kind} className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm" style={{ background: EDGE_COLORS[kind] }} aria-hidden="true" />
            {EDGE_LABEL[kind]}
          </li>
        )
      })}
      {ghost && (
        <li className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 border-t-2 border-dashed"
            style={{ borderColor: TD_COLORS.ghost }}
            aria-hidden="true"
          />
          Full containment (walls at both ends)
        </li>
      )}
    </ul>
  )
}
