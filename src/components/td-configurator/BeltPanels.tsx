// The configurator's inputs, one panel per step: product, size, flights,
// sidewalls and V-guides. Only valid choices are offered: no V-guide switch
// off 8140, only the sidewall heights a series has, styles by series.
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  flightMult,
  newVar,
  pitchMm,
  sidewallFootprint,
  sidewallPitch,
  sidewallsAvailable,
  vguidesAvailable,
  withSeries,
  withStyle,
  type FlightVar,
  type NotchMode,
  type TdBelt,
} from '@/lib/thermodrive/belt'
import { BELT_SERIES, CONFIG, IN, MIN_FLIGHT_SIDEWALL_GAP_MM, SSW_HEIGHTS_IN, START_ROW, type BeltSeries } from '@/lib/thermodrive/data'
import { fmtBeltLen, fmtMm } from '@/lib/thermodrive/format'
import { flightSegments, isPitchIncrement, maxSectionInfo } from '@/lib/thermodrive/geometry'
import { snapToRows } from '@/lib/thermodrive/rows'
import { formatLen, type UnitSystem } from '@/lib/tdBulkDensity/units'
import { CheckField, ChoiceButtons, NumberField, SectionNote, SelectField } from '../td-bulk-density/fields'
import { LenField } from './LenField'

export interface PanelProps {
  belt: TdBelt
  set: (patch: Partial<TdBelt> | ((b: TdBelt) => TdBelt)) => void
  system: UnitSystem
}

function SnapButtons({ options, onPick }: { options: { label: string; mm: number }[]; onPick: (mm: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onPick(o.mm)}
          className="min-h-[48px] rounded-lg border border-brand bg-white px-3 text-base font-semibold text-brand"
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ProductPanel({ belt, set }: PanelProps) {
  const styles = Object.keys(CONFIG[belt.series])
  const e = CONFIG[belt.series][belt.style]
  return (
    <div className="space-y-5">
      <ChoiceButtons<BeltSeries>
        title="Series"
        value={belt.series}
        columns={4}
        onChange={(s) => set((b) => withSeries(b, s))}
        options={BELT_SERIES.map((s) => ({ value: s, label: s, detail: `${fmtMm(pitchMm({ series: s }), 'imperial')} pitch` }))}
      />
      <SelectField id="td-style" title="Style" value={belt.style} onChange={(v) => set((b) => withStyle(b, v))} options={styles.map((s) => ({ value: s, label: s }))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField id="td-material" title="Material" value={belt.material} onChange={(material) => set({ material })} options={e.m.map((m) => ({ value: m, label: m }))} />
        <SelectField id="td-color" title="Color" value={belt.color} onChange={(color) => set({ color })} options={e.c.map((c) => ({ value: c, label: c }))} />
      </div>
    </div>
  )
}

export function SizePanel({ belt, set, system }: PanelProps) {
  const p = pitchMm(belt)
  const offRow = belt.lengthMm > 0 && !isPitchIncrement(belt)
  const msi = maxSectionInfo(belt)
  return (
    <div className="space-y-5">
      <LenField id="td-width" title="Belt width" mm={belt.widthMm} system={system} onChange={(widthMm) => set({ widthMm })} />
      <div className="space-y-2">
        <LenField
          id="td-length"
          title="Belt length"
          mm={belt.lengthMm}
          system={system}
          onChange={(lengthMm) => set({ lengthMm })}
          helper={
            belt.lengthMm > 0
              ? `${fmtBeltLen(belt.lengthMm, system)} = ${(belt.lengthMm / p).toFixed(offRow ? 2 : 0)} rows of ${fmtMm(p, system)}.`
              : `${system === 'imperial' ? "Inches, or feet like 50'." : 'mm.'} A belt is a whole number of rows.`
          }
          problem={offRow ? `Not a whole number of rows (${(belt.lengthMm / p).toFixed(2)}). Pick one:` : undefined}
        />
        {offRow && (
          <SnapButtons
            options={snapToRows(belt.series, belt.lengthMm / IN).map((s) => ({
              label: `${fmtBeltLen(s.lengthIn * IN, system)} · ${s.rows} rows`,
              mm: s.lengthIn * IN,
            }))}
            onPick={(lengthMm) => set({ lengthMm })}
          />
        )}
        <NumberField
          id="td-length-rows"
          title="…or length in rows"
          inputMode="numeric"
          value={belt.lengthMm > 0 && !offRow ? String(Math.round(belt.lengthMm / p)) : ''}
          onChange={(t) => {
            const n = Math.round(Number(t))
            if (Number.isFinite(n) && n >= 0) set({ lengthMm: n * p })
          }}
        />
      </div>
      <SectionNote>
        Max section length for this belt: {msi.ft !== null ? `${msi.ft} ft / ${msi.m} m (tallest feature ${msi.label})` : msi.label}.
        Longer belts are built in sections (Sections tab).
      </SectionNote>
    </div>
  )
}

const NOTCH_MODES: { value: NotchMode; label: string; detail: string }[] = [
  { value: 'even', label: 'Even', detail: 'Equal pieces' },
  { value: 'manual', label: 'Manual', detail: 'Widths and heights per piece' },
  { value: 'position', label: 'By position', detail: 'Notch edges from the left' },
]

function numList(text: string, system: UnitSystem): number[] {
  return text
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x) && x >= 0)
    .map((x) => (system === 'metric' ? x : x * IN))
}
const listText = (mm: number[], system: UnitSystem) =>
  mm.map((x) => (system === 'metric' ? +x.toFixed(1) : +(x / IN).toFixed(3))).join(', ')

function ListField({ id, title, mm, system, onChange, helper }: { id: string; title: string; mm: number[]; system: UnitSystem; onChange: (mm: number[]) => void; helper?: string }) {
  // Keep the typed text (a trailing comma, a half-typed number) while typing.
  const [text, setText] = useState(() => listText(mm, system))
  const [sys, setSys] = useState(system)
  if (sys !== system) {
    setSys(system)
    setText(listText(mm, system))
  }
  return (
    <NumberField
      id={id}
      title={title}
      unit={system === 'metric' ? 'mm' : 'in'}
      value={text}
      onChange={(t) => {
        setText(t)
        onChange(numList(t, system))
      }}
      helper={helper ?? 'Comma-separated.'}
      inputMode="decimal"
    />
  )
}

function VarEditor({ belt, v, index, onChange, system }: { belt: TdBelt; v: FlightVar; index: number; onChange: (v: FlightVar) => void; system: UnitSystem }) {
  const seg = flightSegments(belt, v)
  const sswEdge = belt.sidewallsOn ? belt.sidewallInsetMm + sidewallFootprint(belt).fp + MIN_FLIGHT_SIDEWALL_GAP_MM : null
  const id = `td-v${index}`
  const half = belt.series === '8140'
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <LenField id={`${id}-h`} title="Flight height" mm={v.heightMm} system={system} onChange={(heightMm) => onChange({ ...v, heightMm })} />
        <NumberField
          id={`${id}-sr`}
          title="Start row (from the splice)"
          value={String(v.startRow)}
          onChange={(t) => {
            const n = Number(t)
            if (Number.isFinite(n) && n >= 0) onChange({ ...v, startRow: half ? Math.round(n * 2) / 2 : Math.round(n) })
          }}
          helper={`Default ${START_ROW[belt.series]}${half ? ' (half rows on 8140)' : ''}.`}
        />
        <LenField
          id={`${id}-il`}
          title="Left indent"
          mm={v.indentLMm}
          system={system}
          onChange={(indentLMm) => onChange({ ...v, indentLMm })}
          helper={sswEdge !== null ? `At least ${fmtMm(sswEdge, system)} to clear the sidewall.` : undefined}
        />
        <LenField id={`${id}-ir`} title="Right indent" mm={v.indentRMm} system={system} onChange={(indentRMm) => onChange({ ...v, indentRMm })} />
      </div>
      <CheckField id={`${id}-notch`} title="Notches" checked={v.notchOn} onChange={(notchOn) => onChange({ ...v, notchOn })} />
      {v.notchOn && (
        <div className="space-y-4 rounded-lg border border-border p-3">
          <ChoiceButtons<NotchMode> title="Notch layout" value={v.notchMode} columns={3} onChange={(notchMode) => onChange({ ...v, notchMode })} options={NOTCH_MODES} />
          <NumberField
            id={`${id}-nc`}
            title="Number of notches"
            inputMode="numeric"
            value={String(v.notchCount)}
            onChange={(t) => {
              const n = Math.round(Number(t))
              if (Number.isFinite(n) && n >= 0 && n <= 20) onChange({ ...v, notchCount: n })
            }}
          />
          {v.notchMode === 'even' && (
            <LenField
              id={`${id}-nw`}
              title="Notch width"
              mm={v.notchWMm}
              system={system}
              onChange={(notchWMm) => onChange({ ...v, notchWMm })}
              helper={seg.computedFlightWMm !== undefined && seg.computedFlightWMm >= 0 ? `Each flight piece: ${fmtMm(seg.computedFlightWMm, system)}.` : undefined}
            />
          )}
          {v.notchMode === 'manual' && (
            <>
              <ListField id={`${id}-fw`} title={`Flight piece widths (${v.notchCount + 1})`} mm={v.flightWidthsMm} system={system} onChange={(flightWidthsMm) => onChange({ ...v, flightWidthsMm })} />
              <ListField id={`${id}-nws`} title={`Notch widths (${v.notchCount})`} mm={v.notchWidthsMm} system={system} onChange={(notchWidthsMm) => onChange({ ...v, notchWidthsMm })} />
              <ListField
                id={`${id}-fh`}
                title="Piece heights (optional)"
                mm={v.flightHeightsMm}
                system={system}
                onChange={(flightHeightsMm) => onChange({ ...v, flightHeightsMm })}
                helper="Blank pieces use the flight height."
              />
            </>
          )}
          {v.notchMode === 'position' && (
            <>
              <ListField id={`${id}-np`} title={`Notch left edges from the belt edge (${v.notchCount})`} mm={v.notchPosMm} system={system} onChange={(notchPosMm) => onChange({ ...v, notchPosMm })} />
              <ListField id={`${id}-npw`} title={`Notch widths (${v.notchCount})`} mm={v.notchWidthsMm} system={system} onChange={(notchWidthsMm) => onChange({ ...v, notchWidthsMm })} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function FlightsPanel({ belt, set, system }: PanelProps) {
  const p = pitchMm(belt)
  const rows = belt.flightSpacingMm / p
  const offRow = Math.abs(rows - Math.round(rows)) > 1e-3
  return (
    <div className="space-y-5">
      <CheckField id="td-flights" title="Flights" checked={belt.flightsOn} onChange={(flightsOn) => set({ flightsOn })} />
      {belt.flightsOn && (
        <>
          <div className="space-y-2">
            <LenField
              id="td-spacing"
              title="Flight spacing"
              mm={belt.flightSpacingMm}
              system={system}
              onChange={(flightSpacingMm) => set({ flightSpacingMm })}
              helper={!offRow ? `${flightMult(belt)} rows × ${fmtMm(p, system)}.` : undefined}
              problem={offRow ? 'Flights sit on rows, so spacing is a whole number of rows. Pick one:' : undefined}
            />
            {offRow && belt.flightSpacingMm > 0 && (
              <SnapButtons
                options={snapToRows(belt.series, belt.flightSpacingMm / IN).map((s) => ({
                  label: `${formatLen(s.lengthIn, system)} · ${s.rows} rows`,
                  mm: s.lengthIn * IN,
                }))}
                onPick={(flightSpacingMm) => set({ flightSpacingMm })}
              />
            )}
          </div>
          {belt.vars.map((v, i) => (
            <div key={i} className="space-y-3">
              {belt.vars.length > 1 && (
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold">Variation {i + 1}</h4>
                  {i > 0 && (
                    <Button variant="ghost" className="min-h-[44px]" onClick={() => set((b) => ({ ...b, vars: b.vars.slice(0, 1) }))}>
                      <Trash2 className="size-4" /> Remove
                    </Button>
                  )}
                </div>
              )}
              <VarEditor belt={belt} v={v} index={i} system={system} onChange={(nv) => set((b) => ({ ...b, vars: b.vars.map((x, j) => (j === i ? nv : x)) }))} />
            </div>
          ))}
          {belt.vars.length === 1 && (
            <Button
              variant="outline"
              className="min-h-[48px] text-base"
              onClick={() => set((b) => ({ ...b, vars: [...b.vars, { ...newVar(b.vars[0].startRow + 1), heightMm: b.vars[0].heightMm }] }))}
            >
              <Plus className="size-5" /> Add a second flight variation
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export function EdgesPanel({ belt, set, system }: PanelProps) {
  const heights = SSW_HEIGHTS_IN[belt.series] ?? []
  const vgOk = vguidesAvailable(belt.series)
  return (
    <div className="space-y-6">
      {sidewallsAvailable(belt.series) ? (
        <div className="space-y-4">
          <CheckField id="td-ssw" title="Sidewalls" checked={belt.sidewallsOn} onChange={(sidewallsOn) => set({ sidewallsOn })} />
          {belt.sidewallsOn && (
            <>
              <ChoiceButtons<string>
                title="Sidewall height"
                value={String(belt.sidewallHeightIn)}
                columns={heights.length > 4 ? 'auto' : 4}
                onChange={(h) => set({ sidewallHeightIn: Number(h) })}
                options={heights.map((h) => ({ value: String(h), label: formatLen(h, system) }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <LenField id="td-ssw-inset" title="Sidewall inset from the belt edge" mm={belt.sidewallInsetMm} system={system} onChange={(sidewallInsetMm) => set({ sidewallInsetMm })} />
                <CheckField id="td-ssw-both" title="Both edges" checked={belt.sidewallsBoth} onChange={(sidewallsBoth) => set({ sidewallsBoth })} />
              </div>
              <SectionNote>
                {sidewallPitch(belt)} mm pitch; footprint {fmtMm(sidewallFootprint(belt).fp, system)}, {fmtMm(sidewallFootprint(belt).th, system)} thick.
                Flights need {fmtMm(MIN_FLIGHT_SIDEWALL_GAP_MM, system)} clear of the sidewall.
              </SectionNote>
            </>
          )}
        </div>
      ) : (
        <SectionNote>Sidewalls aren't offered on Series {belt.series}.</SectionNote>
      )}

      {vgOk ? (
        <div className="space-y-4">
          <CheckField id="td-vg" title="V-guides (K13)" checked={belt.vgOn} onChange={(vgOn) => set({ vgOn })} />
          {belt.vgOn && (
            <>
              <ChoiceButtons<string>
                title="Number of guides"
                value={String(belt.vgCount)}
                columns={4}
                onChange={(n) => set({ vgCount: Number(n) })}
                options={['1', '2', '3', '4'].map((n) => ({ value: n, label: n, detail: n === '1' ? 'Centered' : n === '4' ? 'Two centered pairs' : undefined }))}
              />
              {belt.vgCount === 4 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <LenField id="td-vg-outer" title="Outer pair spacing (centers)" mm={belt.vgOuterSpMm} system={system} onChange={(vgOuterSpMm) => set({ vgOuterSpMm })} />
                  <LenField id="td-vg-inner" title="Inner pair spacing (centers)" mm={belt.vgInnerSpMm} system={system} onChange={(vgInnerSpMm) => set({ vgInnerSpMm })} />
                </div>
              ) : belt.vgCount >= 2 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <LenField id="td-vg-il" title="Left guide indent" mm={belt.vgIndentLMm} system={system} onChange={(vgIndentLMm) => set({ vgIndentLMm })} />
                    <LenField id="td-vg-ir" title="Right guide indent" mm={belt.vgIndentRMm} system={system} onChange={(vgIndentRMm) => set({ vgIndentRMm })} />
                  </div>
                  {belt.vgCount === 3 && (
                    <>
                      <ChoiceButtons<string>
                        title="Place the middle guide by"
                        value={belt.vgMode}
                        columns={2}
                        onChange={(m) => set({ vgMode: m as TdBelt['vgMode'] })}
                        options={[
                          { value: 'channel', label: 'Channel width' },
                          { value: 'centerline', label: 'Centerline' },
                        ]}
                      />
                      {belt.vgMode === 'channel' ? (
                        <LenField id="td-vg-ch" title="First channel width" mm={belt.vgChannelsMm[0] ?? 25.4} system={system} onChange={(c) => set((b) => ({ ...b, vgChannelsMm: [c, ...b.vgChannelsMm.slice(1)] }))} />
                      ) : (
                        <LenField id="td-vg-cl" title="Middle guide centerline from the left edge" mm={belt.vgCenterlinesMm[0] ?? 150} system={system} onChange={(c) => set((b) => ({ ...b, vgCenterlinesMm: [c, ...b.vgCenterlinesMm.slice(1)] }))} />
                      )}
                    </>
                  )}
                </>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <SectionNote>V-guides are only offered on Series 8140.</SectionNote>
      )}
    </div>
  )
}
