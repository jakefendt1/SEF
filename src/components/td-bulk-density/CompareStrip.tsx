// Side-by-side compare (plan §7.5): A is a pinned run, B is whatever the inputs
// say now. Every input and headline result in two columns, with what changed
// and whether it helped -- e.g. a 24 in vs a 30 in belt for the same product.
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { compareNames, compareRuns, compareTable, type CompareRow } from '@/lib/tdBulkDensity/compare'
import type { TdComputed } from '@/lib/tdBulkDensity/compute'
import type { UnitSystem } from '@/lib/tdBulkDensity/units'
import { cn } from '@/lib/utils'

function Rows({ rows, showDelta }: { rows: CompareRow[]; showDelta: boolean }) {
  return (
    <>
      {rows.map((r) => (
        <tr key={r.label} className={cn('border-b border-border/60 last:border-0', r.changed && !showDelta && 'bg-amber-50')}>
          <th scope="row" className="py-1.5 pr-2 text-left text-sm font-medium text-muted-foreground">
            {r.label}
          </th>
          <td className="py-1.5 px-2 text-right text-sm font-mono-num">{r.a}</td>
          <td className={cn('py-1.5 px-2 text-right text-sm font-mono-num', r.changed && 'font-semibold text-foreground')}>{r.b}</td>
          <td
            className={cn(
              'py-1.5 pl-2 text-right text-sm font-mono-num font-semibold whitespace-nowrap',
              r.better === true ? 'text-savings-green' : r.better === false ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {showDelta ? (r.delta ?? '') : r.changed ? 'changed' : ''}
          </td>
        </tr>
      ))}
    </>
  )
}

export function CompareStrip({
  a,
  b,
  system,
  onUnpin,
  onRestoreA,
}: {
  a: TdComputed
  b: TdComputed | null
  system: UnitSystem
  onUnpin: () => void
  onRestoreA: () => void
}) {
  const ready = !!(b && b.throughput && a.throughput)
  const c = ready ? compareRuns(a, b!, system) : null
  const table = ready ? compareTable(a, b!, system) : null
  const names = compareNames(a, ready ? b : null, system)
  return (
    <div className="rounded-xl border-2 border-brand/40 bg-blue-50 px-4 py-3 space-y-3" aria-live="polite">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-brand uppercase tracking-wide">Side by side: A (pinned) vs B (now)</p>
        <Button variant="ghost" size="icon" className="size-11 -mt-2 -mr-2" onClick={onUnpin} aria-label="Stop comparing">
          <X className="size-5" />
        </Button>
      </div>
      {c && table ? (
        <>
          <p className="text-base font-semibold leading-snug">{c.summary}</p>
          <div className="rounded-lg border border-border bg-white px-3 py-1 overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-1.5 pr-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                    Results
                  </th>
                  <th scope="col" className="py-1.5 px-2 text-right text-sm font-semibold">{names.a}</th>
                  <th scope="col" className="py-1.5 px-2 text-right text-sm font-semibold text-brand">{names.b}</th>
                  <th scope="col" className="py-1.5 pl-2 text-right text-xs font-semibold uppercase text-muted-foreground">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                <Rows rows={table.results} showDelta />
              </tbody>
              <tbody>
                <tr className="border-b border-border">
                  <th colSpan={4} scope="colgroup" className="pt-3 pb-1.5 text-left text-xs font-semibold uppercase text-muted-foreground">
                    Inputs
                  </th>
                </tr>
                <Rows rows={table.inputs} showDelta={false} />
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-base text-muted-foreground">
          Now change what you want to compare (say the belt width) — B updates as you go. B needs a result to compare.
        </p>
      )}
      <button type="button" onClick={onRestoreA} className="min-h-[44px] text-base font-semibold text-brand underline">
        Go back to A's inputs
      </button>
    </div>
  )
}
