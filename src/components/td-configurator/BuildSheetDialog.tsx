// Build sheet for CS: a PDF, or the same specs on the clipboard for an email.
import { useState } from 'react'
import { Copy, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { BuildSheetMeta } from '@/lib/thermodrive/buildSheet'

export type SheetMeta = Pick<BuildSheetMeta, 'customer' | 'reference' | 'notes'>

export function BuildSheetDialog({
  open,
  onOpenChange,
  meta,
  onMetaChange,
  errors,
  onPdf,
  onCopy,
  busy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  meta: SheetMeta
  onMetaChange: (m: SheetMeta) => void
  errors: number
  onPdf: () => void
  onCopy: () => Promise<boolean>
  busy: boolean
}) {
  const [copyFailed, setCopyFailed] = useState(false)
  const field = (key: 'customer' | 'reference', label: string, hint: string) => (
    <div>
      <label htmlFor={`bs-${key}`} className="block text-sm font-medium text-foreground/80 mb-1">
        {label}
      </label>
      <input
        id={`bs-${key}`}
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
          <DialogTitle>Build sheet</DialogTitle>
          <DialogDescription>
            The belt, its views, sections and repair section for Customer Service.
            {errors > 0 && ` It still lists ${errors} thing${errors === 1 ? '' : 's'} to fix.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {field('customer', 'Customer', 'Company and plant.')}
          {field('reference', 'Reference', 'Line, conveyor or quote number.')}
          <div>
            <label htmlFor="bs-notes" className="block text-sm font-medium text-foreground/80 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="bs-notes"
              rows={3}
              value={meta.notes}
              onChange={(e) => onMetaChange({ ...meta, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-400 text-base bg-white"
            />
          </div>
          {copyFailed && <p className="text-base text-warning-orange">The browser didn't allow copying. Download the PDF instead.</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="min-h-[48px] text-base"
            disabled={busy}
            onClick={async () => {
              const ok = await onCopy()
              setCopyFailed(!ok)
              if (ok) toast.success('Copied. Paste it into your email.')
            }}
          >
            <Copy className="size-5" /> Copy for email
          </Button>
          <Button className="min-h-[48px] text-base bg-brand hover:bg-brand-hover" disabled={busy} onClick={onPdf}>
            <FileDown className="size-5" /> {busy ? 'Making the PDF…' : 'Download PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
