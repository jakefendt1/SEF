// Save a belt to your account, and open or delete saved ones.
import { Link } from 'wouter'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ROUTES } from '@/lib/navigation'
import { fmtMm } from '@/lib/thermodrive/format'
import { configTitle, type StoredTdConfig } from '@/lib/tdConfigRecord'
import type { UnitSystem } from '@/lib/tdBulkDensity/units'
import type { SheetMeta } from './BuildSheetDialog'

export function SaveConfigDialog({
  open,
  onOpenChange,
  meta,
  onMetaChange,
  canUpdate,
  saving,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  meta: SheetMeta
  onMetaChange: (m: SheetMeta) => void
  canUpdate: boolean
  saving: boolean
  onSave: (asNew: boolean) => void
}) {
  const missing = !meta.customer.trim()
  const field = (key: 'customer' | 'reference', label: string, hint: string) => (
    <div>
      <label htmlFor={`cfg-${key}`} className="block text-sm font-medium text-foreground/80 mb-1">
        {label}
      </label>
      <input
        id={`cfg-${key}`}
        value={meta[key]}
        onChange={(e) => onMetaChange({ ...meta, [key]: e.target.value })}
        className="w-full h-12 px-4 rounded-lg border border-gray-400 text-base bg-white"
        autoComplete="off"
      />
      <p className="text-sm mt-1 text-muted-foreground">{hint}</p>
    </div>
  )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save this belt</DialogTitle>
          <DialogDescription>Saved to your account, so it's on your other devices too.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {field('customer', 'Customer', 'Company and plant.')}
          {field('reference', 'Reference', 'Line, conveyor or quote number.')}
          <div>
            <label htmlFor="cfg-notes" className="block text-sm font-medium text-foreground/80 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="cfg-notes"
              rows={3}
              value={meta.notes}
              onChange={(e) => onMetaChange({ ...meta, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-400 text-base bg-white"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {canUpdate && (
            <Button variant="outline" className="min-h-[48px] text-base" disabled={saving || missing} onClick={() => onSave(true)}>
              Save as new
            </Button>
          )}
          <Button className="min-h-[48px] text-base bg-brand hover:bg-brand-hover" disabled={saving || missing} onClick={() => onSave(false)}>
            {saving ? 'Saving…' : canUpdate ? 'Save changes' : 'Save'}
          </Button>
        </DialogFooter>
        {missing && <p className="text-sm text-muted-foreground">Enter the customer to save.</p>}
      </DialogContent>
    </Dialog>
  )
}

export function SavedConfigsDialog({
  open,
  onOpenChange,
  configs,
  loaded,
  error,
  system,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  configs: StoredTdConfig[]
  loaded: boolean
  error: string | null
  system: UnitSystem
  onDelete: (c: StoredTdConfig) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saved belts</DialogTitle>
          <DialogDescription>Newest first.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-base text-warning-orange">Couldn't load your saved belts: {error}</p>
        ) : !loaded ? (
          <p className="text-base text-muted-foreground">Loading…</p>
        ) : configs.length === 0 ? (
          <p className="text-base text-muted-foreground">Nothing saved yet. Use Save to keep a belt.</p>
        ) : (
          <ul className="divide-y divide-border">
            {configs.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2">
                <Link href={`${ROUTES.tdConfigurator}/${c.id}`} onClick={() => onOpenChange(false)} className="min-h-[48px] flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-base font-semibold truncate">{configTitle(c)}</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {c.belt.series} {c.belt.style}
                    {c.belt.widthMm > 0 ? `, ${fmtMm(c.belt.widthMm, system)} wide` : ''} · {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </Link>
                <Button variant="ghost" size="icon" className="size-11" aria-label={`Delete ${configTitle(c)}`} onClick={() => onDelete(c)}>
                  <Trash2 className="size-5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
