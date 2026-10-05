// Step 4: the BOM as CS will see it, what to check, and the outputs.
import { useState } from 'react'
import { ArrowRight, ClipboardCopy, FileDown, Info, Share2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PDF_EXPORT_MESSAGES } from '@/lib/statusLabels'
import {
  WEARSTRIP_CAUTION,
  hasShaft,
  hasWearstrip,
  missingFor,
  resolveBom,
  warningsFor,
  type MissingItem,
} from '@/lib/onetrack/bom'
import {
  canSharePdf,
  copyForEmail,
  emailText,
  endProfileTaken,
  makePdf,
  makeShaftPdfs,
  saveBlob,
  type BomState,
} from './outputs'

export function ReviewStep({ state, onGoTo }: { state: BomState; onGoTo: (target: MissingItem['target']) => void }) {
  const rows = resolveBom(state.lines, state.unit)
  const missing = missingFor(state.job, state.lines)
  const warnings = warningsFor(state.job, state.lines, state.unit, { endProfileTaken: endProfileTaken(state.photos) })
  const [busy, setBusy] = useState<'pdf' | 'share' | null>(null)
  const [manualCopy, setManualCopy] = useState<string | null>(null)
  // A PDF built for sharing, kept so a second tap can share it straight away:
  // iOS only opens the share sheet from a tap, and building the PDF can take
  // long enough that the first tap no longer counts.
  const [shareReady, setShareReady] = useState<{ files: File[]; key: string } | null>(null)
  const shafts = rows.filter((r) => r.kind === 'shaft')
  const stateKey = JSON.stringify([state.job, state.unit, state.lines, state.notes, state.photos.map((p) => [p.id, p.caption])])
  const shareable = canSharePdf()

  const download = async () => {
    setBusy('pdf')
    try {
      const { blob, fileName, logoRendered } = await makePdf(state)
      saveBlob(blob, fileName)
      // The shaft spec sheets are their own PDFs: CS sends them to the shop.
      const sheets = await makeShaftPdfs(state)
      for (const sheet of sheets) saveBlob(sheet.blob, sheet.fileName)
      if (logoRendered && sheets.length)
        toast.success(`PDF and ${sheets.length} shaft spec sheet${sheets.length === 1 ? '' : 's'} saved to your downloads`)
      else if (logoRendered) toast.success(PDF_EXPORT_MESSAGES.ok)
      else toast.warning(PDF_EXPORT_MESSAGES.missingLogo)
    } catch (err) {
      console.error('[onetrack pdf]', err)
      toast.error(PDF_EXPORT_MESSAGES.failed)
    } finally {
      setBusy(null)
    }
  }

  const share = async () => {
    const title = `OneTrack BOM: ${[state.job.customer, state.job.line].filter(Boolean).join(' ')}`
    let files = shareReady?.key === stateKey ? shareReady.files : null
    if (!files) {
      setBusy('share')
      try {
        const { blob, fileName } = await makePdf(state)
        const sheets = await makeShaftPdfs(state)
        files = [blob, ...sheets.map((x) => x.blob)].map(
          (b, i) => new File([b], i === 0 ? fileName : sheets[i - 1].fileName, { type: 'application/pdf' }),
        )
        setShareReady({ files, key: stateKey })
      } catch (err) {
        console.error('[onetrack share]', err)
        toast.error(PDF_EXPORT_MESSAGES.failed)
        setBusy(null)
        return
      }
      setBusy(null)
    }
    try {
      await navigator.share({ files, title, text: emailText(state).plain })
    } catch (err) {
      const name = (err as { name?: string } | null)?.name
      if (name === 'AbortError') return // The rep closed the share sheet.
      if (name === 'NotAllowedError') {
        toast('The PDF is ready. Tap Share PDF again to send it.')
        return
      }
      toast.error("Couldn't open the share sheet. Use Download PDF instead.")
    }
  }

  const downloadSheet = async (n: number) => {
    try {
      const sheet = (await makeShaftPdfs(state)).find((x) => x.n === n)
      if (!sheet) throw new Error('no sheet')
      saveBlob(sheet.blob, sheet.fileName)
      toast.success('Shaft spec sheet saved to your downloads')
    } catch (err) {
      console.error('[onetrack shaft pdf]', err)
      toast.error(PDF_EXPORT_MESSAGES.failed)
    }
  }

  const copy = async () => {
    const ok = await copyForEmail(state)
    if (ok) toast.success('Copied. Paste it into your email.')
    else setManualCopy(emailText(state).plain)
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold">4. Review</h3>
        <p className="text-base text-muted-foreground">This is what CS gets. Check it, then send it.</p>
      </div>

      {missing.length > 0 && (
        <section className="rounded-xl border border-warning-orange/50 bg-warning-orange/5 p-4 space-y-2">
          <h4 className="text-lg font-semibold">Before this can go to CS</h4>
          <ul className="space-y-1">
            {missing.map((m) => (
              <li key={m.label} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-base">{m.label}</span>
                <button type="button" className="min-h-[44px] px-2 font-semibold text-brand underline inline-flex items-center gap-1" onClick={() => onGoTo(m.target)}>
                  Take me there <ArrowRight className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-base">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">#</th>
                <th className="px-3 py-2 font-semibold">Part number</th>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 font-semibold text-right">Qty</th>
                <th className="px-3 py-2 font-semibold">UOM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.lineId} className="align-top">
                  <td className="px-3 py-2 text-muted-foreground">{r.n}</td>
                  <td className="px-3 py-2 font-mono-num font-bold whitespace-nowrap">{r.partNumber}</td>
                  <td className="px-3 py-2 min-w-[14rem]">
                    {r.description}
                    {r.notes && <span className="block text-sm text-muted-foreground">{r.notes}</span>}
                    {r.reason && <span className="block text-sm text-muted-foreground">{r.reason}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{r.qty ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {warnings.length > 0 && (
        <section className="space-y-1">
          <h4 className="text-lg font-semibold">Check before sending</h4>
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w.text} className="flex gap-2 text-base text-warning-orange">
                <TriangleAlert className="size-5 shrink-0 mt-0.5" aria-hidden="true" /> {w.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasWearstrip(state.lines) && (
        <p className="flex gap-2 text-sm text-muted-foreground rounded-lg bg-secondary px-3 py-2">
          <Info className="size-4 shrink-0 mt-0.5" aria-hidden="true" /> {WEARSTRIP_CAUTION}
        </p>
      )}

      {missing.length === 0 && (
        <section className="space-y-2">
          <h4 className="text-lg font-semibold">Send it to CS</h4>
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-[48px] text-base bg-brand hover:bg-brand-hover" disabled={busy !== null} onClick={download}>
              <FileDown className="size-5" /> {busy === 'pdf' ? 'Making the PDF…' : 'Download PDF'}
            </Button>
            <Button variant="outline" className="min-h-[48px] text-base" onClick={copy}>
              <ClipboardCopy className="size-5" /> Copy for email
            </Button>
            {shareable && (
              <Button variant="outline" className="min-h-[48px] text-base" disabled={busy !== null} onClick={share}>
                <Share2 className="size-5" /> {busy === 'share' ? 'Making the PDF…' : 'Share PDF'}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Copy for email puts the BOM table on your clipboard. Attach the PDF so CS has the measurements and photos too.
          </p>
          {hasShaft(state.lines) && (
            <div className="rounded-xl border border-border bg-white p-3 space-y-2">
              <p className="text-base font-semibold">Shaft spec sheets</p>
              <p className="text-sm text-muted-foreground">
                Each shaft gets its own Square Shaft Specification Sheet. Download PDF and Share PDF include them; attach them
                with the BOM.
              </p>
              <div className="flex flex-wrap gap-2">
                {shafts.map((r) => (
                  <Button key={r.lineId} variant="outline" className="min-h-[48px] text-base" onClick={() => downloadSheet(r.n)}>
                    <FileDown className="size-5" /> Shaft sheet, line {r.n}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <Dialog open={manualCopy !== null} onOpenChange={(v) => !v && setManualCopy(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy it by hand</DialogTitle>
            <DialogDescription className="text-base">
              Your browser didn't let the app copy. Nothing was copied. Select the text below and copy it.
            </DialogDescription>
          </DialogHeader>
          <textarea
            readOnly
            value={manualCopy ?? ''}
            rows={12}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-lg border border-gray-400 p-3 text-sm font-mono-num bg-white"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
