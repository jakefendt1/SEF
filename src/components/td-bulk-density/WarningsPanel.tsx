import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import type { Severity, Warning } from '@/lib/tdBulkDensity/types'
import { cn } from '@/lib/utils'

const STYLE: Record<Severity, { icon: typeof Info; label: string; box: string; text: string }> = {
  error: { icon: CircleAlert, label: 'Must fix', box: 'border-destructive/40 bg-destructive/5', text: 'text-destructive' },
  warning: { icon: TriangleAlert, label: 'Check', box: 'border-warning-orange/40 bg-warning-orange/5', text: 'text-warning-orange' },
  info: { icon: Info, label: 'Good to know', box: 'border-border bg-card', text: 'text-brand' },
}

export function WarningsPanel({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) return null
  return (
    <ul className="space-y-2" aria-label="Warnings and notes">
      {warnings.map((w) => {
        const s = STYLE[w.severity]
        const Icon = s.icon
        return (
          <li key={w.id} className={cn('flex gap-3 rounded-lg border px-3 py-2', s.box)}>
            <Icon className={cn('size-5 shrink-0 mt-0.5', s.text)} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-base">
                <span className={cn('font-semibold', s.text)}>{s.label}: </span>
                {w.message}
              </p>
              {w.fix && <p className="text-sm text-muted-foreground mt-0.5">{w.fix}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
