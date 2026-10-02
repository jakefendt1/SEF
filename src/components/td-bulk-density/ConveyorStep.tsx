import { SERIES, SERIES_LABEL } from '@/lib/tdBulkDensity/data/flights'
import { RVT_MAX_INCLINE_DEG } from '@/lib/tdBulkDensity/data/indents'
import { readField } from '@/lib/tdBulkDensity/form'
import type { Series } from '@/lib/tdBulkDensity/types'
import { unitLabel } from '@/lib/tdBulkDensity/units'
import { ChoiceButtons, ManualFigure, NumberField } from './fields'
import type { StepProps } from './stepProps'

export function ConveyorStep({ form, set }: StepProps) {
  const sys = form.system
  const incline = readField(form, 'incline')
  return (
    <div className="space-y-5">
      <ChoiceButtons<Series>
        title="Belt series"
        value={form.series}
        columns={3}
        onChange={(series) => set({ series })}
        options={SERIES.map((s) => ({ value: s, label: SERIES_LABEL[s] }))}
      />
      <NumberField
        id="td-belt-width"
        title="Belt width"
        unit={unitLabel('length', sys)}
        value={form.beltWidth}
        onChange={(beltWidth) => set({ beltWidth })}
        helper="Full belt width, edge to edge. Flight width is worked out from the indents."
      />
      <NumberField
        id="td-incline"
        title="Incline angle"
        unit="°"
        value={form.incline}
        onChange={(incline) => set({ incline })}
        helper="Measured from horizontal."
        problem={
          incline !== null && (incline <= 0 || incline >= 90)
            ? 'Enter an angle between 0° and 90°.'
            : undefined
        }
      />
      {incline !== null && incline > 0 && incline <= RVT_MAX_INCLINE_DEG && (
        <p className="text-sm text-muted-foreground">
          At {RVT_MAX_INCLINE_DEG}° or less, flightless Ribbed V-Top may work (p.13).
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          id="td-target"
          title="Target throughput"
          unit={unitLabel('massRate', sys)}
          value={form.target}
          onChange={(target) => set({ target })}
          optional
          helper="Gives the minimum belt speed."
        />
        <NumberField
          id="td-speed"
          title="Belt speed"
          unit={unitLabel('speed', sys)}
          value={form.speed}
          onChange={(speed) => set({ speed })}
          optional
          helper="Gives the throughput at this speed."
        />
      </div>
      <NumberField
        id="td-incline-length"
        title="Incline length"
        unit={unitLabel('lengthFt', sys)}
        value={form.inclineLength}
        onChange={(inclineLength) => set({ inclineLength })}
        optional
        helper="Adds product weight on the incline and the lift for the belt pull calc."
      />
      <ManualFigure
        src="/td-bulk-density/incline-fig37.png"
        caption="Flat vs. inclined flighted conveyor (Fig. 37, p.116)"
      />
    </div>
  )
}
