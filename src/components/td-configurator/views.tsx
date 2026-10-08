// The configurator's 2D views, redrawn from Patrick's (drawTop, drawTopFinal,
// drawCross, drawSummary) over the shared engine, in the hub's light theme.
// Schematic: lengths along the belt and across it are scaled separately, as
// in his. Conflicts are drawn in red where they are.
import type { ReactNode } from 'react'
import { effective, flightMult, pitchMm, sidewallFootprint, type TdBelt } from '@/lib/thermodrive/belt'
import { VGUIDE_WIDTH_MM } from '@/lib/thermodrive/data'
import { fmtMm } from '@/lib/thermodrive/format'
import { driveBands, finalSpacingInfo, flightSegments, segHeight, vgChannels, vgPositions } from '@/lib/thermodrive/geometry'
import { summaryRows } from '@/lib/thermodrive/summary'
import { COLORS, beltEdge, beltFill } from './colors'
import type { UnitSystem } from '@/lib/tdBulkDensity/units'

function Empty({ children, h = 160 }: { children: ReactNode; h?: number }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border bg-secondary/40 px-4 text-center text-base text-muted-foreground" style={{ minHeight: h }}>
      {children}
    </div>
  )
}

/** Center a label over its dimension, unless the span is short: then hang it off the inner end so it stays on the page. */
function labelAt(x1: number, x2: number): { x: number; textAnchor: 'start' | 'middle' | 'end' } {
  if (x2 - x1 >= 160) return { x: (x1 + x2) / 2, textAnchor: 'middle' }
  return x1 < 450 ? { x: x1, textAnchor: 'start' } : { x: x2, textAnchor: 'end' }
}

function HDim({ x1, x2, y, label, color = COLORS.dim }: { x1: number; x2: number; y: number; label: string; color?: string }) {
  return (
    <g stroke={color} fill={color}>
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <text {...labelAt(x1, x2)} y={y - 6} fontSize={15} stroke="none">
        {label}
      </text>
    </g>
  )
}

function Travel({ x, y }: { x: number; y: number }) {
  return (
    <g fill="#64748b" stroke="#64748b">
      <line x1={x} y1={y} x2={x + 70} y2={y} strokeWidth={2} />
      <path d={`M${x + 70} ${y - 5} L${x + 80} ${y} L${x + 70} ${y + 5} Z`} stroke="none" />
      <text x={x + 88} y={y + 4} fontSize={15} stroke="none">
        belt travel
      </text>
    </g>
  )
}

/** Which flight pieces are in conflict: overrun, or too close to a sidewall. */
function flightTrouble(warnIds: Set<string>, i: number): boolean {
  return warnIds.has(`notch-over-${i}`) || warnIds.has(`sidewall-gap-${i}`)
}

/** Top view from the splice: the first four flights of each variation. */
export function TopView({ belt, system, warnIds, id }: { belt: TdBelt; system: UnitSystem; warnIds: Set<string>; id?: string }) {
  const b = effective(belt)
  if (!(b.widthMm > 0)) return <Empty>Enter a belt width to see the top view.</Empty>
  const W = 900
  const mx = 50
  const my = 70
  const bw = W - 2 * mx
  const bh = 220
  const p = pitchMm(b)
  const mult = flightMult(b)
  const maxStart = Math.max(...b.vars.map((v) => v.startRow))
  const windowRows = b.flightsOn ? maxStart + 3 * mult + 1.5 : 12
  const L = windowRows * p
  const X = (mm: number) => mx + (mm / L) * bw
  const Y = (mm: number) => my + (mm / b.widthMm) * bh
  const H = my + bh + 90
  const fp = b.sidewallsOn ? sidewallFootprint(b).fp : 0
  const drives = driveBands(b)
  const v0 = b.vars[0]
  return (
    <svg id={id} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Top view of the belt from the splice">
      <rect width={W} height={H} fill="#fff" />
      <Travel x={mx} y={28} />
      <rect x={mx} y={my} width={bw} height={bh} rx={6} fill={beltFill(b)} stroke={beltEdge(b)} strokeWidth={2} />
      {Array.from({ length: Math.floor(windowRows) + 1 }, (_, r) =>
        drives.map(([a, c], k) => (
          <rect key={`${r}-${k}`} x={X(r * p) - 1.5} y={Y(Math.max(0, a))} width={3} height={Y(Math.min(b.widthMm, c)) - Y(Math.max(0, a))} fill={COLORS.drive} opacity={0.35} />
        )),
      )}
      {b.sidewallsOn &&
        [b.sidewallInsetMm, ...(b.sidewallsBoth ? [b.widthMm - b.sidewallInsetMm - fp] : [])].map((y0) => (
          <rect key={y0} x={mx} y={Y(y0)} width={bw} height={Math.max(3, Y(y0 + fp) - Y(y0))} fill={COLORS.sidewall} opacity={0.75} />
        ))}
      {b.vgOn &&
        vgPositions(b).map((c) => (
          <rect key={c} x={mx} y={Y(c - VGUIDE_WIDTH_MM / 2)} width={bw} height={Math.max(2, Y(c + VGUIDE_WIDTH_MM / 2) - Y(c - VGUIDE_WIDTH_MM / 2))} fill={COLORS.vguide} opacity={0.5} />
        ))}
      <line x1={X(0.5 * p)} y1={my - 14} x2={X(0.5 * p)} y2={my + bh + 14} stroke={COLORS.splice} strokeWidth={2} strokeDasharray="6 4" />
      <text x={X(0.5 * p)} y={my - 18} fontSize={15} fill={COLORS.splice} textAnchor="middle" fontWeight={600}>
        splice
      </text>
      {b.flightsOn &&
        b.vars.map((v, i) => {
          const segs = flightSegments(b, v).segs
          const bad = flightTrouble(warnIds, i)
          const color = bad ? COLORS.flag : COLORS.flight[i]
          return Array.from({ length: 4 }, (_, k) => {
            const x = X((v.startRow + k * mult) * p)
            return (
              <g key={`${i}-${k}`}>
                {segs.map(([a, c], j) => {
                  const y1 = Y(Math.max(0, Math.min(b.widthMm, a)))
                  const y2 = Y(Math.max(0, Math.min(b.widthMm, c)))
                  return y2 > y1 ? <rect key={j} x={x - 4} y={y1} width={8} height={y2 - y1} rx={2} fill={color} /> : null
                })}
              </g>
            )
          })
        })}
      {b.flightsOn && v0 && (
        <>
          <HDim x1={X(v0.startRow * p)} x2={X((v0.startRow + mult) * p)} y={my + bh + 30} label={`spacing ${fmtMm(mult * p, system)} (${mult} rows)`} color={COLORS.flight[0]} />
          <HDim x1={X(0.5 * p)} x2={X(v0.startRow * p)} y={my + bh + 62} label={`row ${v0.startRow}`} color={COLORS.splice} />
        </>
      )}
      <text x={W - mx} y={H - 10} fontSize={15} fill={COLORS.dim} textAnchor="end">
        {b.series} · {fmtMm(b.widthMm, system)} wide · drive {b.series === '8140' ? 'lugs' : 'features'} every {fmtMm(p, system)}
      </text>
    </svg>
  )
}

/** Across the splice, per variation: last flight, splice, first flight of the next loop. */
export function SeamView({ belt, system, id }: { belt: TdBelt; system: UnitSystem; id?: string }) {
  const b = effective(belt)
  if (!(b.widthMm > 0 && b.lengthMm > 0)) return <Empty>Enter a belt width and length to see the spacing across the splice.</Empty>
  if (!b.flightsOn) return <Empty>Turn flights on to see the spacing across the splice.</Empty>
  const W = 900
  const mx = 50
  const aw = W - 2 * mx
  const band = 170
  const H = 20 + b.vars.length * band
  const p = pitchMm(b)
  return (
    <svg id={id} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Flight spacing across the splice">
      <rect width={W} height={H} fill="#fff" />
      {b.vars.map((v, i) => {
        const info = finalSpacingInfo(b, v)
        const top = 20 + i * band
        const color = COLORS.flight[i]
        const label = b.vars.length > 1 ? `Variation ${i + 1}` : 'Flights'
        if (info.count < 1 || info.finalGapMm === undefined || info.tailToSeamMm === undefined) {
          return (
            <text key={i} x={mx} y={top + 40} fontSize={17} fill={COLORS.dim}>
              {label}: no flights fit on this length.
            </text>
          )
        }
        const S = info.spacingMm
        const win = S + info.finalGapMm + S * 0.15
        const X = (mm: number) => mx + 8 + (mm / win) * (aw - 8)
        const lastMm = S
        const seamMm = lastMm + info.tailToSeamMm
        const firstMm = lastMm + info.finalGapMm
        const y = top + 34
        const h = 56
        return (
          <g key={i}>
            <text x={mx} y={top + 12} fontSize={16} fontWeight={700} fill={info.removed ? COLORS.flag : color}>
              {label}: {info.count} flights{info.removed ? ` · flight at row ${+info.removed.row.toFixed(2)} ${info.removed.reason}, left off` : ''}
            </text>
            <rect x={mx} y={y} width={X(seamMm) - mx} height={h} rx={5} fill={beltFill(b)} stroke={beltEdge(b)} strokeWidth={2} />
            <rect x={X(seamMm)} y={y} width={mx + aw - X(seamMm)} height={h} rx={5} fill={beltFill(b)} fillOpacity={0.35} stroke={beltEdge(b)} strokeWidth={2} strokeDasharray="4 3" />
            <rect x={X(seamMm - p)} y={y} width={X(seamMm) - X(seamMm - p)} height={h} fill={COLORS.flag} fillOpacity={0.12} />
            <line x1={X(seamMm)} y1={y - 10} x2={X(seamMm)} y2={y + h + 10} stroke={COLORS.splice} strokeWidth={2} strokeDasharray="6 4" />
            <text x={X(seamMm)} y={y - 14} fontSize={14} fill={COLORS.splice} textAnchor="middle" fontWeight={600}>
              splice
            </text>
            {[0, lastMm, firstMm].map((mm, k) => (
              <rect key={k} x={X(mm) - 4} y={y} width={8} height={h} rx={2} fill={color} />
            ))}
            {info.removed && info.lastRow !== undefined && (
              <rect x={X(lastMm + (info.removed.row - info.lastRow) * p) - 4} y={y} width={8} height={h} rx={2} fill="none" stroke={COLORS.flag} strokeWidth={2} strokeDasharray="3 3" />
            )}
            <text x={X(lastMm)} y={y + h + 16} fontSize={14} fill={color} textAnchor="middle">
              last
            </text>
            <text x={X(firstMm)} y={y + h + 16} fontSize={14} fill={color} textAnchor="middle">
              first (next loop)
            </text>
            <HDim x1={X(0)} x2={X(lastMm)} y={y + h + 42} label={`nominal ${fmtMm(S, system)}`} />
            <HDim x1={X(lastMm)} x2={X(firstMm)} y={y + h + 42} label={`across the splice ${fmtMm(info.finalGapMm, system)}`} color={COLORS.splice} />
          </g>
        )
      })}
    </svg>
  )
}

/** Cross-section across the width: flights by piece, sidewalls, V-guides. */
export function CrossView({ belt, system, warnIds, id }: { belt: TdBelt; system: UnitSystem; warnIds: Set<string>; id?: string }) {
  const b = effective(belt)
  if (!(b.widthMm > 0)) return <Empty>Enter a belt width to see the cross-section.</Empty>
  const W = 900
  const mx = 50
  const bw = W - 2 * mx
  const X = (mm: number) => mx + (Math.max(0, Math.min(b.widthMm, mm)) / b.widthMm) * bw
  const tallest = Math.max(
    1,
    ...(b.flightsOn ? b.vars.flatMap((v) => flightSegments(b, v).segs.map((_, i) => segHeight(v, i))) : []),
    b.sidewallsOn ? b.sidewallHeightIn * 25.4 : 0,
  )
  const vs = Math.min(1.4, 150 / tallest)
  const bTop = 30 + tallest * vs + 20
  const bTh = 18
  const fp = b.sidewallsOn ? sidewallFootprint(b).fp : 0
  const dims: { a: number; c: number; label: string; color: string }[] = []
  if (b.flightsOn) {
    const v = b.vars[0]
    dims.push({ a: 0, c: v.indentLMm, label: `indent ${fmtMm(v.indentLMm, system)}`, color: COLORS.flight[0] })
    dims.push({ a: b.widthMm - v.indentRMm, c: b.widthMm, label: `indent ${fmtMm(v.indentRMm, system)}`, color: COLORS.flight[0] })
  }
  if (b.sidewallsOn) dims.push({ a: 0, c: b.sidewallInsetMm, label: `sidewall inset ${fmtMm(b.sidewallInsetMm, system)}`, color: COLORS.sidewall })
  if (b.vgOn) {
    const pos = vgPositions(b)
    vgChannels(b).forEach((ch, i) => dims.push({ a: pos[i] + VGUIDE_WIDTH_MM / 2, c: pos[i + 1] - VGUIDE_WIDTH_MM / 2, label: `channel ${fmtMm(ch, system)}`, color: COLORS.vguide }))
  }
  const H = bTop + bTh + 40 + (dims.length + 1) * 30
  return (
    <svg id={id} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Cross-section of the belt">
      <rect width={W} height={H} fill="#fff" />
      <rect x={mx} y={bTop} width={bw} height={bTh} fill={beltFill(b)} stroke={beltEdge(b)} strokeWidth={2} />
      {b.flightsOn &&
        b.vars.map((v, i) => {
          const bad = flightTrouble(warnIds, i)
          return flightSegments(b, v).segs.map(([a, c], j) => {
            const h = segHeight(v, j) * vs
            return X(c) > X(a) ? (
              <rect key={`${i}-${j}`} x={X(a)} y={bTop - h} width={X(c) - X(a)} height={h} fill={bad ? COLORS.flag : COLORS.flight[i]} fillOpacity={i === 0 ? 0.55 : 0.35} stroke={bad ? COLORS.flag : COLORS.flight[i]} />
            ) : null
          })
        })}
      {b.sidewallsOn &&
        [b.sidewallInsetMm, ...(b.sidewallsBoth ? [b.widthMm - b.sidewallInsetMm - fp] : [])].map((x0) => (
          <g key={x0} fill={COLORS.sidewall}>
            <rect x={X(x0)} y={bTop - 6} width={Math.max(4, X(x0 + fp) - X(x0))} height={6} />
            <rect x={(X(x0) + X(x0 + fp)) / 2 - 3} y={bTop - 6 - b.sidewallHeightIn * 25.4 * vs} width={6} height={b.sidewallHeightIn * 25.4 * vs} />
          </g>
        ))}
      {b.vgOn &&
        vgPositions(b).map((c) => {
          const w = Math.max(6, (VGUIDE_WIDTH_MM / b.widthMm) * bw)
          const cx = X(c)
          const y = bTop + bTh
          return <path key={c} d={`M${cx - w / 2} ${y} L${cx + w / 2} ${y} L${cx + w * 0.3} ${y + 12} L${cx - w * 0.3} ${y + 12} Z`} fill={COLORS.vguide} />
        })}
      {dims.map((d, k) => (
        <HDim key={k} x1={X(d.a)} x2={X(d.c)} y={bTop + bTh + 40 + k * 30} label={d.label} color={d.color} />
      ))}
      <HDim x1={mx} x2={mx + bw} y={bTop + bTh + 40 + dims.length * 30} label={`belt width ${fmtMm(b.widthMm, system)}`} />
    </svg>
  )
}

export function SummaryTable({ belt, system }: { belt: TdBelt; system: UnitSystem }) {
  return (
    <dl className="divide-y divide-border rounded-lg border border-border bg-white">
      {summaryRows(belt, system).map(([k, v]) => (
        <div key={k} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-3 px-3 py-2">
          <dt className="text-sm text-muted-foreground">{k}</dt>
          <dd className="text-sm font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
