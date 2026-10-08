// Side-by-side compare (plan §7.5): two runs, A and B. The inputs edit one
// side at a time (tap A or B to switch); the other keeps its numbers. Remove
// either side to go back to one run. Every input and headline result in two columns, with what changed
// and whether it helped -- e.g. a 24 in vs a 30 in belt for the same product.
import { Pencil, X } from 'lucide-react'
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
  editing,
  system,
  onEdit,
  onRemove,
}: {
  a: TdComputed | null
  b: TdComputed | null
  editing: 'A' | 'B'
  system: UnitSystem
  onEdit: (side: 'A' | 'B') => void
  onRemove: (side: 'A' | 'B') => void
}) {
  const ready = !!(a?.throughput && b?.throughput)
  const c = ready ? compareRuns(a!, b!, system) : null
  const table = ready ? compareTable(a!, b!, system) : null
  const names = ready ? compareNames(a!, b, system) : { a: 'A', b: 'B' }
  return (
    <div className="rounded-xl border-2 border-brand/40 bg-blue-50 px-4 py-3 space-y-3" aria-live="polite">
      <p className="text-sm font-semibold text-brand uppercase tracking-wide">Side by side</p>
      <div className="grid grid-cols-2 gap-2">
        {(['A', 'B'] as const).map((side) => {
          const on = editing === side
          return (
            <div key={side} className={cn('rounded-lg border-2 bg-white p-2 space-y-1', on ? 'border-brand' : 'border-border')}>
              <p className="text-base font-semibold truncate">{side === 'A' ? names.a : names.b}</p>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={on ? 'default' : 'outline'}
                  className={cn('min-h-[44px] flex-1', on && 'bg-brand hover:bg-brand-hover')}
                  aria-pressed={on}
                  onClick={() => onEdit(side)}
                >
                  <Pencil className="size-4" /> {on ? 'Editing' : `Edit ${side}`}
                </Button>
                <Button variant="ghost" className="min-h-[44px] px-2" onClick={() => onRemove(side)} aria-label={`Remove ${side}`}>
                  <X className="size-4" /> Remove
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-sm text-muted-foreground">The inputs change {editing}. Tap the other side to change it instead.</p>
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
          Change what you want to compare (say the belt width); the side you're editing updates as you go. Both sides need a result to compare.
        </p>
      )}
    </div>
  )
}
