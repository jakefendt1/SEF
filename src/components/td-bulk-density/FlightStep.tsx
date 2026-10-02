import { FLIGHT_TYPES, FLIGHT_TYPE_ORDER, SCOOP_LIPS } from '@/lib/tdBulkDensity/data/flights'
import { readField } from '@/lib/tdBulkDensity/form'
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
  const spacing = readField(form, 'flightSpacing')
  const tooClose = spacing !== null && spacing < minS - 0.01

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
                ? `body ${formatLen(scoopBodyIn(form.flightType, h), sys)}`
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
          Height is the lip tip's height above the belt. The lip is{' '}
          {formatLen(SCOOP_LIPS[form.flightType].lipLengthIn, sys)} at{' '}
          {SCOOP_LIPS[form.flightType].phiDeg}° for every height; only the body changes.
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
    </div>
  )
}
