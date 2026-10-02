import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MAX_DYNAMIC_DERATE_DEG } from '@/lib/tdBulkDensity/data/indents'
import { CUSTOM_PRODUCT_ID, PRODUCT_PRESETS, findPreset } from '@/lib/tdBulkDensity/data/products'
import { applyPreset, fieldText, readField } from '@/lib/tdBulkDensity/form'
import { formatQty, unitLabel } from '@/lib/tdBulkDensity/units'
import { NumberField, SectionNote, SelectField } from './fields'
import { DensityHelper, ReposeHelper } from './MeasureHelpers'
import type { StepProps } from './stepProps'

export function ProductStep({ form, set }: StepProps) {
  const sys = form.system
  const [densityOpen, setDensityOpen] = useState(false)
  const [reposeOpen, setReposeOpen] = useState(false)
  const preset = findPreset(form.productPreset)
  const repose = readField(form, 'repose')
  const derate = readField(form, 'derate')

  return (
    <div className="space-y-5">
      <SelectField
        id="td-preset"
        title="Product"
        value={form.productPreset}
        onChange={(id) => set(applyPreset(form, id))}
        options={[
          ...PRODUCT_PRESETS.map((p) => ({ value: p.id, label: p.label })),
          { value: CUSTOM_PRODUCT_ID, label: 'Custom — enter my own' },
        ]}
        placeholder="Pick a product, or Custom"
        helper="Presets are typical ranges, not Intralox data — confirm with the customer."
      />
      {preset && (
        <SectionNote>
          Typical range — confirm with customer: {formatQty(preset.densityRange[0], 'density', sys, { unit: false })}–
          {formatQty(preset.densityRange[1], 'density', sys)}.
        </SectionNote>
      )}

      <div>
        <NumberField
          id="td-density"
          title="Bulk density"
          unit={unitLabel('density', sys)}
          value={form.density}
          onChange={(density) => set({ density })}
          helper="Loose-poured, as conveyed."
        />
        <Button variant="outline" className="mt-2 min-h-[48px] text-base" onClick={() => setDensityOpen(true)}>
          Measure it
        </Button>
      </div>

      <div>
        <NumberField
          id="td-repose"
          title="Angle of repose (static)"
          unit="°"
          value={form.repose}
          onChange={(repose) => set({ repose })}
          helper="The slope of a freely poured pile."
          problem={repose !== null && (repose < 0 || repose >= 90) ? 'Between 0° and 90°.' : undefined}
        />
        <Button variant="outline" className="mt-2 min-h-[48px] text-base" onClick={() => setReposeOpen(true)}>
          Measure it
        </Button>
      </div>

      <NumberField
        id="td-dim"
        title="Smallest product dimension"
        unit={unitLabel('length', sys)}
        value={form.smallestDim}
        onChange={(smallestDim) => set({ smallestDim })}
        helper="The thinnest way a piece can turn — decides whether it fits through guard and sidewall gaps."
      />

      <NumberField
        id="td-fill"
        title="Fill factor"
        unit="%"
        value={form.fill}
        onChange={(fill) => set({ fill })}
        helper="Center-fed steady flow: 75–90%. Off-center or surging feed: 50–70%. A photo or video of a similar line helps."
      />

      <NumberField
        id="td-derate"
        title="Dynamic derate"
        unit="°"
        value={form.derate}
        onChange={(derate) => set({ derate })}
        helper={
          repose !== null && derate !== null
            ? `Flight impacts and surges flatten the pile on a moving incline. Used: ${Math.max(0, repose - derate).toFixed(1)}° (an engineering default of 5°, not a manual figure).`
            : 'Flight impacts and surges flatten the pile on a moving incline. 5° is an engineering default, not a manual figure.'
        }
        problem={
          derate !== null && (derate < 0 || derate > MAX_DYNAMIC_DERATE_DEG)
            ? `Between 0° and ${MAX_DYNAMIC_DERATE_DEG}°.`
            : undefined
        }
      />

      <DensityHelper
        open={densityOpen}
        onOpenChange={setDensityOpen}
        system={sys}
        onUse={(rho) => set({ density: fieldText(rho, 'density', sys), productPreset: CUSTOM_PRODUCT_ID })}
      />
      <ReposeHelper
        open={reposeOpen}
        onOpenChange={setReposeOpen}
        onUse={(g) => set({ repose: fieldText(g, 'repose', sys), productPreset: CUSTOM_PRODUCT_ID })}
      />
    </div>
  )
}
