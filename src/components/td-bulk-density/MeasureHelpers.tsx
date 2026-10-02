// Guided field measurement of bulk density and angle of repose (plan §5).
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { parseMeasurement } from '@/lib/measurement'
import {
  VOLUME_LABEL,
  WEIGHT_LABEL,
  bulkDensityLbFt3,
  reposeFromPile,
  type VolumeUnit,
  type WeightUnit,
} from '@/lib/tdBulkDensity/helpers'
import { formatQty, type UnitSystem } from '@/lib/tdBulkDensity/units'
import { ChoiceButtons, NumberField } from './fields'

export function DensityHelper({
  open,
  onOpenChange,
  system,
  onUse,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  system: UnitSystem
  /** Called with lb/ft³. */
  onUse: (densityLbFt3: number) => void
}) {
  const [vol, setVol] = useState('')
  const [volUnit, setVolUnit] = useState<VolumeUnit>(system === 'metric' ? 'L' : 'gal')
  const [wt, setWt] = useState('')
  const [wtUnit, setWtUnit] = useState<WeightUnit>(system === 'metric' ? 'kg' : 'lb')
  const rho = bulkDensityLbFt3(parseMeasurement(vol), volUnit, parseMeasurement(wt), wtUnit)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Measure bulk density</DialogTitle>
          <DialogDescription className="text-base">
            Pour product loosely into a container of known volume — don't tap or press it down,
            so the number matches what the belt carries. Strike it level and weigh the product only.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <NumberField id="dh-vol" title="Container volume" value={vol} onChange={setVol} />
          <ChoiceButtons<VolumeUnit>
            title="Volume unit"
            value={volUnit}
            columns={4}
            onChange={setVolUnit}
            options={(Object.keys(VOLUME_LABEL) as VolumeUnit[]).map((u) => ({ value: u, label: VOLUME_LABEL[u] }))}
          />
          <NumberField id="dh-wt" title="Net product weight" value={wt} onChange={setWt} />
          <ChoiceButtons<WeightUnit>
            title="Weight unit"
            value={wtUnit}
            columns={4}
            onChange={setWtUnit}
            options={(Object.keys(WEIGHT_LABEL) as WeightUnit[]).map((u) => ({ value: u, label: WEIGHT_LABEL[u] }))}
          />
          <p className="text-lg font-semibold" aria-live="polite">
            {rho === null ? 'Enter both to see the density.' : `Bulk density: ${formatQty(rho, 'density', system)}`}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" className="min-h-[48px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="min-h-[48px] bg-brand hover:bg-brand-hover"
            disabled={rho === null}
            onClick={() => {
              if (rho !== null) onUse(rho)
              onOpenChange(false)
            }}
          >
            Use this density
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ReposeHelper({
  open,
  onOpenChange,
  onUse,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onUse: (reposeDeg: number) => void
}) {
  const [h, setH] = useState('')
  const [d, setD] = useState('')
  const g = reposeFromPile(parseMeasurement(h), parseMeasurement(d))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Measure angle of repose</DialogTitle>
          <DialogDescription className="text-base">
            Pour a free pile onto a flat surface from just above it. Measure the pile's height and
            the diameter of its base, in the same units.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <svg viewBox="0 0 240 90" className="w-full max-w-xs mx-auto" aria-hidden="true">
            <polygon points="20,80 120,20 220,80" fill="#E8B04B" stroke="#B9862F" />
            <line x1="120" y1="20" x2="120" y2="80" stroke="#1F2937" strokeDasharray="4 3" />
            <text x="126" y="55" fontSize="12" fill="#1F2937">h</text>
            <line x1="20" y1="86" x2="220" y2="86" stroke="#1F2937" />
            <text x="114" y="84" fontSize="12" fill="#1F2937">D</text>
            <text x="34" y="76" fontSize="12" fill="#1F2937">γ</text>
          </svg>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="rh-h" title="Pile height h" value={h} onChange={setH} />
            <NumberField id="rh-d" title="Base diameter D" value={d} onChange={setD} />
          </div>
          <p className="text-lg font-semibold" aria-live="polite">
            {g === null ? 'Enter both to see the angle.' : `Angle of repose: ${g.toFixed(1)}°`}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" className="min-h-[48px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="min-h-[48px] bg-brand hover:bg-brand-hover"
            disabled={g === null}
            onClick={() => {
              if (g !== null) onUse(g)
              onOpenChange(false)
            }}
          >
            Use this angle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
