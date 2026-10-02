// A small SVG line chart for the sweeps. One y axis, thin 2px lines, a
// recessive grid, direct labels at the line ends plus a legend, a crosshair
// readout that works by tap as well as by pointer (no hover-only reading on a
// tablet), and a table view.
import { useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { TD_COLORS } from './palette'

export interface ChartSeries {
  id: string
  label: string
  color: string
  points: { x: number; y: number | null }[]
  dashed?: boolean
}

const W = 640
const Hh = 300
const M = { l: 64, r: 132, t: 16, b: 46 }

function niceMax(v: number): number {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p
  return 10 * p
}

export function LineChart({
  title,
  series,
  markers = [],
  current,
  disallowedBelow,
  xLabel,
  yLabel,
  formatX,
  formatY,
  pickLabel,
  onPick,
}: {
  title: string
  series: ChartSeries[]
  markers?: { x: number; y: number | null; color: string }[]
  current?: number | null
  disallowedBelow?: number | null
  xLabel: string
  yLabel: string
  formatX: (x: number) => string
  formatY: (y: number) => string
  /** Label for the apply button, e.g. "Use 4 in sidewalls". Null = not pickable here. */
  pickLabel?: (x: number) => string | null
  onPick?: (x: number) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [sel, setSel] = useState<number | null>(null)
  const [asTable, setAsTable] = useState(false)

  const xs = series[0]?.points.map((p) => p.x) ?? []
  const x0 = xs[0] ?? 0
  const x1 = xs[xs.length - 1] ?? 1
  const yMax = useMemo(
    () => niceMax(Math.max(0, ...series.flatMap((s) => s.points.map((p) => p.y ?? 0)), ...markers.map((m) => m.y ?? 0))),
    [series, markers],
  )
  const px = (x: number) => M.l + ((x - x0) / (x1 - x0 || 1)) * (W - M.l - M.r)
  const py = (y: number) => Hh - M.b - (y / yMax) * (Hh - M.t - M.b)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax)
  const xTicks = Array.from({ length: 6 }, (_, i) => x0 + ((x1 - x0) * i) / 5)

  const pathFor = (s: ChartSeries) => {
    let d = ''
    let pen = false
    for (const p of s.points) {
      if (p.y === null) {
        pen = false
        continue
      }
      d += `${pen ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`
      pen = true
    }
    return d
  }

  const pickAt = (clientX: number) => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm || xs.length === 0) return
    const p = new DOMPoint(clientX, 0).matrixTransform(ctm.inverse())
    const x = x0 + ((p.x - M.l) / (W - M.l - M.r)) * (x1 - x0)
    // Snap to a computed sample, or to the nearest marker when there are markers.
    const candidates = markers.length ? markers.map((m) => m.x) : xs
    const nearest = candidates.reduce((b, c) => (Math.abs(c - x) < Math.abs(b - x) ? c : b), candidates[0])
    setSel(nearest)
  }

  const readout =
    sel === null
      ? null
      : series.map((s) => {
          const pt = s.points.reduce((b, c) => (Math.abs(c.x - sel) < Math.abs(b.x - sel) ? c : b), s.points[0])
          const mk = markers.find((m) => Math.abs(m.x - sel) < 1e-9)
          const y = mk && s === series[0] ? mk.y : pt?.y
          return { s, y }
        })

  // Direct labels at the right end, nudged apart so they don't collide.
  const endLabels = series
    .map((s) => {
      const last = [...s.points].reverse().find((p) => p.y !== null)
      return last ? { s, y: py(last.y as number) } : null
    })
    .filter((v): v is { s: ChartSeries; y: number } => v !== null)
    .sort((a, b) => a.y - b.y)
  for (let i = 1; i < endLabels.length; i++) {
    if (endLabels[i].y - endLabels[i - 1].y < 16) endLabels[i].y = endLabels[i - 1].y + 16
  }

  const apply = sel !== null && pickLabel ? pickLabel(sel) : null

  return (
    <figure className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <figcaption className="text-base font-semibold">{title}</figcaption>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="min-h-[44px] px-3 text-sm font-semibold text-brand underline"
        >
          {asTable ? 'Show chart' : 'Show as table'}
        </button>
      </div>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono-num">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 pr-3 font-medium">{xLabel}</th>
                {series.map((s) => (
                  <th key={s.id} className="py-1 pr-3 font-medium">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {xs.map((x, i) => (
                <tr key={i} className="border-t border-border/60">
                  <td className="py-1 pr-3">{formatX(x)}</td>
                  {series.map((s) => (
                    <td key={s.id} className="py-1 pr-3">{s.points[i]?.y == null ? '—' : formatY(s.points[i].y as number)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${Hh}`}
            className="w-full h-auto min-w-[320px] touch-pan-y select-none"
            role="img"
            aria-label={`${title}. Use “Show as table” for the values.`}
            onPointerDown={(e) => pickAt(e.clientX)}
            onPointerMove={(e) => {
              if (e.pointerType === 'mouse' || e.buttons) pickAt(e.clientX)
            }}
          >
            {disallowedBelow != null && disallowedBelow > x0 && (
              <>
                <rect x={M.l} y={M.t} width={Math.max(0, px(Math.min(disallowedBelow, x1)) - M.l)} height={Hh - M.t - M.b} fill={TD_COLORS.dim} opacity={0.1} />
                <text x={M.l + 6} y={M.t + 14} fontSize={12} fill={TD_COLORS.dim}>below minimum</text>
              </>
            )}
            {yTicks.map((t, i) => (
              <g key={i}>
                <line x1={M.l} x2={W - M.r} y1={py(t)} y2={py(t)} stroke="#E5E7EB" />
                <text x={M.l - 8} y={py(t) + 4} fontSize={12} textAnchor="end" fill={TD_COLORS.dim}>{formatY(t)}</text>
              </g>
            ))}
            {xTicks.map((t, i) => (
              <text key={i} x={px(t)} y={Hh - M.b + 18} fontSize={12} textAnchor="middle" fill={TD_COLORS.dim}>{formatX(t)}</text>
            ))}
            <text x={(M.l + W - M.r) / 2} y={Hh - 6} fontSize={12} textAnchor="middle" fill={TD_COLORS.ink}>{xLabel}</text>
            <text x={14} y={(M.t + Hh - M.b) / 2} fontSize={12} textAnchor="middle" fill={TD_COLORS.ink} transform={`rotate(-90 14 ${(M.t + Hh - M.b) / 2})`}>{yLabel}</text>
            <line x1={M.l} x2={W - M.r} y1={py(0)} y2={py(0)} stroke="#9CA3AF" />

            {current != null && current >= x0 && current <= x1 && (
              <>
                <line x1={px(current)} x2={px(current)} y1={M.t} y2={Hh - M.b} stroke={TD_COLORS.ink} strokeDasharray="2 4" />
                <text x={px(current) + 4} y={M.t + 12} fontSize={11} fill={TD_COLORS.ink}>now</text>
              </>
            )}

            {series.map((s) => (
              <path key={s.id} d={pathFor(s)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? '6 5' : undefined} strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {markers.map((m, i) =>
              m.y === null ? null : (
                <circle key={i} cx={px(m.x)} cy={py(m.y)} r={6} fill={m.color} stroke="white" strokeWidth={2} />
              ),
            )}
            {endLabels.map(({ s, y }) => (
              <text key={s.id} x={W - M.r + 8} y={y + 4} fontSize={12} fill={TD_COLORS.ink}>
                <tspan fill={s.color}>■ </tspan>
                {s.label}
              </text>
            ))}

            {sel !== null && (
              <line x1={px(sel)} x2={px(sel)} y1={M.t} y2={Hh - M.b} stroke={TD_COLORS.ink} strokeWidth={1} />
            )}
            {readout?.map(({ s, y }) =>
              y == null ? null : <circle key={s.id} cx={px(sel as number)} cy={py(y)} r={5} fill={s.color} stroke="white" strokeWidth={2} />,
            )}
          </svg>
        </div>
      )}

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label="Legend">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5">
            <span className={cn('inline-block w-4 border-t-2', s.dashed && 'border-dashed')} style={{ borderColor: s.color }} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>

      {readout && !asTable && (
        <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1" aria-live="polite">
          <span className="text-base font-semibold">{formatX(sel as number)}</span>
          {readout.map(({ s, y }) => (
            <span key={s.id} className="text-base">
              <span style={{ color: s.color }}>■</span> {s.label}: <span className="font-mono-num font-semibold">{y == null ? '—' : formatY(y)}</span>
            </span>
          ))}
          {apply && onPick && (
            <button
              type="button"
              onClick={() => onPick(sel as number)}
              className="ml-auto min-h-[44px] px-4 rounded-lg bg-brand text-white font-semibold"
            >
              {apply}
            </button>
          )}
        </div>
      )}
      {!readout && !asTable && <p className="text-sm text-muted-foreground">Tap the chart to read a point{onPick ? ' and use it' : ''}.</p>}
    </figure>
  )
}
