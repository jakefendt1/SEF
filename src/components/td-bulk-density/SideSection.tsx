// Side section: the travel-plane cut at a chosen point across the width,
// drawn in the real incline orientation (refs/diagrams/B_pocket-side-section).
import { useRef } from 'react'
import type { TdComputed } from '@/lib/tdBulkDensity/compute'
import { indexAt, sliceAtZ, sliceOutlines } from '@/lib/tdBulkDensity/fieldSlices'
import { leadingTipX, surfaceY } from '@/lib/tdBulkDensity/pocket2d'
import type { Point, TdInputs } from '@/lib/tdBulkDensity/types'
import { formatLen, type UnitSystem } from '@/lib/tdBulkDensity/units'
import { EDGE_KINDS } from '@/lib/tdBulkDensity/types'
import { EDGE_COLORS, TD_COLORS } from './palette'
import { CutSlider } from './CutSlider'

const K = 40 // px per inch in the SVG's own units
const DEG = Math.PI / 180

export function SideSection({
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
  const profile = result.profile
  if (!field || !profile || !result.width) return null

  const s = inputs.flightSpacingIn
  const al = inputs.inclineDeg * DEG
  const cosA = Math.cos(al)
  const sinA = Math.sin(al)
  const H = profile.heightIn
  const t = Math.max(profile.thicknessIn, 0.06)
  const xMax = field.x0 + field.nx * field.dx

  const w = (x: number, y: number): [number, number] => [
    (x * cosA - y * sinA) * K,
    -(x * sinA + y * cosA) * K,
  ]
  const pts = (list: [number, number][]) => list.map(([x, y]) => w(x, y).join(',')).join(' ')

  const flightPoly = (offset: number) => {
    const face = profile.face.map(([u, v]) => [offset + u, v] as [number, number])
    const back = [...profile.face].reverse().map(([u, v]) => [offset + u - t, v] as [number, number])
    return pts([...face, ...back])
  }

  const iz = indexAt(cutZ, field.nz)
  const zIn = (iz + 0.5) * field.dz
  const slice = sliceAtZ(field, iz)
  const shapes = sliceOutlines(slice, field.dx)

  // Ghost: full containment outline along x.
  const ghostPts: [number, number][] = slice
    .filter((c) => !Number.isNaN(c.ghostTop))
    .map((c) => [c.pos, c.ghostTop])

  // Free surface through the trailing tip (the 2D model's line).
  const [xT, yT] = profile.tip
  const theta = inputs.inclineDeg - result.gammaDynamicDeg
  const reach = theta > 0 ? xT + yT / Math.tan(theta * DEG) : Infinity
  const xEnd = Math.min(reach, leadingTipX(profile, s))
  const surface: [number, number][] = [
    [xT, yT],
    [xEnd, Math.max(0, surfaceY(profile, inputs.inclineDeg, result.gammaDynamicDeg, xEnd))],
  ]

  // Top-surface colouring by governing edge, one short segment per column.
  const topSegs = slice.filter((c) => !Number.isNaN(c.top) && c.governing !== 255)

  // Bounding box.
  const beltStart = -0.35 * s
  const beltEnd = leadingTipX(profile, s) + 0.35 * s
  // Only the points actually drawn: belt ends, flight tips, labels. Using
  // the corners of the whole box leaves a dead triangle once rotated.
  const corners: Point[] = [
    [beltStart, 0],
    [beltEnd, 0],
    [beltStart, -0.4],
    [beltEnd, -0.4],
    [xT - t - 0.3, H + 0.7],
    [s + xT + 0.3, H + 0.7],
    [-t - 1.6, H / 2],
    [s / 2, -1.3],
  ]
  const wc = corners.map(([x, y]) => w(x, y))
  const pad = 70
  const minX = Math.min(...wc.map((p) => p[0])) - pad
  const maxX = Math.max(...wc.map((p) => p[0])) + pad
  const minY = Math.min(...wc.map((p) => p[1])) - pad
  const maxY = Math.max(...wc.map((p) => p[1])) + pad

  const cutLineX = cutX * xMax
  const cutA = w(cutLineX, 0)
  const cutB = w(cutLineX, H + 0.3)

  // Drag the end-section cut line along the belt.
  const dragTo = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    const X = p.x / K
    const E = -p.y / K
    const x = X * cosA + E * sinA
    onCutX(Math.min(1, Math.max(0, x / xMax)))
  }

  const fs = 15
  const label = (x: number, y: number, text: string, anchor: 'start' | 'middle' | 'end' = 'middle') => {
    const [px, py] = w(x, y)
    return (
      <text x={px} y={py} fontSize={fs} textAnchor={anchor} fill={TD_COLORS.ink} paintOrder="stroke" stroke="white" strokeWidth={4}>
        {text}
      </text>
    )
  }

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
          aria-label={`Side section at ${formatLen(zIn, system)} across the flight. Pocket area ${result.pocketAreaIn2.toFixed(2)} square inches.`}
        >
          {/* Belt */}
          <polygon
            points={pts([
              [beltStart, 0],
              [beltEnd, 0],
              [beltEnd, -0.3],
              [beltStart, -0.3],
            ])}
            fill={TD_COLORS.belt}
          />
          {/* Product */}
          {shapes.map((sh, i) => (
            <polygon key={i} points={pts(sh.points)} fill={TD_COLORS.product} stroke={TD_COLORS.productDark} strokeWidth={1} />
          ))}
          {topSegs.map((c, i) => (
            <polyline
              key={i}
              points={pts([
                [c.pos - field.dx / 2, c.top],
                [c.pos + field.dx / 2, c.top],
              ])}
              stroke={EDGE_COLORS[EDGE_KINDS[c.governing]]}
              strokeWidth={4}
              fill="none"
            />
          ))}
          {/* Ghost: full containment */}
          {ghostPts.length > 1 && (
            <polyline points={pts(ghostPts)} fill="none" stroke={TD_COLORS.ghost} strokeWidth={2} strokeDasharray="6 5" />
          )}
          {/* Free-surface line through the overflow lip */}
          <polyline points={pts(surface)} fill="none" stroke={EDGE_COLORS.trailing} strokeWidth={1.5} strokeDasharray="3 4" />
          {/* Flights */}
          <polygon points={flightPoly(0)} fill={TD_COLORS.flight} stroke={TD_COLORS.beltShadow} />
          <polygon points={flightPoly(s)} fill={TD_COLORS.flight} stroke={TD_COLORS.beltShadow} />
          <circle cx={w(xT, yT)[0]} cy={w(xT, yT)[1]} r={5} fill={EDGE_COLORS.trailing} />

          {/* Horizontal reference and the incline angle */}
          <line x1={w(beltStart, 0)[0]} y1={w(beltStart, 0)[1]} x2={w(beltStart, 0)[0] + 4 * K} y2={w(beltStart, 0)[1]} stroke={TD_COLORS.dim} strokeDasharray="4 4" />
          <text x={w(beltStart, 0)[0] + 2.2 * K} y={w(beltStart, 0)[1] - 6} fontSize={fs} fill={TD_COLORS.dim}>
            α {inputs.inclineDeg}°
          </text>

          {/* Dimensions */}
          {label(-t - 0.25, H / 2, `H ${formatLen(H, system)}`, 'end')}
          {label(s / 2, -0.95, `s ${formatLen(s, system)}`)}
          {Number.isFinite(reach) && reach < s && label(reach, -0.95, `reach ${formatLen(reach, system)}`, 'start')}
          {label(xT, H + 0.45, 'trailing flight')}
          {label(s + xT, H + 0.45, 'leading flight')}

          {/* End-section cut line, draggable */}
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
            <line x1={cutA[0]} y1={cutA[1]} x2={cutB[0]} y2={cutB[1]} stroke="transparent" strokeWidth={36} />
            <line x1={cutA[0]} y1={cutA[1]} x2={cutB[0]} y2={cutB[1]} stroke={TD_COLORS.ink} strokeWidth={2} strokeDasharray="8 4" />
            <circle cx={cutB[0]} cy={cutB[1]} r={9} fill="white" stroke={TD_COLORS.ink} strokeWidth={2} />
          </g>
        </svg>
      </div>
      <CutSlider
        id="side-cut-z"
        label={`Showing the cut ${formatLen(zIn, system)} from the left flight end`}
        value={cutZ}
        onChange={onCutZ}
      />
    </div>
  )
}
