// The headline numbers. Minimum speed and throughput at the entered speed are
// both shown every time; a missing input says what's missing rather than
// showing a zero.
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TdComputed } from '@/lib/tdBulkDensity/compute'
import { CASE_WORDING } from '@/lib/tdBulkDensity/pocket2d'
import { densityLbIn3 } from '@/lib/tdBulkDensity/throughput'
import { formatQty, type UnitSystem } from '@/lib/tdBulkDensity/units'
import { cn } from '@/lib/utils'

function Big({ label, value, sub }: { label: string; value: string | null; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn('font-mono-num font-bold leading-tight', value ? 'text-2xl text-foreground' : 'text-base text-muted-foreground py-1')}>
        {value ?? sub}
      </p>
      {value && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  )
}

/** What the 3D view's solid product is, in words -- the load, not the capacity. */
function LoadLine({ result, system }: { result: TdComputed; system: UnitSystem }) {
  const l = result.load!
  const i = result.inputs
  const pct = Math.round(l.fraction * 100)
  if (l.source === 'target' && i.targetLbPerHr !== null && i.beltSpeedFpm !== null) {
    const what = `To carry ${formatQty(i.targetLbPerHr, 'massRate', system)} at ${formatQty(i.beltSpeedFpm, 'speed', system)}`
    if (l.overCapacity) {
      return (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-sm">
          {what}, each pocket would need <strong>{formatQty(l.massLb, 'mass', system)}</strong> — {pct}% of what it can
          hold. It can't; the view shows pockets brim-full.
        </p>
      )
    }
    return (
      <p className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-sm">
        {what}, each pocket carries <strong>{formatQty(l.massLb, 'mass', system)}</strong> — <strong>{pct}%</strong> of
        what it can hold. That's the load the views show.
      </p>
    )
  }
  return (
    <p className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-sm">
      The views show pockets at your {i.fillPct}% fill factor ({formatQty(l.massLb, 'mass', system)} each). Enter a
      target throughput and a belt speed to see the load they need instead.
    </p>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b border-border/60 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-mono-num font-semibold text-right">{value}</dd>
    </div>
  )
}

export function ResultsCard({
  result,
  missing,
  refining,
  system,
  onGoToStep,
}: {
  result: TdComputed | null
  missing: string[]
  refining: boolean
  system: UnitSystem
  onGoToStep?: () => void
}) {
  const q = (v: number, k: Parameters<typeof formatQty>[1]) => formatQty(v, k, system)

  let body: React.ReactNode
  if (missing.length > 0) {
    body = (
      <div>
        <p className="text-base">Enter these to see results:</p>
        <ul className="list-disc pl-6 mt-1 text-base text-muted-foreground">
          {missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        {onGoToStep && (
          <button type="button" onClick={onGoToStep} className="mt-2 min-h-[48px] font-semibold text-brand underline">
            Take me there
          </button>
        )}
      </div>
    )
  } else if (!result) {
    body = (
      <p className="flex items-center gap-2 text-base text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Working it out…
      </p>
    )
  } else if (result.status !== 'ok') {
    body = <p className="text-base text-warning-orange font-medium">{result.statusReason}</p>
  } else if (result.blocked) {
    const n = result.warnings.filter((w) => w.severity === 'error').length
    body = (
      <p className="text-base text-destructive font-medium">
        {n === 1 ? 'One input breaks a manual rule' : `${n} inputs break manual rules`} — fix
        {n === 1 ? ' it' : ' them'} (see below) to see results.
      </p>
    )
  } else {
    const t = result.throughput!
    body = (
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Big
            label="Minimum belt speed"
            value={t.minSpeedFpm !== null ? q(t.minSpeedFpm, 'speed') : null}
            sub={t.minSpeedFpm !== null ? 'for the target throughput' : 'Enter a target throughput'}
          />
          <Big
            label="Throughput at belt speed"
            value={t.throughputLbPerHr !== null ? q(t.throughputLbPerHr, 'massRate') : null}
            sub={t.flightsPerMin !== null ? `${t.flightsPerMin.toFixed(1)} flights/min` : 'Enter a belt speed'}
          />
        </div>
        {result.load && <LoadLine result={result} system={system} />}
        {result.geometricCase && (
          <p className="text-sm">{CASE_WORDING[result.geometricCase]}</p>
        )}
        <dl>
          <Row label={`Product per flight (at ${result.inputs.fillPct}% fill)`} value={q(t.massPerFlightLb, 'mass')} />
          <Row label="Pocket capacity, brim-full" value={q(densityLbIn3(result.inputs.densityLbFt3) * result.pocketVolumeIn3, 'mass')} />
          <Row label="Pocket area (side section)" value={q(result.pocketAreaIn2, 'area')} />
          <Row label="Pocket volume" value={q(result.pocketVolumeIn3, 'volume')} />
          <Row
            label="Edge loss vs. walls at both ends"
            value={`${result.edgeLossPct.toFixed(0)}%`}
          />
          <Row label="Flight load" value={`${q(t.flightLoadLbf, 'force')} · ${q(t.flightLoadLbfPerIn, 'forcePerLen')}`} />
          {t.flightLoadSurgeLbf !== null && t.flightLoadSurgeLbfPerIn !== null && (
            <Row
              label="Flight load, brim-full (surge)"
              value={`${q(t.flightLoadSurgeLbf, 'force')} · ${q(t.flightLoadSurgeLbfPerIn, 'forcePerLen')}`}
            />
          )}
          <Row label="Product load on belt" value={q(t.beltLoadLbPerFt, 'linearLoad')} />
          <Row label="Belt-pull input (CalcLab)" value={q(t.areaLoadLbPerFt2, 'areaLoad')} />
          {t.inclineProductLb !== null && (
            <Row label="Product on the incline" value={q(t.inclineProductLb, 'mass')} />
          )}
          {t.inclineLiftLbf !== null && (
            <Row label="Product lift (belt pull)" value={q(t.inclineLiftLbf, 'force')} />
          )}
          {result.wallLoad && (
            <Row
              label={result.guardDragPerPocketLbf !== null ? 'Guard pressure, max' : 'Sidewall pressure, max'}
              value={q(result.wallLoad.maxPressurePsi, 'pressure')}
            />
          )}
          {result.guardDragPerPocketLbf !== null && (
            <Row label="Guard drag per pocket per side" value={q(result.guardDragPerPocketLbf, 'force')} />
          )}
          {result.guardDragTotalLbf !== null && (
            <Row label="Guard drag on incline (add to belt pull)" value={q(result.guardDragTotalLbf, 'force')} />
          )}
        </dl>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Results</CardTitle>
        {refining && missing.length === 0 && result?.status === 'ok' && (
          <span className="text-sm text-muted-foreground flex items-center gap-1" aria-live="polite">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Refining
          </span>
        )}
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
