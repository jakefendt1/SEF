// The running BOM: every line, with its quantity, and the controls to change
// or remove it. Reads from resolveBom like Review, the PDF and the email text.
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { BomLine, ResolvedRow } from '@/lib/onetrack/bom'
import { cn } from '@/lib/utils'
import { QtyStepper } from './controls'

export function BomPanel({
  rows,
  lines,
  onQty,
  onRemove,
  onEdit,
  className,
}: {
  rows: readonly ResolvedRow[]
  lines: readonly BomLine[]
  onQty: (lineId: string, qty: number) => void
  onRemove: (lineId: string) => void
  /** Wearstrip: reopen the worksheet. Quote-only: edit the note. */
  onEdit: (lineId: string) => void
  className?: string
}) {
  const [removing, setRemoving] = useState<ResolvedRow | null>(null)
  return (
    <section className={cn('rounded-xl border border-border bg-card', className)} aria-label="Bill of materials">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-lg font-semibold">BOM</h3>
        <p className="text-sm text-muted-foreground">
          {rows.length === 0 ? 'Nothing added yet.' : `${rows.length} line${rows.length === 1 ? '' : 's'}`}
        </p>
      </div>
      {rows.length > 0 && (
        <ol className="divide-y divide-border">
          {rows.map((r) => {
            const line = lines.find((l) => l.id === r.lineId)
            const editable = line?.kind === 'wearstrip' || line?.kind === 'quoteOnly'
            return (
              <li key={r.lineId} className="px-4 py-3 space-y-2">
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground w-5 shrink-0 pt-0.5">{r.n}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono-num font-bold text-base break-all">{r.partNumber}</p>
                    <p className="text-sm leading-snug">{r.description}</p>
                    {r.notes && <p className="text-sm text-muted-foreground leading-snug">{r.notes}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-7">
                  {line?.kind === 'wearstrip' ? (
                    <span className="text-base font-semibold mr-auto">
                      {r.qty === null ? 'Not finished' : `Qty ${r.qty} (${r.uom})`}
                    </span>
                  ) : (
                    <div className="mr-auto flex items-center gap-2">
                      <QtyStepper
                        value={r.qty ?? 1}
                        label={r.partNumber}
                        onChange={(q) => (q < 1 ? setRemoving(r) : onQty(r.lineId, q))}
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground">{r.uom}</span>
                    </div>
                  )}
                  {editable && (
                    <Button variant="outline" size="icon" className="size-12" onClick={() => onEdit(r.lineId)} aria-label={`Edit line ${r.n}`}>
                      <Pencil className="size-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-12 text-muted-foreground"
                    onClick={() => setRemoving(r)}
                    aria-label={`Remove line ${r.n}`}
                  >
                    <Trash2 className="size-5" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <AlertDialog open={!!removing} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove line {removing?.n}?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {removing?.partNumber}: {removing?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[48px]">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[48px] bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (removing) onRemove(removing.lineId)
                setRemoving(null)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
