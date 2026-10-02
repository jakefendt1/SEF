// End section: the cross-width cut at a chosen point along the pocket
// (refs/diagrams/C_end-section-width-model). Drawn true to scale; clearances
// that are too small to see are labelled instead of exaggerated.
import { useRef } from 'react'
import type { TdComputed } from '@/lib/tdBulkDensity/compute'
import { indexAt, sliceAtX, sliceOutlines } from '@/lib/tdBulkDensity/fieldSlices'
import { EDGE_KINDS, type TdInputs } from '@/lib/tdBulkDensity/types'
import { formatLen, type UnitSystem } from '@/lib/tdBulkDensity/units'
import { guardActsAsWall } from '@/lib/tdBulkDensity/width'
import { CutSlider } from './CutSlider'
import { EDGE_COLORS, TD_COLORS } from './palette'

const K = 24 // px per inch

export function EndSection({
  result,
  inputs,
  cutX,
  cutZ,
  onCutX,
  onCutZ,
  system,
}: {
  result: TdComputed
  inputs: TdInputs
  cutX: number
  cutZ: number
  onCutX: (f: number) => void
  onCutZ: (f: number) => void
  system: UnitSystem
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const field = result.heap
  const width = result.width
  const profile = result.profile
  if (!field || !width || !profile) return null

  const Wb = inputs.beltWidthIn
  const H = profile.heightIn
  const off = width.flightOffsetIn
  const xMax = field.x0 + field.nx * field.dx
  const ix = indexAt(cutX, field.nx)
  const xIn = field.x0 + (ix + 0.5) * field.dx
  const slice = sliceAtX(field, ix)
  const shapes = sliceOutlines(slice, field.dz)
  const hasSidewalls = inputs.containment === 'sidewalls' || inputs.containment === 'sealed'
  const swH = inputs.containment === 'sealed' ? H : inputs.sidewallHeightIn
  const top = Math.max(H, hasSidewalls ? swH : 0) + 1.2

  const p = (z: number, y: number) => `${z * K},${-y * K}`
  const rect = (z0: number, z1: number, y0: number, y1: number) =>
    [p(z0, y0), p(z1, y0), p(z1, y1), p(z0, y1)].join(' ')

  // Text scales with the drawing so a narrow belt doesn't get giant labels.
  const fs = Math.max(9, ((Wb + 2.4) * K) / 48)
  const minX = -1.2 * K
  const maxX = (Wb + 1.2) * K
  const minY = -top * K - 10
  const maxY = 2.6 * K

  const cutZIn = indexAt(cutZ, field.nz)
  const zCut = off + (cutZIn + 0.5) * field.dz

  const dragTo = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    const z = pt.x / K - off
    onCutZ(Math.min(1, Math.max(0, z / width.flightWidthIn)))
  }

  const guardOpen = inputs.containment === 'guards' && inputs.guardClearanceIn !== null && !guardActsAsWall(inputs)

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          fontFamily="Helvetica, Arial, sans-serif"
          viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
          className="w-full h-auto min-w-[320px] touch-none select-none"
          role="img"
          aria-label={`End section ${formatLen(xIn, system)} uphill of the trailing flight. Flight width ${formatLen(width.flightWidthIn, system)}.`}
        >
          {/* Belt */}
          <polygon points={rect(0, Wb, -0.3, 0)} fill={TD_COLORS.belt} />

          {/* Hold-down zones (indents) */}
          {!hasSidewalls && (
            <>
              <polygon points={rect(0, width.left.indentIn, 0, 0.25)} fill={TD_COLORS.guard} opacity={0.25} />
              <polygon points={rect(Wb - width.right.indentIn, Wb, 0, 0.25)} fill={TD_COLORS.guard} opacity={0.25} />
              <text x={(width.left.indentIn / 2) * K} y={-0.45 * K} fontSize={fs - 2} textAnchor="middle" fill={TD_COLORS.dim}>hold-down</text>
              <text x={(Wb - width.right.indentIn / 2) * K} y={-0.45 * K} fontSize={fs - 2} textAnchor="middle" fill={TD_COLORS.dim}>hold-down</text>
            </>
          )}

          {/* Sidewalls: footprint outward of the gap */}
          {hasSidewalls &&
            [
              [width.left.indentIn, width.left.indentIn + width.left.footprintIn],
              [Wb - width.right.indentIn - width.right.footprintIn, Wb - width.right.indentIn],
            ].map(([a, b], i) => (
              <polygon key={i} points={rect(a, b, 0, swH)} fill={TD_COLORS.sidewall} opacity={0.85} stroke={TD_COLORS.beltShadow} />
            ))}

          {/* Frame guards: stationary plates at the measured clearance */}
          {inputs.containment === 'guards' && inputs.guardClearanceIn !== null &&
            [off - inputs.guardClearanceIn - 0.12, off + width.flightWidthIn + inputs.guardClearanceIn].map((z, i) => (
              <polygon key={i} points={rect(z, z + 0.12, 0.15, H + 0.4)} fill={TD_COLORS.guard} />
            ))}

          {/* Flight segments behind the cut */}
          {width.segments.map((sg, i) => (
            <polygon key={i} points={rect(off + sg.z0, off + sg.z1, 0, H)} fill={TD_COLORS.flight} opacity={0.18} stroke={TD_COLORS.flight} />
          ))}
          {width.notches.map((n, i) => (
            <text key={i} x={(off + (n.z0 + n.z1) / 2) * K} y={-(H + 0.25) * K} fontSize={fs - 2} textAnchor="middle" fill={EDGE_COLORS.notch}>notch</text>
          ))}

          {/* Product */}
          {shapes.map((sh, i) => (
            <polygon
              key={i}
              points={sh.points.map(([z, y]) => p(off + z, y)).join(' ')}
              fill={TD_COLORS.product}
              stroke={TD_COLORS.productDark}
              strokeWidth={1}
            />
          ))}
          {slice
            .filter((c) => !Number.isNaN(c.top) && c.governing !== 255)
            .map((c, i) => (
              <line
                key={i}
                x1={(off + c.pos - field.dz / 2) * K}
                x2={(off + c.pos + field.dz / 2) * K}
                y1={-c.top * K}
                y2={-c.top * K}
                stroke={EDGE_COLORS[EDGE_KINDS[c.governing]]}
                strokeWidth={3}
              />
            ))}
          {/* Ghost */}
          {width.segments.map((sg, i) => {
            const g = slice.find((c) => c.pos >= sg.z0 && c.pos < sg.z1 && !Number.isNaN(c.ghostTop))?.ghostTop
            return g === undefined ? null : (
              <line key={i} x1={(off + sg.z0) * K} x2={(off + sg.z1) * K} y1={-g * K} y2={-g * K} stroke={TD_COLORS.ghost} strokeWidth={2} strokeDasharray="6 5" />
            )
          })}

          {/* Dimensions */}
          <line x1={0} x2={Wb * K} y1={1.0 * K} y2={1.0 * K} stroke={TD_COLORS.dim} />
          <text x={(Wb / 2) * K} y={1.0 * K - 5} fontSize={fs} textAnchor="middle" fill={TD_COLORS.ink}>
            belt {formatLen(Wb, system)}
          </text>
          <line x1={off * K} x2={(off + width.flightWidthIn) * K} y1={1.9 * K} y2={1.9 * K} stroke={TD_COLORS.flight} />
          <text x={(off + width.flightWidthIn / 2) * K} y={1.9 * K - 5} fontSize={fs} textAnchor="middle" fill={TD_COLORS.ink}>
            flight (carry) {formatLen(width.flightWidthIn, system)}
          </text>
          {hasSidewalls && inputs.containment === 'sidewalls' && (
            <text x={(width.left.indentIn + width.left.footprintIn) * K} y={-(swH + 0.3) * K} fontSize={fs - 2} fill={TD_COLORS.dim}>
              gap {formatLen(width.left.gapIn, system)} · h {formatLen(swH, system)}
            </text>
          )}
          {guardOpen && (
            <text x={(Wb / 2) * K} y={-(top - 0.3) * K} fontSize={fs - 1} textAnchor="middle" fill={EDGE_COLORS.open}>
              Guard gap wider than the product: treated as open ends
            </text>
          )}

          {/* Side-section cut line, draggable */}
          <g
            onPointerDown={(e) => {
              ;(e.target as Element).setPointerCapture?.(e.pointerId)
              dragTo(e.clientX, e.clientY)
            }}
            onPointerMove={(e) => {
              if (e.buttons) dragTo(e.clientX, e.clientY)
            }}
            style={{ cursor: 'ew-resize' }}
          >
            <line x1={zCut * K} x2={zCut * K} y1={0} y2={-(H + 0.6) * K} stroke="transparent" strokeWidth={36} />
            <line x1={zCut * K} x2={zCut * K} y1={0} y2={-(H + 0.6) * K} stroke={TD_COLORS.ink} strokeWidth={2} strokeDasharray="8 4" />
            <circle cx={zCut * K} cy={-(H + 0.6) * K} r={8} fill="white" stroke={TD_COLORS.ink} strokeWidth={2} />
          </g>
        </svg>
      </div>
      <CutSlider
        id="end-cut-x"
        label={`Showing the cut ${formatLen(xIn, system)} uphill of the trailing flight (of ${formatLen(xMax, system)})`}
        value={cutX}
        onChange={onCutX}
      />
    </div>
  )
}
