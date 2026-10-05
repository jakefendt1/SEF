// The wearstrip worksheet (the Word form, rebuilt): what's installed, what to
// quote, the measurements, and the line it produces. Ends by adding (or
// updating) one wearstrip line on the BOM.
import { useState } from 'react'
import { Camera, Check, ChevronLeft, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChoiceButtons, CheckField, NumberField } from '@/components/td-bulk-density/fields'
import type { Unit } from '@/lib/measurement'
import { findWearstrip } from '@/lib/onetrack/catalog'
import {
  DIM_LABELS,
  PROFILES,
  colorsFor,
  defaultQuoteAs,
  framesFor,
  getFamily,
  getProfile,
  quoteAsOptions,
  type QuoteAs,
  type WearstripProfile,
} from '@/lib/onetrack/profiles'
import {
  WEARSTRIP_USES,
  formatDim,
  missingForWearstrip,
  wearstripRow,
  wearstripWarnings,
  type WearstripWorksheet,
} from '@/lib/onetrack/wearstrip'
import { cn } from '@/lib/utils'
import { DimInput, RunInput, fieldLabel } from './controls'
import { ProfileDiagram } from './ProfileDiagram'

function quoteAsLabel(q: QuoteAs): string {
  return q === 'match' ? 'Match the installed profile (CS to source)' : getFamily(q).label
}

function ProfileTile({ p, selected, onPick }: { p: WearstripProfile; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onPick}
      className={cn(
        'relative min-h-[140px] rounded-xl border bg-white p-2 text-left flex flex-col',
        selected ? 'border-brand ring-2 ring-brand' : 'border-gray-300 hover:border-gray-500',
      )}
    >
      {selected && (
        <span className="absolute top-2 right-2 size-7 rounded-full bg-brand text-white grid place-items-center">
          <Check className="size-4" aria-hidden="true" />
        </span>
      )}
      {p.family && (
        <span className="absolute top-2 left-2 rounded-full bg-brand text-white text-xs font-semibold px-2 py-0.5">OneTrack</span>
      )}
      {p.image ? (
        <img src={p.image} alt="" className="w-full aspect-[4/3] object-contain bg-white rounded-md" loading="lazy" />
      ) : (
        <span className="w-full aspect-[4/3] grid place-items-center rounded-md bg-secondary text-muted-foreground text-sm text-center px-2">
          <span>
            <Camera className="size-8 mx-auto mb-1" aria-hidden="true" />
            Take a straight-on end photo
          </span>
        </span>
      )}
      <span className={cn('block mt-2 text-base leading-tight', selected && 'font-semibold text-brand')}>{p.label}</span>
    </button>
  )
}

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

export function WearstripEditor({
  initial,
  isNew,
  unit,
  onSave,
  onCancel,
}: {
  initial: WearstripWorksheet
  isNew: boolean
  unit: Unit
  onSave: (ws: WearstripWorksheet) => void
  onCancel: () => void
}) {
  const [ws, setWs] = useState<WearstripWorksheet>(initial)
  const set = (patch: Partial<WearstripWorksheet>) => setWs((w) => ({ ...w, ...patch }))
  const profile = getProfile(ws.profileId)

  const pickProfile = (p: WearstripProfile) => {
    const options = quoteAsOptions(p)
    const quoteAs = ws.quoteAs && options.includes(ws.quoteAs) ? ws.quoteAs : defaultQuoteAs(p)
    setWs((w) => ({
      ...w,
      profileId: p.id,
      quoteAs,
      // A color or frame only means something for the family it was picked for.
      color: quoteAs === w.quoteAs ? w.color : null,
      frameIn: quoteAs === w.quoteAs ? w.frameIn : null,
    }))
  }

  const pickQuoteAs = (q: QuoteAs) => setWs((w) => ({ ...w, quoteAs: q, color: q === w.quoteAs ? w.color : null, frameIn: q === w.quoteAs ? w.frameIn : null }))

  const rails = ws.rails ?? 0
  const row = wearstripRow(ws, unit)
  const missing = missingForWearstrip(ws)
  const warnings = wearstripWarnings(ws, unit)
  const family = ws.quoteAs && ws.quoteAs !== 'match' ? getFamily(ws.quoteAs) : null
  const catalogDims = family && (family.family === 'onetrackFlat' || family.family === 'onetrackFlanged')
    ? findWearstrip(family.family, { color: 'Natural' })?.dims
    : null

  const setRails = (text: string) => {
    const n = Number.parseInt(text, 10)
    const count = Number.isFinite(n) && n > 0 ? n : null
    setWs((w) => {
      const lengths = [...w.lengthsIn]
      while (count && lengths.length < count) lengths.push(null)
      return { ...w, rails: count, lengthsIn: lengths }
    })
  }

  // Sections are numbered in the order they appear; later ones only show once a profile is picked.
  let shown = 0
  const num = () => ++shown
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="min-h-[48px] text-base text-brand -ml-3" onClick={onCancel}>
          <ChevronLeft className="size-5" /> {isNew ? 'All categories' : 'Back to the BOM'}
        </Button>
      </div>
      <div>
        <h3 className="text-xl font-semibold">{isNew ? 'Add wearstrip' : 'Edit wearstrip'}</h3>
        <p className="text-base text-muted-foreground">
          Say what's on the frame, measure it, and count the rails. The quantity works itself out.
        </p>
      </div>

      <Section n={num()} title="What is it for?">
        <ChoiceButtons
          title="Use"
          value={ws.use ?? ('' as never)}
          columns={4}
          onChange={(v) => set({ use: v })}
          options={WEARSTRIP_USES.map((u) => ({ value: u, label: u }))}
        />
      </Section>

      <Section n={num()} title="What's installed now?" helper="Tap the profile that matches what's on the conveyor.">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {PROFILES.filter((p) => p.row === 'standard').map((p) => (
            <ProfileTile key={p.id} p={p} selected={ws.profileId === p.id} onPick={() => pickProfile(p)} />
          ))}
        </div>
        <p className="text-base font-semibold pt-2">Radius belts (OneTrack)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {PROFILES.filter((p) => p.row === 'radius').map((p) => (
            <ProfileTile key={p.id} p={p} selected={ws.profileId === p.id} onPick={() => pickProfile(p)} />
          ))}
        </div>
        {profile?.id === 'other' && (
          <div>
            <label htmlFor="ws-other" className={fieldLabel}>
              Describe it
            </label>
            <textarea
              id="ws-other"
              rows={2}
              value={ws.otherDescription}
              onChange={(e) => set({ otherDescription: e.target.value })}
              placeholder="e.g. T-slot cap, 1 in wide"
              className="w-full rounded-lg border border-gray-400 p-3 text-base bg-white"
            />
            <p className="text-sm text-muted-foreground mt-1">Then take a straight-on end photo with a ruler in the Photos step.</p>
          </div>
        )}
      </Section>

      {profile && (
        <Section n={num()} title="What should CS quote?">
          <ChoiceButtons<QuoteAs>
            title="Quote as"
            value={ws.quoteAs ?? ('' as never)}
            columns={profile.row === 'radius' ? 2 : 3}
            onChange={pickQuoteAs}
            options={quoteAsOptions(profile).map((q) => ({
              value: q,
              label: quoteAsLabel(q),
              detail: q === 'match' ? 'No part number. CS works from your measurements and photos.' : 'Has an Intralox part number.',
            }))}
          />
          {family && (
            <div className="space-y-3 rounded-xl border border-border bg-white p-3">
              <div className={cn('grid gap-2', family.drawings.length > 1 ? 'grid-cols-3' : 'grid-cols-1')}>
                {family.drawings.map((d) => (
                  <img key={d} src={d} alt={`${family.label} drawing`} className="w-full max-h-64 object-contain" loading="lazy" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Intralox drawing. Compare it with what's on the frame.</p>
              {family.option === 'color' ? (
                <ChoiceButtons
                  title="Color"
                  value={ws.color ?? ('' as never)}
                  columns={2}
                  onChange={(c) => set({ color: c })}
                  options={colorsFor(family.family).map((c) => ({ value: c, label: c }))}
                />
              ) : (
                <ChoiceButtons
                  title="Conveyor frame thickness (A on the drawing)"
                  value={ws.frameIn ?? ('' as never)}
                  columns={3}
                  onChange={(f) => set({ frameIn: f })}
                  options={framesFor(family.family).map((f) => ({ value: f, label: `${f} in` }))}
                />
              )}
            </div>
          )}
        </Section>
      )}

      {profile && profile.dims.length > 0 && (
        <Section
          n={num()}
          title="Measure the profile"
          helper={
            ws.quoteAs === 'match'
              ? 'CS needs at least W and H to source a match.'
              : 'Optional for a OneTrack part, but it catches a strip that won\'t fit.'
          }
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
            <ProfileDiagram group={profile.group} />
            <div className="space-y-3">
              {catalogDims && (
                <p className="text-sm rounded-lg bg-secondary px-3 py-2">
                  {family?.label} is {formatDim(catalogDims.widthIn, unit)} {unit} wide × {formatDim(catalogDims.heightIn, unit)} {unit} high
                  {catalogDims.flangeWidthIn
                    ? `, with a ${formatDim(catalogDims.flangeWidthIn, unit)} × ${formatDim(catalogDims.flangeHeightIn ?? 0, unit)} ${unit} flange`
                    : ''}
                  .
                </p>
              )}
              {profile.dims.map((k) => (
                <DimInput
                  key={`${k}-${unit}`}
                  id={`ws-dim-${k}`}
                  title={`${k}: ${DIM_LABELS[k]}`}
                  valueIn={ws.dims[k]}
                  unit={unit}
                  onChange={(v) => setWs((w) => ({ ...w, dims: { ...w.dims, [k]: v } }))}
                />
              ))}
            </div>
          </div>
        </Section>
      )}

      {profile && (
        <Section n={num()} title="Rails and length" helper="Count every rail that gets wearstrip, on both sides of the belt.">
          <NumberField
            id="ws-rails"
            title="Number of rails"
            inputMode="numeric"
            value={ws.rails === null ? '' : String(ws.rails)}
            onChange={setRails}
          />
          <CheckField
            id="ws-different"
            title="Rails are different lengths"
            checked={!ws.sameLength}
            onChange={(v) => set({ sameLength: !v })}
          />
          {ws.sameLength ? (
            <RunInput
              key={`same-${unit}`}
              id="ws-len-0"
              title="Length of each rail"
              valueIn={ws.lengthsIn[0]}
              unit={unit}
              onChange={(v) => setWs((w) => ({ ...w, lengthsIn: [v, ...w.lengthsIn.slice(1)] }))}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: rails }, (_, i) => (
                <RunInput
                  key={`${i}-${unit}`}
                  id={`ws-len-${i}`}
                  title={`Rail ${i + 1}`}
                  valueIn={ws.lengthsIn[i]}
                  unit={unit}
                  onChange={(v) =>
                    setWs((w) => {
                      const lengths = [...w.lengthsIn]
                      lengths[i] = v
                      return { ...w, lengthsIn: lengths }
                    })
                  }
                />
              ))}
            </div>
          )}
        </Section>
      )}

      <section className="rounded-xl border-2 border-brand/30 bg-blue-50/40 p-4 space-y-3">
        <h4 className="text-lg font-semibold">The BOM line</h4>
        {row ? (
          <div>
            <p className="font-mono-num font-bold text-base">{row.partNumber}</p>
            <p className="text-base">{row.description}</p>
            <p className="text-base font-semibold mt-1">
              Qty {row.qty} ({row.uom})
            </p>
            <p className="text-sm text-muted-foreground">{row.reason}</p>
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
          <Button className="min-h-[48px] text-base bg-brand hover:bg-brand-hover" disabled={!ws.profileId} onClick={() => onSave(ws)}>
            {isNew ? 'Add to BOM' : 'Update BOM line'}
          </Button>
        </div>
      </section>
    </div>
  )
}

