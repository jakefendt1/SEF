// Repair (ThermoLace) and Sectioning tabs, from Patrick's Repair and Belt
// Sectioning tabs. The repair section carries the belt's first flight
// variation and spacing (his "Configure" button does the same).
import { effective, flightMult, pitchMm, type TdBelt } from '@/lib/thermodrive/belt'
import { FLIGHT_CLEAR_ROWS, LACE_PITCH_MM, NOMINAL_10FT_ROWS, REPAIR_FIXED_ROWS } from '@/lib/thermodrive/data'
import { fmtBeltLen, fmtMm } from '@/lib/thermodrive/format'
import { divisorSuggestions, flightSegments, jointRemovals, maxSectionInfo, totalRows, type SectionMode } from '@/lib/thermodrive/geometry'
import { repairResult, sectionsFor, type RepairState } from '@/lib/thermodrive/repair'
import type { UnitSystem } from '@/lib/tdBulkDensity/units'
import { cn } from '@/lib/utils'
import { ChoiceButtons, CheckField, NumberField, SectionNote } from '../td-bulk-density/fields'
import { COLORS, beltEdge, beltFill } from './colors'

export function RepairPanel({ belt, repair, setRepair }: { belt: TdBelt; repair: RepairState; setRepair: (r: RepairState) => void }) {
  const p = pitchMm(belt)
  return (
    <div className="space-y-5">
      <SectionNote>
        {belt.series === '8140'
          ? 'On 8140 the ThermoLace replaces the drive-lug row nearest the middle of the section.'
          : 'The ThermoLace sits half a row between the two drive features nearest the middle of the section.'}{' '}
        Loops are on a 1/2 in pitch, centered on the width. No flight within {FLIGHT_CLEAR_ROWS} row of the lace.
      </SectionNote>
      <NumberField
        id="td-repair-rows"
        title="Repair section length (rows)"
        inputMode="numeric"
        value={repair.rows > 0 ? String(repair.rows) : ''}
        onChange={(t) => {
          const n = Math.round(Number(t))
          if (Number.isFinite(n) && n >= 0) setRepair({ ...repair, rows: n })
        }}
        helper={`${fmtBeltLen(repair.rows * p, 'imperial')}. Standard repair section on ${belt.series}: ${REPAIR_FIXED_ROWS[belt.series]} rows.`}
      />
      {repair.rows !== REPAIR_FIXED_ROWS[belt.series] && (
        <button
          type="button"
          className="min-h-[48px] rounded-lg border border-brand bg-white px-3 text-base font-semibold text-brand"
          onClick={() => setRepair({ ...repair, rows: REPAIR_FIXED_ROWS[belt.series] })}
        >
          Use the standard {REPAIR_FIXED_ROWS[belt.series]} rows
        </button>
      )}
      <CheckField id="td-repair-flights" title="Flights on the repair section" checked={repair.flightsOn} onChange={(flightsOn) => setRepair({ ...repair, flightsOn })} />
      {repair.flightsOn && (
        <NumberField
          id="td-repair-sr"
          title="First flight row"
          value={String(repair.startRow)}
          onChange={(t) => {
            const n = Number(t)
            if (Number.isFinite(n) && n >= 0) setRepair({ ...repair, startRow: belt.series === '8140' ? Math.round(n * 2) / 2 : Math.round(n) })
          }}
          helper="Uses the belt's flight spacing and its first flight variation."
        />
      )}
    </div>
  )
}

export function RepairView({ belt, repair, system, id }: { belt: TdBelt; repair: RepairState; system: UnitSystem; id?: string }) {
  const b = effective(belt)
  if (!(b.widthMm > 0) || !(repair.rows > 0)) {
    return <p className="rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-10 text-center text-base text-muted-foreground">Enter a belt width and a repair length to see the repair section.</p>
  }
  const { L, lace, flights, v } = repairResult(b, repair)
  const p = pitchMm(b)
  const W = 900
  const mx = 50
  const my = 70
  const bw = W - 2 * mx
  const bh = 190
  const X = (mm: number) => mx + (mm / L) * bw
  const Y = (mm: number) => my + (mm / b.widthMm) * bh
  const segs = flightSegments(b, v).segs
  const clear = FLIGHT_CLEAR_ROWS * p
  const H = my + bh + 70
  const bar = (mm: number, ghost: boolean, k: string) => (
    <g key={k}>
      {segs.map(([a, c], j) => (
        <rect
          key={j}
          x={X(mm) - 4}
          y={Y(Math.max(0, a))}
          width={8}
          height={Math.max(0, Y(Math.min(b.widthMm, c)) - Y(Math.max(0, a)))}
          rx={2}
          fill={ghost ? 'none' : COLORS.flight[0]}
          stroke={ghost ? COLORS.flag : 'none'}
          strokeDasharray={ghost ? '3 3' : undefined}
          strokeWidth={1.5}
        />
      ))}
    </g>
  )
  return (
    <div className="space-y-2">
      <svg id={id} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Repair section with ThermoLace">
        <rect width={W} height={H} fill="#fff" />
        <rect x={mx} y={my} width={bw} height={bh} rx={6} fill={beltFill(b)} stroke={beltEdge(b)} strokeWidth={2} />
        {Array.from({ length: lace.rows + 1 }, (_, r) => (
          <rect key={r} x={X(r * p) - 1.5} y={my} width={3} height={bh} fill={COLORS.drive} opacity={lace.mode === 'onFeature' && r === lace.replacedIndex ? 0.08 : 0.3} />
        ))}
        <rect x={X(Math.max(0, lace.laceMm - clear))} y={my} width={X(Math.min(L, lace.laceMm + clear)) - X(Math.max(0, lace.laceMm - clear))} height={bh} fill={COLORS.flag} fillOpacity={0.1} stroke={COLORS.flag} strokeOpacity={0.4} strokeDasharray="3 3" />
        {flights?.kept.map((f, k) => bar(f, false, `k${k}`))}
        {flights?.removed.map((f, k) => bar(f, true, `r${k}`))}
        <rect x={X(lace.laceMm) - 7} y={my} width={14} height={bh} rx={2} fill={COLORS.splice} fillOpacity={0.2} stroke={COLORS.splice} strokeDasharray="4 3" />
        {Array.from({ length: Math.round(b.widthMm / LACE_PITCH_MM) + 1 }, (_, i) =>
          i * LACE_PITCH_MM <= b.widthMm + 1e-6 ? <circle key={i} cx={X(lace.laceMm)} cy={Y(i * LACE_PITCH_MM)} r={Math.max(1.5, Math.min(6, (LACE_PITCH_MM / b.widthMm) * bh * 0.4))} fill="none" stroke={COLORS.splice} strokeWidth={1.4} /> : null,
        )}
        <text x={X(lace.laceMm)} y={my - 26} fontSize={16} fill={COLORS.splice} textAnchor="middle" fontWeight={700}>
          ThermoLace
        </text>
        <text x={X(lace.laceMm)} y={my - 10} fontSize={14} fill={COLORS.flag} textAnchor="middle">
          {FLIGHT_CLEAR_ROWS}-row no-flight zone each side
        </text>
        <g stroke={COLORS.dim} fill={COLORS.dim}>
          <line x1={mx} y1={my + bh + 34} x2={mx + bw} y2={my + bh + 34} />
          <text x={mx + bw / 2} y={my + bh + 28} fontSize={15} textAnchor="middle" stroke="none">
            repair section {fmtBeltLen(L, system)} ({repair.rows} rows)
          </text>
        </g>
      </svg>
      {flights && (
        <p className="text-sm text-muted-foreground">
          {flights.kept.length} flights on the section
          {flights.removed.length ? `; ${flights.removed.length} left off within ${FLIGHT_CLEAR_ROWS} row of the lace (dashed)` : ''}.
          {flights.endTooCloseMm !== null &&
            ` The last flight is only ${fmtMm(flights.endTooCloseMm, system)} from the section end: move the first flight row so it's easier to install.`}
        </p>
      )}
    </div>
  )
}

export function SectionsPanel({ belt, mode, setMode, system }: { belt: TdBelt; mode: SectionMode; setMode: (m: SectionMode) => void; system: UnitSystem }) {
  const b = effective(belt)
  const total = b.lengthMm > 0 ? totalRows(b) : 0
  if (!(total > 0)) return <SectionNote>Enter a belt length on the Belt tab to split it into sections.</SectionNote>
  const res = sectionsFor(b, mode)
  const p = pitchMm(b)
  const msi = maxSectionInfo(b)
  const maxMm = msi.m !== null ? msi.m * 1000 : null
  const kinds: { value: SectionMode['kind']; label: string }[] = [
    { value: 'count', label: 'Equal count' },
    { value: 'standard', label: 'Standard + rest' },
    { value: 'manual', label: 'Manual' },
  ]
  return (
    <div className="space-y-5">
      <SectionNote>
        Belt: {fmtBeltLen(b.lengthMm, system)} = {total} rows. Max section: {msi.ft !== null ? `${msi.ft} ft / ${msi.m} m (${msi.label})` : msi.label}.
      </SectionNote>
      <ChoiceButtons<SectionMode['kind']>
        title="Split by"
        value={mode.kind}
        columns={3}
        options={kinds}
        onChange={(k) =>
          setMode(k === 'count' ? { kind: 'count', count: 2 } : k === 'standard' ? { kind: 'standard', rows: NOMINAL_10FT_ROWS[b.series], remainderOnLast: false } : { kind: 'manual', text: '' })
        }
      />
      {mode.kind === 'count' && (
        <>
          <NumberField
            id="td-sec-count"
            title="Number of sections"
            inputMode="numeric"
            value={String(mode.count)}
            onChange={(t) => {
              const n = Math.round(Number(t))
              if (Number.isFinite(n) && n >= 1) setMode({ kind: 'count', count: n })
            }}
            helper={res.note || res.error}
          />
          {res.uneven && (
            <div className="flex flex-wrap gap-2">
              {divisorSuggestions(total, mode.count, 4).map((n) => (
                <button key={n} type="button" onClick={() => setMode({ kind: 'count', count: n })} className="min-h-[48px] rounded-lg border border-brand bg-white px-3 text-base font-semibold text-brand">
                  {n} × {total / n} rows
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {mode.kind === 'standard' && (
        <>
          <NumberField
            id="td-sec-std"
            title="Standard section (rows)"
            inputMode="numeric"
            value={String(mode.rows)}
            onChange={(t) => {
              const n = Math.round(Number(t))
              if (Number.isFinite(n) && n >= 1) setMode({ ...mode, rows: n })
            }}
            helper={`${res.note} Nominal 10 ft on ${b.series} = ${NOMINAL_10FT_ROWS[b.series]} rows.`}
          />
          {!!res.remainder && (
            <ChoiceButtons<string>
              title="The remainder"
              value={mode.remainderOnLast ? 'last' : 'separate'}
              columns={2}
              onChange={(v) => setMode({ ...mode, remainderOnLast: v === 'last' })}
              options={[
                { value: 'separate', label: `Keep a ${res.remainder}-row piece` },
                {
                  value: 'last',
                  label: `Add it to the last (${(res.std ?? 0) + res.remainder} rows)`,
                  detail: maxMm !== null && ((res.std ?? 0) + res.remainder) * p > maxMm + 1e-6 ? 'Over the max section length' : undefined,
                },
              ]}
            />
          )}
        </>
      )}
      {mode.kind === 'manual' && (
        <NumberField id="td-sec-manual" title="Section lengths in rows" value={mode.text} onChange={(text) => setMode({ kind: 'manual', text })} helper={res.error || res.note || 'Comma-separated, e.g. 120, 120, 98.'} problem={res.error && mode.text ? res.error : undefined} />
      )}
    </div>
  )
}

export function SectionsView({ belt, mode, system, id }: { belt: TdBelt; mode: SectionMode; system: UnitSystem; id?: string }) {
  const b = effective(belt)
  if (!(b.lengthMm > 0 && b.widthMm > 0)) {
    return <p className="rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-10 text-center text-base text-muted-foreground">Enter a belt width and length to see the sections.</p>
  }
  const res = sectionsFor(b, mode)
  const rows = res.error && mode.kind !== 'manual' ? [] : res.rows
  const p = pitchMm(b)
  const msi = maxSectionInfo(b)
  const maxMm = msi.m !== null ? msi.m * 1000 : null
  const total = rows.reduce((a, c) => a + c, 0)
  const W = 900
  const mx = 50
  const bw = W - 2 * mx
  const starts = rows.map((_, i) => rows.slice(0, i).reduce((a, c) => a + c, 0))
  const joints = jointRemovals(b, rows)
  const removed = joints.reduce((a, j) => a + j.removedBefore.length + j.removedAfter.length, 0)
  return (
    <div className="space-y-3">
      {rows.length > 0 && (
        <svg id={id} viewBox={`0 0 ${W} 110`} className="w-full h-auto" role="img" aria-label="Section layout">
          <rect width={W} height={110} fill="#fff" />
          {rows.map((r, i) => {
            const x = mx + (starts[i] / total) * bw
            const w = (r / total) * bw
            const over = maxMm !== null && r * p > maxMm + 1e-6
            return (
              <g key={i}>
                <rect x={x + 1} y={20} width={Math.max(2, w - 2)} height={44} rx={4} fill={over ? '#fee2e2' : beltFill(b)} stroke={over ? COLORS.flag : beltEdge(b)} strokeWidth={2} />
                {w > 50 && (
                  <text x={x + w / 2} y={47} fontSize={15} textAnchor="middle" fill={over ? COLORS.flag : '#0f172a'} fontWeight={600}>
                    {i + 1}: {r} rows
                  </text>
                )}
              </g>
            )
          })}
          <text x={mx} y={88} fontSize={15} fill={COLORS.dim}>
            {rows.length} section{rows.length === 1 ? '' : 's'}, {total} rows
          </text>
        </svg>
      )}
      <ul className="divide-y divide-border rounded-lg border border-border bg-white">
        {rows.map((r, i) => {
          const over = maxMm !== null && r * p > maxMm + 1e-6
          return (
            <li key={i} className={cn('flex flex-wrap justify-between gap-2 px-3 py-2 text-sm', over && 'bg-red-50')}>
              <span className="font-semibold">Section {i + 1}</span>
              <span>
                {r} rows · {fmtBeltLen(r * p, system)}
              </span>
              {over && <span className="font-semibold text-destructive">over the {msi.ft} ft max</span>}
            </li>
          )
        })}
      </ul>
      {res.error && <p className="text-base text-warning-orange">{res.error}</p>}
      {b.flightsOn && joints.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-base font-semibold">Flights at the joints</h4>
          <p className="text-sm text-muted-foreground">
            Nominal spacing {fmtMm(b.flightSpacingMm, system)} ({flightMult(b)} rows). Flights within {FLIGHT_CLEAR_ROWS} row of a joint are left off.
            {removed ? ` ${removed} flight${removed === 1 ? '' : 's'} left off across all joints.` : ''}
          </p>
          <ul className="text-sm space-y-0.5">
            {joints.map((j) => (
              <li key={`${j.joint}-${j.variation}`}>
                Joint {j.joint} (row {j.atRow}){b.vars.length > 1 ? `, variation ${j.variation}` : ''}:{' '}
                {j.acrossMm !== null ? `${fmtMm(j.acrossMm, system)} across the joint` : 'no flight on one side'}
                {j.removedBefore.length + j.removedAfter.length > 0 && (
                  <span className="text-destructive font-medium"> · {j.removedBefore.length + j.removedAfter.length} left off</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
