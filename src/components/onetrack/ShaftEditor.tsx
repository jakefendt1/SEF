// The Square Shaft Specification Sheet, as a worksheet. Ends by adding (or
// updating) one shaft line on the BOM; the sheet itself downloads as its own
// PDF from Review.
import { useState } from 'react'
import { ChevronLeft, Copy, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChoiceButtons, CheckField } from '@/components/td-bulk-density/fields'
import type { Unit } from '@/lib/measurement'
import { getItem } from '@/lib/onetrack/catalog'
import {
  SHAFT_SIZES,
  emptyDrillTap,
  emptyKeyway,
  formatShaftDim,
  missingForShaft,
  shaftOptions,
  shaftRow,
  shaftWarnings,
  squareLengthIn,
  type ShaftDrawing,
  type ShaftSpec,
  type Sprockets,
} from '@/lib/onetrack/shaft'
import { DimInput, QtyStepper, TextField, fieldLabel } from './controls'
import { DrillTapDiagram, KeywayDiagram, ShaftDiagram } from './ShaftDiagram'

function Section({ n, title, helper, children }: { n: number; title: string; helper?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h4 className="text-lg font-semibold">
          {n}. {title}
        </h4>
        {helper && <p className="text-base text-muted-foreground">{helper}</p>}
      </div>
      {children}
    </section>
  )
}

const yesNo = [
  { value: 'yes' as const, label: 'Yes' },
  { value: 'no' as const, label: 'No' },
]
const toYesNo = (v: boolean | null) => (v === null ? ('' as never) : v ? 'yes' : 'no')

function SprocketFields({ id, value, onChange }: { id: string; value: Sprockets; onChange: (s: Sprockets) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <TextField id={`${id}-series`} title="Series" list="onetrack-series" value={value.series} onChange={(v) => onChange({ ...value, series: v })} />
      <div>
        <p className={fieldLabel}>No. per shaft</p>
        <QtyStepper value={value.perShaft ?? 0} min={0} label={`${id} sprockets per shaft`} onChange={(n) => onChange({ ...value, perShaft: n })} />
      </div>
      <TextField id={`${id}-pd`} title="Pitch diameter" value={value.pitchDia} onChange={(v) => onChange({ ...value, pitchDia: v })} helper="e.g. 6.5 in" />
    </div>
  )
}

function DrawingFields({
  id,
  drawing,
  onChange,
  unit,
  grooves,
  keyway,
}: {
  id: string
  drawing: ShaftDrawing
  onChange: (d: ShaftDrawing) => void
  unit: Unit
  grooves: boolean
  /** Drive shafts only. */
  keyway?: { value: ShaftSpec['keyway']; onChange: (k: ShaftSpec['keyway']) => void }
}) {
  const [offCenter, setOffCenter] = useState(drawing.grooveOffsetIn !== null)
  const set = (patch: Partial<ShaftDrawing>) => onChange({ ...drawing, ...patch })
  const square = squareLengthIn(drawing)
  const dim = (key: string, title: string, value: number | null, apply: (v: number | null) => void, helper?: string) => (
    <DimInput key={`${id}-${key}-${unit}`} id={`${id}-${key}`} title={title} valueIn={value} unit={unit} onChange={apply} helper={helper} />
  )
  const k = keyway?.value
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-2">
        <ShaftDiagram keywayEnd={k ? k.end : null} grooves={grooves} offCenter={grooves && offCenter} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {dim('L', 'L: Overall length', drawing.overallIn, (v) => set({ overallIn: v }))}
        <div className="text-base self-end pb-3 text-muted-foreground">
          Square section: {square === null ? '—' : `${formatShaftDim(square, unit)} ${unit}`}
        </div>
        {dim('J1', 'J1: End 1 journal length', drawing.end1.lengthIn, (v) => set({ end1: { ...drawing.end1, lengthIn: v } }), '0 = no journal')}
        {dim('D1', 'D1: End 1 journal diameter', drawing.end1.diaIn, (v) => set({ end1: { ...drawing.end1, diaIn: v } }))}
        {dim('J2', 'J2: End 2 journal length', drawing.end2.lengthIn, (v) => set({ end2: { ...drawing.end2, lengthIn: v } }), '0 = no journal')}
        {dim('D2', 'D2: End 2 journal diameter', drawing.end2.diaIn, (v) => set({ end2: { ...drawing.end2, diaIn: v } }))}
        {grooves && dim('G', 'G: Dimension inside ring grooves', drawing.insideGroovesIn, (v) => set({ insideGroovesIn: v }))}
      </div>
      {grooves && (
        <>
          <CheckField
            id={`${id}-offcenter`}
            title="Retainer rings are off center"
            checked={offCenter}
            onChange={(v) => {
              setOffCenter(v)
              if (!v) set({ grooveOffsetIn: null })
            }}
          />
          {offCenter && dim('F', 'F: End 1 shoulder to the first groove', drawing.grooveOffsetIn, (v) => set({ grooveOffsetIn: v }))}
        </>
      )}

      {keyway && (
        <div className="rounded-xl border border-border bg-white p-3 space-y-3">
          <CheckField id={`${id}-keyway`} title="Keyway (K)" checked={!!k} onChange={(v) => keyway.onChange(v ? emptyKeyway() : null)} />
          {k && (
            <>
              <div className="rounded-lg border border-border bg-white p-2">
                <KeywayDiagram />
              </div>
              <ChoiceButtons
                title="Which end"
                value={String(k.end) as '1' | '2'}
                columns={2}
                onChange={(e) => keyway.onChange({ ...k, end: e === '1' ? 1 : 2 })}
                options={[
                  { value: '1', label: 'End 1' },
                  { value: '2', label: 'End 2' },
                ]}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {dim('kw', 'W: Width (across the slot)', k.widthIn, (v) => keyway.onChange({ ...k, widthIn: v }), 'Usually matches the key, e.g. 3/8 in.')}
                {dim('kd', 'Dp: Depth (into the shaft)', k.depthIn, (v) => keyway.onChange({ ...k, depthIn: v }), 'Measured down from the top of the journal.')}
                {dim('kl', 'Ln: Length (includes the arc)', k.lengthIn, (v) => keyway.onChange({ ...k, lengthIn: v }), 'End to end of the slot, rounded end included.')}
                {dim('ks', 'S: Start (from the shaft end)', k.startIn, (v) => keyway.onChange({ ...k, startIn: v }), '0 = the keyway runs out the end of the shaft.')}
              </div>
            </>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-white p-3 space-y-3">
        <CheckField
          id={`${id}-dt`}
          title="Drill & tap (optional)"
          checked={!!drawing.drillTap}
          onChange={(v) => set({ drillTap: v ? emptyDrillTap() : null })}
        />
        {drawing.drillTap && (
          <div className="rounded-lg border border-border bg-white p-2">
            <DrillTapDiagram />
          </div>
        )}
        {drawing.drillTap && (
          <div className="grid gap-3 sm:grid-cols-2">
            {dim('dtd', 'Depth (from the end face)', drawing.drillTap.depthIn, (v) => set({ drillTap: { ...drawing.drillTap!, depthIn: v } }))}
            <TextField id={`${id}-dts`} title="Screw size" value={drawing.drillTap.screwSize} onChange={(v) => set({ drillTap: { ...drawing.drillTap!, screwSize: v } })} helper="Diameter and thread, e.g. 1/2-13" />
            <TextField id={`${id}-dtt`} title="Threads per inch" value={drawing.drillTap.threadsPer} onChange={(v) => set({ drillTap: { ...drawing.drillTap!, threadsPer: v } })} />
            <CheckField id={`${id}-dt1`} title="End 1" checked={drawing.drillTap.end1} onChange={(v) => set({ drillTap: { ...drawing.drillTap!, end1: v } })} />
            <CheckField id={`${id}-dt2`} title="End 2" checked={drawing.drillTap.end2} onChange={(v) => set({ drillTap: { ...drawing.drillTap!, end2: v } })} />
          </div>
        )}
      </div>
    </div>
  )
}

export function ShaftEditor({
  itemId,
  initial,
  isNew,
  unit,
  onSave,
  onCancel,
}: {
  itemId: string
  initial: ShaftSpec
  isNew: boolean
  unit: Unit
  onSave: (spec: ShaftSpec) => void
  onCancel: () => void
}) {
  const [spec, setSpec] = useState<ShaftSpec>(initial)
  const [idleKey, setIdleKey] = useState(0)
  const set = (patch: Partial<ShaftSpec>) => setSpec((s) => ({ ...s, ...patch }))
  const item = getItem(itemId)
  const options = shaftOptions(itemId)
  const grooves = spec.grooves === 'std'
  const row = shaftRow(spec, item?.description ?? '', unit)
  const missing = missingForShaft(spec)
  const warnings = shaftWarnings(spec, unit)

  let shown = 0
  const num = () => ++shown
  return (
    <div className="space-y-8">
      <Button variant="ghost" className="min-h-[48px] text-base text-brand -ml-3" onClick={onCancel}>
        <ChevronLeft className="size-5" /> {isNew ? 'Back to the list' : 'Back to the BOM'}
      </Button>
      <div className="flex gap-4 items-start">
        {item?.image && <img src={item.image} alt="" className="w-28 h-20 object-contain rounded-md bg-white border border-border shrink-0" />}
        <div>
          <h3 className="text-xl font-semibold">{isNew ? 'Shaft spec sheet' : 'Edit shaft spec sheet'}</h3>
          <p className="text-base text-muted-foreground">
            {item?.description}. Fill in the sheet CS needs; it downloads as its own PDF with the BOM.
          </p>
        </div>
      </div>

      <Section n={num()} title="The shaft">
        <ChoiceButtons
          title="Material"
          value={spec.material ?? ('' as never)}
          columns={2}
          onChange={(m) => set({ material: m })}
          options={options.materials.map((m) => ({ value: m, label: m }))}
        />
        <ChoiceButtons
          title="Size"
          value={spec.size ?? ('' as never)}
          columns={3}
          onChange={(s) => set({ size: s })}
          options={SHAFT_SIZES.filter((s) => options.sizes.includes(s.id)).map((s) => ({ value: s.id, label: s.label }))}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className={fieldLabel}>Drive shafts required</p>
            <QtyStepper value={spec.driveQty} min={0} label="Drive shafts" onChange={(n) => set({ driveQty: n })} />
          </div>
          <div>
            <p className={fieldLabel}>Idle shafts required</p>
            <QtyStepper value={spec.idleQty} min={0} label="Idle shafts" onChange={(n) => set({ idleQty: n })} />
          </div>
        </div>
        {spec.driveQty > 0 && (
          <ChoiceButtons
            title="Hollow shaft gear box"
            value={toYesNo(spec.hollowGearBox)}
            columns={2}
            onChange={(v) => set({ hollowGearBox: v === 'yes' })}
            options={yesNo}
          />
        )}
      </Section>

      {spec.driveQty + spec.idleQty > 0 && (
        <Section n={num()} title="Sprockets" helper="What goes on the shaft. Helps CS check the groove positions.">
          {spec.driveQty > 0 && (
            <div className="space-y-2">
              <p className="font-semibold">Drive sprockets</p>
              <SprocketFields id="drive-spr" value={spec.driveSprockets} onChange={(v) => set({ driveSprockets: v })} />
            </div>
          )}
          {spec.idleQty > 0 && (
            <div className="space-y-2">
              <p className="font-semibold">Idle sprockets</p>
              <SprocketFields id="idle-spr" value={spec.idleSprockets} onChange={(v) => set({ idleSprockets: v })} />
            </div>
          )}
        </Section>
      )}

      <Section n={num()} title="Retainer ring grooves and chamfer">
        <ChoiceButtons
          title="Retainer ring grooves"
          value={spec.grooves ?? ('' as never)}
          columns={3}
          onChange={(g) => set({ grooves: g })}
          options={[
            { value: 'std', label: 'Standard' },
            { value: 'none', label: 'None' },
            { value: 'multiple', label: 'Multiple' },
          ]}
        />
        {spec.grooves === 'multiple' && (
          <div>
            <label htmlFor="shaft-grooves" className={fieldLabel}>
              Where the grooves go
            </label>
            <textarea
              id="shaft-grooves"
              rows={2}
              value={spec.groovesNote}
              onChange={(e) => set({ groovesNote: e.target.value })}
              className="w-full rounded-lg border border-gray-400 p-3 text-base bg-white"
            />
          </div>
        )}
        <ChoiceButtons title="Chamfer" value={toYesNo(spec.chamfer)} columns={2} onChange={(v) => set({ chamfer: v === 'yes' })} options={yesNo} />
        <p className="text-sm text-muted-foreground">Sprockets for S200, S400 and non-EZ Clean S800 need chamfers. The form comes with Yes ticked.</p>
      </Section>

      {spec.driveQty > 0 && (
        <Section n={num()} title="Drive shaft" helper="Match the letters on the drawing.">
          <DrawingFields
            id="drive"
            drawing={spec.drive}
            onChange={(d) => set({ drive: d })}
            unit={unit}
            grooves={grooves}
            keyway={{ value: spec.keyway, onChange: (k) => set({ keyway: k }) }}
          />
        </Section>
      )}

      {spec.idleQty > 0 && (
        <Section n={num()} title="Idle shaft" helper="Match the letters on the drawing.">
          {spec.driveQty > 0 && (
            <Button
              variant="outline"
              className="min-h-[48px] text-base"
              onClick={() => {
                set({ idle: { ...spec.drive } })
                setIdleKey((k) => k + 1)
              }}
            >
              <Copy className="size-5" /> Same lengths as the drive shaft
            </Button>
          )}
          <DrawingFields key={idleKey} id={`idle-${idleKey}`} drawing={spec.idle} onChange={(d) => set({ idle: d })} unit={unit} grooves={grooves} />
        </Section>
      )}

      <Section n={num()} title="Notes for the shop" helper="Anything the sheet doesn't cover (the back of the form has other configurations).">
        <textarea
          aria-label="Notes for the shop"
          rows={3}
          value={spec.notes}
          onChange={(e) => set({ notes: e.target.value })}
          className="w-full rounded-lg border border-gray-400 p-3 text-base bg-white"
        />
      </Section>

      <section className="rounded-xl border-2 border-brand/30 bg-blue-50/40 p-4 space-y-3">
        <h4 className="text-lg font-semibold">The BOM line</h4>
        {row ? (
          <div>
            <p className="font-mono-num font-bold text-base">{row.partNumber}</p>
            <p className="text-base">{row.description}</p>
            <p className="text-base font-semibold mt-1">
              Qty {row.qty} ({row.uom})
            </p>
            <p className="text-sm text-muted-foreground">The spec sheet downloads as its own PDF from Review.</p>
          </div>
        ) : (
          <p className="text-base text-muted-foreground">
            Still needed: {missing.join(', ')}. You can add it now and finish it later; Review lists what's left.
          </p>
        )}
        {warnings.length > 0 && (
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w} className="flex gap-2 text-base text-warning-orange">
                <TriangleAlert className="size-5 shrink-0 mt-0.5" aria-hidden="true" /> {w}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="outline" className="min-h-[48px] text-base" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="min-h-[48px] text-base bg-brand hover:bg-brand-hover" onClick={() => onSave(spec)}>
            {isNew ? 'Add to BOM' : 'Update BOM line'}
          </Button>
        </div>
      </section>
    </div>
  )
}
