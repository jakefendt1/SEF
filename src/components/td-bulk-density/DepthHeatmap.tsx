// Depth heatmap (plan §7.3): product depth over the pocket footprint, seen
// from above, with the spill edges drawn on top. Tap a cell to read it.
import { useEffect, useRef, useState } from 'react'
import type { TdComputed } from '@/lib/tdBulkDensity/compute'
import { rankineKa } from '@/lib/tdBulkDensity/loads'
import { densityLbIn3 } from '@/lib/tdBulkDensity/throughput'
import { EDGE_KINDS, EDGE_NONE, type HeapField } from '@/lib/tdBulkDensity/types'
import { formatLen, formatQty, type UnitSystem } from '@/lib/tdBulkDensity/units'
import { DEPTH_RAMP, EDGE_COLORS, EDGE_LABEL } from './palette'

const PX = 4 // canvas px per x cell

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const RAMP = DEPTH_RAMP.map(hexToRgb)

function rampColor(t: number): string {
  const f = Math.min(1, Math.max(0, t)) * (RAMP.length - 1)
  const i = Math.min(RAMP.length - 2, Math.floor(f))
  const u = f - i
  const c = RAMP[i].map((v, k) => Math.round(v + (RAMP[i + 1][k] - v) * u))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

/** Product thickness in a column, normal to the belt. */
function depthOf(field: HeapField, c: number): number {
  return field.count[c] > 0 ? field.top[c] - field.bottom[c] : 0
}

export function DepthHeatmap({ result, system }: { result: TdComputed; system: UnitSystem }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sel, setSel] = useState<{ ix: number; iz: number } | null>(null)
  const field = result.heap
  const width = result.width

  let maxDepth = 0
  if (field) for (let c = 0; c < field.top.length; c++) maxDepth = Math.max(maxDepth, depthOf(field, c))

  const xMax = field ? field.x0 + field.nx * field.dx : 1
  const W = width?.flightWidthIn ?? 1
  const cw = field ? field.nx * PX : 0
  const ch = field ? Math.round(Math.min(Math.max((cw * W) / xMax, 140), 900)) : 0

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !field || !width) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const cellH = ch / field.nz
    ctx.clearRect(0, 0, cw, ch)
    for (let ix = 0; ix < field.nx; ix++) {
      for (let iz = 0; iz < field.nz; iz++) {
        const c = ix * field.nz + iz
        // z = 0 (left flight end) at the top.
        const y = iz * cellH
        if (field.governing[c] === EDGE_NONE) {
          ctx.fillStyle = '#FFFFFF'
        } else if (field.count[c] === 0) {
          ctx.fillStyle = '#EEF0F3'
        } else {
          ctx.fillStyle = rampColor(maxDepth > 0 ? depthOf(field, c) / maxDepth : 0)
        }
        ctx.fillRect(ix * PX, y, PX + 0.5, cellH + 0.5)
      }
    }
    // Spill edges, in plan view.
    const zx = (z: number) => (z / W) * ch
    const xx = (x: number) => ((x - field.x0) / (xMax - field.x0)) * cw
    // Edges mostly lie on the map's border, so draw them thick enough that
    // the inner half still reads.
    ctx.lineWidth = 10
    for (const e of result.spillEdges) {
      ctx.strokeStyle = EDGE_COLORS[e.kind]
      ctx.beginPath()
      ctx.moveTo(xx(e.q0[0]), zx(e.q0[2]))
      ctx.lineTo(xx(e.q1[0]), zx(e.q1[2]))
      ctx.stroke()
    }
    if (sel) {
      ctx.strokeStyle = '#1F2937'
      ctx.lineWidth = 2
      ctx.strokeRect(sel.ix * PX - 1, sel.iz * cellH - 1, PX + 2, cellH + 2)
    }
  }, [field, width, result.spillEdges, sel, cw, ch, maxDepth, W, xMax])

  if (!field || !width) return null

  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const ix = Math.min(field.nx - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * field.nx)))
    const iz = Math.min(field.nz - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * field.nz)))
    setSel({ ix, iz })
  }

  let readout: React.ReactNode = 'Tap the map to read depth, which edge governs, and the side pressure there.'
  if (sel) {
    const c = sel.ix * field.nz + sel.iz
    const x = field.x0 + (sel.ix + 0.5) * field.dx
    const z = (sel.iz + 0.5) * field.dz
    const g = field.governing[c]
    const d = depthOf(field, c)
    const cosA = Math.cos((result.inputs.inclineDeg * Math.PI) / 180)
    // Lateral pressure at the bottom of this column if a wall stood here:
    // Rankine K_a · ρ · vertical depth.
    const p = rankineKa(result.gammaDynamicDeg) * densityLbIn3(result.inputs.densityLbFt3) * d * cosA
    readout =
      g === EDGE_NONE ? (
        <>Notch at {formatLen(z, system)} across — no flight here, nothing carried.</>
      ) : (
        <>
          <strong>{formatLen(x, system)}</strong> uphill, <strong>{formatLen(z, system)}</strong> across: depth{' '}
          <strong>{formatLen(d, system)}</strong>
          {d > 0 && (
            <>
              {' '}· side pressure at the belt <strong>{formatQty(p, 'pressure', system)}</strong>
            </>
          )}
          <br />
          <span style={{ color: EDGE_COLORS[EDGE_KINDS[g]] }}>■</span> {EDGE_LABEL[EDGE_KINDS[g]]}
        </>
      )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Looking down on one pocket: trailing flight on the left, leading flight on the right, left flight end at the top.
      </p>
      <canvas
        ref={canvasRef}
        width={cw}
        height={ch}
        onPointerDown={pick}
        onPointerMove={(e) => {
          if (e.pointerType === 'mouse' || e.buttons) pick(e)
        }}
        className="block mx-auto max-w-full w-auto h-auto max-h-[26rem] rounded-lg border border-border touch-pan-y cursor-crosshair"
        role="img"
        aria-label={`Product depth map. Deepest point ${formatLen(maxDepth, system)}.`}
      />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>0</span>
        <span
          className="h-3 flex-1 max-w-48 rounded"
          style={{ background: `linear-gradient(to right, ${DEPTH_RAMP.join(',')})` }}
          aria-hidden="true"
        />
        <span>{formatLen(maxDepth, system)} deep</span>
        <span className="ml-3 inline-block size-3 rounded-sm border border-border bg-[#EEF0F3]" aria-hidden="true" />
        <span>spilled</span>
      </div>
      <p className="text-base rounded-lg bg-secondary/40 px-3 py-2 min-h-[48px]" aria-live="polite">
        {readout}
      </p>
    </div>
  )
}
