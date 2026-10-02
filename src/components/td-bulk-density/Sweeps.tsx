// The three sensitivity sweeps (plan §7.4). Tap a point to read it; the
// button under the readout applies that value to the inputs.
import { Loader2 } from 'lucide-react'
import type { Sweep } from '@/lib/tdBulkDensity/sweeps'
import { formatLen, formatQty, type UnitSystem } from '@/lib/tdBulkDensity/units'
import { LineChart, type ChartSeries } from './LineChart'
import { SWEEP_COLORS } from './palette'

export interface SweepPick {
  sweep: Sweep['id']
  x: number
}

export function Sweeps({
  sweeps,
  busy,
  stale,
  system,
  onPick,
}: {
  sweeps: Sweep[] | null
  busy: boolean
  /** True when the shown sweeps were computed for older inputs. */
  stale: boolean
  system: UnitSystem
  onPick: (p: SweepPick) => void
}) {
  if (!sweeps) {
    return (
      <p className="flex items-center gap-2 text-base text-muted-foreground py-6">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Working out the sweeps…
      </p>
    )
  }
  return (
    <div className="space-y-8">
      {(busy || stale) && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Updating for your latest change…
        </p>
      )}
      {sweeps.map((s) => {
        const metric = s.yMetric
        const formatY = (y: number) =>
          metric === 'throughput' ? formatQty(y, 'massRate', system, { unit: false }) : formatQty(y, 'mass', system, { unit: false })
        const yLabel = metric === 'throughput' ? `Throughput (${system === 'metric' ? 'kg/h' : 'lb/h'})` : `Product per flight (${system === 'metric' ? 'kg' : 'lb'})`
        const formatX = (x: number) => (s.xKind === 'angle' ? `${Math.round(x)}°` : formatLen(x, system))
        const series: ChartSeries[] = s.series.map((ser) => ({
          id: ser.id,
          label:
            ser.id === 'sidewalls' && s.sidewallHeightIn !== undefined
              ? `Sidewalls ${formatLen(s.sidewallHeightIn, system)}`
              : ser.label,
          color: SWEEP_COLORS[ser.id as keyof typeof SWEEP_COLORS] ?? SWEEP_COLORS.current,
          points: ser.points,
        }))
        if (s.reference) {
          series.push({ id: 'walls', label: s.reference.label, color: SWEEP_COLORS.walls, points: s.reference.points, dashed: true })
        }
        if (s.series.length === 0) {
          return (
            <div key={s.id}>
              <p className="text-base font-semibold">{s.title}</p>
              <p className="text-base text-muted-foreground">{s.note}</p>
            </div>
          )
        }
        const pickLabel = (x: number) => {
          if (s.id === 'sidewall') return `Use ${formatLen(x, system)} sidewalls`
          if (s.id === 'angle') return `Use ${Math.round(x)}° incline`
          return `Use ${formatLen(x, system)} spacing`
        }
        return (
          <div key={s.id} className="space-y-1">
            <LineChart
              title={s.title}
              series={series}
              markers={s.markers.map((m) => ({ ...m, color: SWEEP_COLORS['sidewall-height'] }))}
              current={s.current}
              disallowedBelow={s.disallowedBelow}
              xLabel={s.xLabel}
              yLabel={yLabel}
              formatX={formatX}
              formatY={formatY}
              pickLabel={pickLabel}
              onPick={(x) => onPick({ sweep: s.id, x })}
            />
            {s.note && <p className="text-sm text-muted-foreground">{s.note}</p>}
          </div>
        )
      })}
    </div>
  )
}
