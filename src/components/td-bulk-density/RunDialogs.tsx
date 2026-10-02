// Save, open and export dialogs for bulk density runs.
import { useState } from 'react'
import { Link } from 'wouter'
import { Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ROUTES } from '@/lib/navigation'
import { formatQty, type UnitSystem } from '@/lib/tdBulkDensity/units'
import { runTitle, validateRunMeta, type StoredTdRun } from '@/lib/tdBulkDensityRecord'
import type { PdfVersion } from '@/lib/tdBulkDensityPdf'
import { ChoiceButtons } from './fields'

export interface RunMeta {
  customer: string
  reference: string
  notes: string
}

function MetaFields({ meta, onChange, showErrors }: { meta: RunMeta; onChange: (m: RunMeta) => void; showErrors: boolean }) {
  const missing = showErrors ? validateRunMeta(meta.customer, meta.reference) : []
  const field = (key: 'customer' | 'reference', label: string, hint: string) => (
    <div>
      <label htmlFor={`run-${key}`} className="block text-sm font-medium text-foreground/80 mb-1">
        {label}
      </label>
      <input
        id={`run-${key}`}
        value={meta[key]}
        onChange={(e) => onChange({ ...meta, [key]: e.target.value })}
        className="w-full h-12 px-4 rounded-lg border border-gray-400 text-base bg-white"
        aria-invalid={missing.includes(label) || undefined}
        autoComplete="off"
      />
      <p className={missing.includes(label) ? 'text-sm mt-1 text-warning-orange' : 'text-sm mt-1 text-muted-foreground'}>
        {missing.includes(label) ? `${label} is needed.` : hint}
      </p>
    </div>
  )
  return (
    <div className="space-y-4">
      {field('customer', 'Customer', 'Company and plant.')}
      {field('reference', 'Reference', 'Line, conveyor or quote number.')}
    </div>
  )
}

export function SaveDialog({
  open,
  onOpenChange,
  meta,
  onMetaChange,
  canUpdate,
  saving,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  meta: RunMeta
  onMetaChange: (m: RunMeta) => void
  /** True when this is a reopened run that can be overwritten. */
  canUpdate: boolean
  saving: boolean
  onSave: (asNew: boolean) => void
}) {
  const [tried, setTried] = useState(false)
  const ok = validateRunMeta(meta.customer, meta.reference).length === 0
  const go = (asNew: boolean) => {
    setTried(true)
    if (ok) onSave(asNew)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save this run</DialogTitle>
          <DialogDescription className="text-base">
            Saved to your account with every input and the results, so you can reopen it on any
            device you're signed in on.
          </DialogDescription>
        </DialogHeader>
        <MetaFields meta={meta} onChange={onMetaChange} showErrors={tried} />
        <div>
          <label htmlFor="run-notes" className="block text-sm font-medium text-foreground/80 mb-1">
            Notes <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="run-notes"
            rows={3}
            value={meta.notes}
            onChange={(e) => onMetaChange({ ...meta, notes: e.target.value })}
            className="w-full rounded-lg border border-gray-400 p-3 text-base bg-white"
          />
        </div>
        <DialogFooter className="gap-2">
          {canUpdate && (
            <Button variant="outline" className="min-h-[48px] text-base" disabled={saving} onClick={() => go(true)}>
              Save as a new run
            </Button>
          )}
          <Button className="min-h-[48px] text-base bg-brand hover:bg-brand-hover" disabled={saving} onClick={() => go(false)}>
            {saving ? 'Saving…' : canUpdate ? 'Save changes' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SavedRunsDialog({
  open,
  onOpenChange,
  runs,
  loaded,
  system,
  onDelete,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  runs: StoredTdRun[]
  loaded: boolean
  system: UnitSystem
  onDelete: (run: StoredTdRun) => void
}) {
  const [deleting, setDeleting] = useState<StoredTdRun | null>(null)
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saved runs</DialogTitle>
            <DialogDescription className="text-base">Open one to pick up where you left off.</DialogDescription>
          </DialogHeader>
          {!loaded ? (
            <p className="text-base text-muted-foreground">Loading your saved runs…</p>
          ) : runs.length === 0 ? (
            <p className="text-base text-muted-foreground">Nothing saved yet. Use Save to keep a run.</p>
          ) : (
            <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {runs.map((r) => (
                <li key={r.id} className="flex items-center gap-2 bg-white">
                  <Link
                    href={`${ROUTES.tdBulkDensity}/${r.id}`}
                    onClick={() => onOpenChange(false)}
                    className="flex-1 min-w-0 px-4 py-3 min-h-[64px] hover:bg-secondary"
                  >
                    <span className="block font-medium truncate">{runTitle(r)}</span>
                    <span className="block text-sm text-muted-foreground">
                      {new Date(r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {r.results?.throughputLbPerHr != null &&
                        ` · ${formatQty(r.results.throughputLbPerHr, 'massRate', system)}`}
                      {r.results && ` · ${formatQty(r.results.massPerFlightLb, 'mass', system)}/flight`}
                    </span>
                  </Link>
                  {/* Separated from the open target and confirmed: one stray tap
                      must never delete a customer's run. */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-12 mr-1 text-muted-foreground"
                    onClick={() => setDeleting(r)}
                    aria-label={`Delete ${runTitle(r)}`}
                  >
                    <Trash2 className="size-5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting ? runTitle(deleting) : ''}"?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[48px]">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[48px] bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleting) onDelete(deleting)
                setDeleting(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function ExportDialog({
  open,
  onOpenChange,
  meta,
  onMetaChange,
  exporting,
  hasCompare,
  has3d,
  onExport,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  meta: RunMeta
  onMetaChange: (m: RunMeta) => void
  exporting: boolean
  hasCompare: boolean
  has3d: boolean
  onExport: (version: PdfVersion) => void
}) {
  const [version, setVersion] = useState<PdfVersion>('customer')
  const [tried, setTried] = useState(false)
  const ok = validateRunMeta(meta.customer, meta.reference).length === 0
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export a PDF</DialogTitle>
          <DialogDescription className="text-base">
            The PDF shows the results as they are on screen now
            {hasCompare ? ', with the A/B comparison' : ''}.
            {!has3d && ' The 3D view is hidden, so it is left out.'}
          </DialogDescription>
        </DialogHeader>
        <ChoiceButtons<PdfVersion>
          title="Which version?"
          value={version}
          columns={2}
          onChange={setVersion}
          options={[
            { value: 'customer', label: 'Customer', detail: 'Results, views, inputs and assumptions. Marked as an estimate.' },
            { value: 'internal', label: 'Internal', detail: 'Adds every warning with its manual page and the engine notes.' },
          ]}
        />
        <MetaFields meta={meta} onChange={onMetaChange} showErrors={tried} />
        <DialogFooter>
          <Button variant="outline" className="min-h-[48px] text-base" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="min-h-[48px] text-base bg-brand hover:bg-brand-hover"
            disabled={exporting}
            onClick={() => {
              setTried(true)
              if (ok) onExport(version)
            }}
          >
            {exporting ? 'Making the PDF…' : 'Export PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
