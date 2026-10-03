// "Why this differs from CalcLab": each of CalcLab's assumptions swapped for
// the real one, in turn, with what it does to product per flight. Bars share
// one scale (CalcLab = full width); numbers stay in ink, not bar colour.
import type { WaterfallStep } from '@/lib/tdBulkDensity/waterfall'
import { formatQty, type UnitSystem } from '@/lib/tdBulkDensity/units'
import { TD_COLORS } from './palette'

export function CalcLabWaterfall({ steps, system }: { steps: WaterfallStep[]; system: UnitSystem }) {
  const max = Math.max(...steps.map((s) => s.massLb), 1e-9)
  const extra = (s: WaterfallStep) =>
    s.throughputLbPerHr !== null
      ? formatQty(s.throughputLbPerHr, 'massRate', system)
      : s.minSpeedFpm !== null
        ? `min ${formatQty(s.minSpeedFpm, 'speed', system)}`
        : null
  return (
    <section aria-labelledby="calclab-waterfall" className="rounded-lg border border-border bg-white px-3 py-3 space-y-2">
      <h4 id="calclab-waterfall" className="text-base font-semibold">
        Why this differs from CalcLab
      </h4>
      <p className="text-sm text-muted-foreground">
        CalcLab assumes a thin flight, walls at both flight ends and the poured repose angle. Each row swaps one of those
        for the real thing.
      </p>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-base">{s.label}</span>
              <span className="text-base font-mono-num font-semibold">
                {formatQty(s.massLb, 'mass', system)}
                {extra(s) && <span className="font-normal text-muted-foreground"> · {extra(s)}</span>}
                {s.deltaPct !== null && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    ({s.deltaPct >= 0 ? '+' : ''}
                    {s.deltaPct.toFixed(0)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="h-3 rounded bg-secondary mt-1" aria-hidden="true">
              <div
                className="h-3 rounded"
                style={{
                  width: `${Math.max(1, (s.massLb / max) * 100)}%`,
                  background: i === steps.length - 1 ? TD_COLORS.productDark : TD_COLORS.product,
                }}
              />
            </div>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">Product per flight at your fill factor; the last row is this result.</p>
    </section>
  )
}
