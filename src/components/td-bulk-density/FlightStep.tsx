import { FLIGHT_TYPES, FLIGHT_TYPE_ORDER, SCOOP_LIPS, scoopReachIn } from '@/lib/tdBulkDensity/data/flights'
import { fromCalculatorSeries } from '@/lib/thermodrive/data'
import { offRowSnaps } from '@/lib/thermodrive/rows'
import { fieldText, readField } from '@/lib/tdBulkDensity/form'
import { scoopBodyIn } from '@/lib/tdBulkDensity/profiles'
import { availableOptions } from '@/lib/tdBulkDensity/rules'
import type { FlightType } from '@/lib/tdBulkDensity/types'
import { formatLen, unitLabel } from '@/lib/tdBulkDensity/units'
import { ChoiceButtons, NumberField, SectionNote } from './fields'
import type { StepProps } from './stepProps'

export function FlightStep({ form, set }: StepProps) {
  const sys = form.system
  const ft = FLIGHT_TYPES[form.flightType]
  const opts = availableOptions(form)
  const minS = opts.minSpacingIn
  const thick = Number(form.flightThickness) || 0.16
  const spacing = readField(form, 'flightSpacing')
  const tooClose = spacing !== null && spacing < minS - 0.01
  const snaps = spacing !== null ? offRowSnaps(fromCalculatorSeries(form.series), spacing) : null

  return (
    <div className="space-y-5">
      <ChoiceButtons<FlightType>
        title="Flight type"
        value={form.flightType}
        columns={2}
        onChange={(flightType) => set({ flightType })}
        options={FLIGHT_TYPE_ORDER.map((t) => ({
          value: t,
          label: FLIGHT_TYPES[t].label,
          detail: FLIGHT_TYPES[t].blurb,
          image: `/td-bulk-density/${FLIGHT_TYPES[t].image}`,
        }))}
      />

      {opts.flightHeights ? (
        <ChoiceButtons<string>
          title="Flight height"
          value={form.flightHeightChoice}
          columns={4}
          onChange={(flightHeightChoice) => set({ flightHeightChoice })}
          options={opts.flightHeights.map((h) => ({
            value: String(h),
            label: formatLen(h, sys),
            detail:
              form.flightType === 'scoop' || form.flightType === 'shortTopScoop'
                ? `body ${formatLen(scoopBodyIn(form.flightType, h, thick), sys)}`
                : undefined,
          }))}
        />
      ) : (
        <NumberField
          id="td-flight-height"
          title="Flight height"
          unit={unitLabel('length', sys)}
          value={form.flightHeightText}
          onChange={(flightHeightText) => set({ flightHeightText })}
          helper={`Cut to any height from ${formatLen(opts.flightHeightRange[0], sys)} to ${formatLen(opts.flightHeightRange[1], sys)} (${ft.cite}).`}
        />
      )}
      {(form.flightType === 'scoop' || form.flightType === 'shortTopScoop') && (
        <SectionNote>
          Height is the lip tip's height above the belt. The lip is bent at {SCOOP_LIPS[form.flightType].phiDeg}° and
          reaches {formatLen(scoopReachIn(form.flightType, thick), sys)} from the flight's back face at every height; only the body changes (scoop bulletin).
        </SectionNote>
      )}

      <ChoiceButtons<string>
        title="Flight thickness"
        value={form.flightThickness}
        columns={3}
        onChange={(flightThickness) => set({ flightThickness })}
        options={opts.thicknesses.map((t) => ({ value: String(t), label: formatLen(t, sys) }))}
      />

      <NumberField
        id="td-spacing"
        title="Flight spacing"
        unit={unitLabel('length', sys)}
        value={form.flightSpacing}
        onChange={(flightSpacing) => set({ flightSpacing })}
        helper={`Minimum for ${ft.label.toLowerCase()}s on ${form.series}: ${formatLen(minS, sys)}${form.series === 'S8140' ? ' (or 2 rows)' : ''} (${ft.cite}).`}
        problem={
          tooClose
            ? `Below the ${formatLen(minS, sys)} minimum for ${ft.label.toLowerCase()}s on ${form.series} (${ft.cite}).`
            : undefined
        }
      />
      {snaps && !tooClose && (
        <div className="rounded-lg border border-warning-orange/40 bg-warning-orange/5 px-3 py-2 space-y-2" role="status">
          <p className="text-base">
            Flights sit on belt rows, so the spacing is a whole number of rows. Use:
          </p>
          <div className="flex flex-wrap gap-2">
            {snaps.map((x) => (
              <button
                key={x.rows}
                type="button"
                onClick={() => set({ flightSpacing: fieldText(x.lengthIn, 'flightSpacing', sys) })}
                className="min-h-[48px] rounded-lg border border-brand bg-white px-3 text-base font-semibold text-brand"
              >
                {formatLen(x.lengthIn, sys)} ({x.rows} rows)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
