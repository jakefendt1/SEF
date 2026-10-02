import {
  LIMITER_CLEARANCE_IN,
  MIN_INDENT_IN,
  ROLLER_LIMITER_MIN_IN,
} from '@/lib/tdBulkDensity/data/indents'
import { PITCH_LABEL, SIDEWALL_FOOTPRINT_IN } from '@/lib/tdBulkDensity/data/sidewalls'
import { previewWidth, readField } from '@/lib/tdBulkDensity/form'
import { availableOptions } from '@/lib/tdBulkDensity/rules'
import type { Containment, SidewallPitch } from '@/lib/tdBulkDensity/types'
import { formatLen, unitLabel } from '@/lib/tdBulkDensity/units'
import { CheckField, ChoiceButtons, ManualFigure, NumberField, SectionNote } from './fields'
import type { StepProps } from './stepProps'

const CONTAINMENT_TEXT: Record<Containment, { label: string; detail: string }> = {
  open: { label: 'Open flight ends', detail: 'Nothing holds product at the flight ends.' },
  guards: { label: 'Frame guards', detail: 'Stationary guards beside the flight ends.' },
  sidewalls: { label: 'Synchronized sidewalls', detail: 'Corrugated sidewalls that travel with the belt.' },
  sealed: { label: 'Sealed Pocket', detail: 'Flights joined to the sidewall (p.75).' },
}

export function EdgeStep({ form, set }: StepProps) {
  const sys = form.system
  const L = unitLabel('length', sys)
  const opts = availableOptions(form)
  const hasSidewalls = form.containment === 'sidewalls' || form.containment === 'sealed'
  const holdDown = readField(form, 'holdDownWidth')
  const iReq = Math.max(MIN_INDENT_IN, (holdDown ?? 0) + LIMITER_CLEARANCE_IN)
  const notchCount = readField(form, 'notchCount') ?? 0
  const width = previewWidth(form)

  const indentProblem = (field: 'indentLeft' | 'indentRight' | 'sidewallIndent') => {
    const v = readField(form, field)
    if (v === null) return undefined
    if (v < MIN_INDENT_IN - 0.01) return `Below the ${formatLen(MIN_INDENT_IN, sys)} manufacturable minimum (p.75) — special order.`
    if (v < iReq - 0.01) return `Needs ${formatLen(iReq, sys)} to keep ${formatLen(LIMITER_CLEARANCE_IN, sys)} clear of the hold-down (p.114).`
    if (form.rollerLimiters && v < ROLLER_LIMITER_MIN_IN - 0.01) return `Flighted roller limiters need ${formatLen(ROLLER_LIMITER_MIN_IN, sys)}.`
    return undefined
  }

  return (
    <div className="space-y-5">
      <ChoiceButtons<Containment>
        title="What holds product at the flight ends?"
        value={form.containment}
        columns={2}
        onChange={(containment) => set({ containment })}
        options={opts.containments.map((c) => ({
          value: c.value,
          label: CONTAINMENT_TEXT[c.value].label,
          detail: CONTAINMENT_TEXT[c.value].detail,
          disabled: !c.enabled,
          reason: c.reason,
          image: c.value === 'sealed' ? '/td-bulk-density/sealed-pocket.png' : undefined,
        }))}
      />

      {/* Live readout: the one number this step exists to get right. */}
      <div className="rounded-lg border border-brand/30 bg-blue-50 px-4 py-3" aria-live="polite">
        <p className="text-base font-semibold text-brand">
          Flight width ={' '}
          {width && width.flightWidthIn > 0 ? formatLen(width.flightWidthIn, sys) : '—'}{' '}
          <span className="font-normal">(carry width)</span>
        </p>
        {width && width.notches.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {formatLen(width.carryWidthIn, sys)} after {width.notches.length} notch
            {width.notches.length > 1 ? 'es' : ''} — notch width carries nothing.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Product in the indents has no flight behind it and slides back down the incline.
        </p>
      </div>

      {form.containment === 'guards' && (
        <>
          <NumberField
            id="td-guard"
            title="Guard clearance to the flight ends"
            unit={L}
            value={form.guardClearance}
            onChange={(guardClearance) => set({ guardClearance })}
            helper="Measure it on the line. Within the product's smallest size, the guard holds product like a wall; wider, product drops into the indent and slides back."
            problem={form.guardClearance.trim() === '' ? 'Needed for a result — there is no default.' : undefined}
          />
          <ManualFigure
            src="/td-bulk-density/containment-clearance-fig60.png"
            caption="Containment clearance: 0.125 in minimum to the belt edge (Fig. 60, p.130)"
          />
        </>
      )}

      {form.containment === 'sidewalls' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <ChoiceButtons<SidewallPitch>
            title="Sidewall pitch"
            value={form.sidewallPitch}
            onChange={(sidewallPitch) => set({ sidewallPitch })}
            options={opts.sidewallPitches.map((p) => ({
              value: p,
              label: PITCH_LABEL[p],
              detail: `footprint ${formatLen(SIDEWALL_FOOTPRINT_IN[p], sys)}`,
            }))}
          />
          <ChoiceButtons<string>
            title="Sidewall height"
            value={form.sidewallHeight}
            onChange={(sidewallHeight) => set({ sidewallHeight })}
            options={opts.sidewallHeights.map((h) => ({ value: String(h), label: formatLen(h, sys) }))}
          />
        </div>
      )}
      {form.containment === 'sealed' && (
        <SectionNote>
          Sealed Pocket sidewalls are the same height as the flights, 4 in at most, with 90-degree
          flights only (p.75).
        </SectionNote>
      )}

      {hasSidewalls ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            id="td-sw-indent"
            title="Sidewall indent (each side)"
            unit={L}
            value={form.sidewallIndent}
            onChange={(sidewallIndent) => set({ sidewallIndent })}
            helper={`At least ${formatLen(MIN_INDENT_IN, sys)} (p.78)${form.containment === 'sealed' ? '; 2 in recommended for Sealed Pocket' : ''}.`}
            problem={indentProblem('sidewallIndent')}
          />
          {form.containment === 'sidewalls' && (
            <NumberField
              id="td-sw-gap"
              title="Sidewall-to-flight gap"
              unit={L}
              value={form.sidewallGap}
              onChange={(sidewallGap) => set({ sidewallGap })}
              helper="At least 0.2 in (p.78)."
            />
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            id="td-indent-l"
            title="Left indent"
            unit={L}
            value={form.indentLeft}
            onChange={(indentLeft) => set({ indentLeft })}
            helper={`Hold-down zone. At least ${formatLen(iReq, sys)} here.`}
            problem={indentProblem('indentLeft')}
          />
          <NumberField
            id="td-indent-r"
            title="Right indent"
            unit={L}
            value={form.indentRight}
            onChange={(indentRight) => set({ indentRight })}
            helper={`Hold-down zone. At least ${formatLen(iReq, sys)} here.`}
            problem={indentProblem('indentRight')}
          />
        </div>
      )}

      <NumberField
        id="td-holddown"
        title="Hold-down / limiter contact width"
        unit={L}
        value={form.holdDownWidth}
        onChange={(holdDownWidth) => set({ holdDownWidth })}
        helper={`Required indent = the larger of ${formatLen(MIN_INDENT_IN, sys)} and this + ${formatLen(LIMITER_CLEARANCE_IN, sys)}. Default 1.0 in — confirm the real part.`}
      />
      <CheckField
        id="td-roller"
        title="Using flighted roller limiters"
        checked={form.rollerLimiters}
        onChange={(rollerLimiters) => set({ rollerLimiters })}
        helper={`Indents and notches need at least ${formatLen(ROLLER_LIMITER_MIN_IN, sys)}. Align limiters at the notch and sprocket (p.114).`}
      />
      <ManualFigure
        src="/td-bulk-density/clearances-fig36.png"
        caption="A: 0.25 in limiter clearance · B: 1.25 in minimum indent · C: 0.125 in containment clearance (Fig. 36, p.115)"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          id="td-notches"
          title="Notches"
          inputMode="numeric"
          value={form.notchCount}
          onChange={(notchCount) => set({ notchCount })}
          helper="Evenly spaced across the flight."
        />
        <NumberField
          id="td-notch-w"
          title="Notch width"
          unit={L}
          value={form.notchWidth}
          onChange={(notchWidth) => set({ notchWidth })}
          helper="Standard is 2 in (p.75)."
          problem={
            notchCount > 0 && form.rollerLimiters && (readField(form, 'notchWidth') ?? 0) < ROLLER_LIMITER_MIN_IN - 0.01
              ? `Flighted roller limiters need ${formatLen(ROLLER_LIMITER_MIN_IN, sys)} notches.`
              : undefined
          }
        />
      </div>
      {form.rollerLimiters && (
        <ManualFigure
          src="/td-bulk-density/limiter-alignment-fig52.png"
          caption="Limiter aligned at the notch and sprocket (Fig. 52, p.124)"
        />
      )}
    </div>
  )
}
