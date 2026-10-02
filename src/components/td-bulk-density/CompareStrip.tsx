// A/B delta strip (plan §7.5): what changed since "Pin as A", and what it bought.
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { compareRuns } from '@/lib/tdBulkDensity/compare'
import type { TdComputed } from '@/lib/tdBulkDensity/compute'
import type { UnitSystem } from '@/lib/tdBulkDensity/units'

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
  const c = b && b.throughput && a.throughput ? compareRuns(a, b, system) : null
  return (
    <div className="rounded-xl border-2 border-brand/40 bg-blue-50 px-4 py-3 space-y-2" aria-live="polite">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-brand uppercase tracking-wide">Comparing A (pinned) → B (now)</p>
        <Button variant="ghost" size="icon" className="size-11 -mt-2 -mr-2" onClick={onUnpin} aria-label="Stop comparing">
          <X className="size-5" />
        </Button>
      </div>
      {c ? (
        <>
          <p className="text-lg font-semibold leading-snug">{c.summary}</p>
          {c.changes.length > 1 && (
            <ul className="list-disc pl-5 text-base text-muted-foreground">
              {c.changes.map((ch) => (
                <li key={ch}>{ch}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="text-base text-muted-foreground">Change something to compare it with A. B needs a result to compare.</p>
      )}
      <button type="button" onClick={onRestoreA} className="min-h-[44px] text-base font-semibold text-brand underline">
        Go back to A's inputs
      </button>
    </div>
  )
}
