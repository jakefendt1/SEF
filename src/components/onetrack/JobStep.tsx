// Step 1: the job. Nothing describing the customer's line is pre-filled; the
// date and the rep's name are app facts.
import { BELT_SERIES } from '@/schema/beltSeries'
import type { Unit } from '@/lib/measurement'
import type { OnetrackJob } from '@/lib/onetrack/bom'
import { DimInput, TextField } from './controls'

const THERMODRIVE = ['8026', '8050', '8126', '8140']
const SERIES_SUGGESTIONS = [...BELT_SERIES.map((s) => `S${s.series}`), ...THERMODRIVE.map((s) => `ThermoDrive ${s}`)]

export function JobStep({
  job,
  unit,
  onChange,
  showErrors,
}: {
  job: OnetrackJob
  unit: Unit
  onChange: (patch: Partial<OnetrackJob>) => void
  showErrors: boolean
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">1. Job</h3>
        <p className="text-base text-muted-foreground">Who it's for and which line. Customer and line are needed to save.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="job-customer"
          title="Customer"
          value={job.customer}
          onChange={(v) => onChange({ customer: v })}
          problem={showErrors && !job.customer.trim() ? 'Customer is needed.' : undefined}
        />
        <TextField id="job-plant" title="Plant / city" optional value={job.plant} onChange={(v) => onChange({ plant: v })} />
        <TextField
          id="job-line"
          title="Line / conveyor ID"
          value={job.line}
          onChange={(v) => onChange({ line: v })}
          problem={showErrors && !job.line.trim() ? 'Line / conveyor ID is needed.' : undefined}
        />
        <TextField id="job-date" type="date" title="Date" value={job.date} onChange={(v) => onChange({ date: v })} />
        <TextField id="job-by" title="Prepared by" value={job.preparedBy} onChange={(v) => onChange({ preparedBy: v })} />
        <TextField
          id="job-series"
          title="Belt series"
          optional
          list="onetrack-series"
          value={job.beltSeries}
          onChange={(v) => onChange({ beltSeries: v })}
          helper="e.g. S1600. Sprockets and pullers are filtered to it."
        />
        <datalist id="onetrack-series">
          {SERIES_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <DimInput
          key={`width-${unit}`}
          id="job-width"
          title={
            <>
              Belt width <span className="font-normal text-muted-foreground">(optional)</span>
            </>
          }
          valueIn={job.beltWidthIn}
          unit={unit}
          onChange={(v) => onChange({ beltWidthIn: v })}
        />
      </div>
    </div>
  )
}
