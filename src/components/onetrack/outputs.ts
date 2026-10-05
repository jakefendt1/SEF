// Browser side of the outputs: the PDF (built on demand so jsPDF only
// downloads when someone exports), the share sheet, and the clipboard.
import type { Unit } from '@/lib/measurement'
import {
  WEARSTRIP_CAUTION,
  hasWearstrip,
  resolveBom,
  warningsFor,
  type BomLine,
  type OnetrackJob,
} from '@/lib/onetrack/bom'
import { formatHtml, formatPlainText } from '@/lib/onetrack/format'
import { photoTagLabel, type BomPhoto } from '@/lib/onetrack/photos'
import { getProfile } from '@/lib/onetrack/profiles'
import type { PdfImage } from '@/lib/onetrackPdf'

export interface BomState {
  job: OnetrackJob
  unit: Unit
  lines: readonly BomLine[]
  notes: string
  photos: readonly BomPhoto[]
}

export function endProfileTaken(photos: readonly BomPhoto[]): boolean {
  return photos.some((p) => p.tag === 'end-profile')
}

async function imageFromUrl(url: string): Promise<PdfImage | undefined> {
  try {
    const blob = await (await fetch(url)).blob()
    const data = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = () => reject(r.error)
      r.readAsDataURL(blob)
    })
    const img = new Image()
    img.src = data
    await img.decode()
    if (!blob.type.includes('svg')) return { data, w: img.naturalWidth, h: img.naturalHeight }
    // jsPDF can't embed SVG: draw the profile render onto a white PNG first.
    const w = 900
    const h = Math.round((w * (img.naturalHeight || 3)) / (img.naturalWidth || 4))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    return { data: canvas.toDataURL('image/png'), w, h }
  } catch {
    return undefined
  }
}

export async function makePdf(s: BomState): Promise<{ blob: Blob; fileName: string; logoRendered: boolean }> {
  const { buildOnetrackPdf } = await import('@/lib/onetrackPdf')
  const rows = resolveBom(s.lines, s.unit)
  const byId = new Map(s.lines.map((l) => [l.id, l]))
  const wearstrips = await Promise.all(
    rows
      .filter((r) => r.kind === 'wearstrip')
      .map(async (r) => {
        const line = byId.get(r.lineId)
        if (line?.kind !== 'wearstrip') return null
        const image = getProfile(line.worksheet.profileId)?.image
        return { n: r.n, worksheet: line.worksheet, profileImage: image ? await imageFromUrl(image) : undefined }
      }),
  )
  const { pdf, fileName, logoRendered } = buildOnetrackPdf({
    job: s.job,
    unit: s.unit,
    rows,
    wearstrips: wearstrips.filter((w) => w !== null),
    warnings: warningsFor(s.job, s.lines, s.unit, { endProfileTaken: endProfileTaken(s.photos) }).map((w) => w.text),
    notes: s.notes,
    caution: hasWearstrip(s.lines) ? WEARSTRIP_CAUTION : null,
    photos: s.photos.map((p) => ({ data: p.dataUrl, w: p.w, h: p.h, caption: p.caption, label: photoTagLabel(p.tag) })),
  })
  return { blob: pdf.output('blob'), fileName, logoRendered }
}

/** One Square Shaft Specification Sheet per shaft line, numbered like the BOM. */
export async function makeShaftPdfs(s: BomState): Promise<{ blob: Blob; fileName: string; n: number }[]> {
  const rows = resolveBom(s.lines, s.unit).filter((r) => r.kind === 'shaft')
  if (rows.length === 0) return []
  const { buildShaftPdf, shaftPdfFileName } = await import('@/lib/shaftSpecPdf')
  const { getItem } = await import('@/lib/onetrack/catalog')
  return rows.flatMap((r) => {
    const line = s.lines.find((l) => l.id === r.lineId)
    if (line?.kind !== 'shaft') return []
    const { pdf } = buildShaftPdf({
      job: s.job,
      unit: s.unit,
      spec: line.spec,
      lineLabel: `Line ${r.n}`,
      itemDescription: getItem(line.itemId)?.description ?? 'Square shaft',
    })
    return [{ blob: pdf.output('blob'), fileName: shaftPdfFileName(s.job, r.n), n: r.n }]
  })
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** True where the browser can hand a PDF to the share sheet (iPad Safari, phones). */
export function canSharePdf(): boolean {
  try {
    const probe = new File([new Blob(['%PDF'])], 'probe.pdf', { type: 'application/pdf' })
    return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [probe] })
  } catch {
    return false
  }
}

export function emailText(s: BomState) {
  const args = {
    job: s.job,
    rows: resolveBom(s.lines, s.unit),
    notes: s.notes,
    unit: s.unit,
    caution: hasWearstrip(s.lines),
  }
  return { plain: formatPlainText(args), html: formatHtml(args) }
}

/**
 * Put the BOM on the clipboard as HTML and plain text in one write. Returns
 * false if the browser refused; the caller then shows the text to copy by
 * hand, and never says "Copied".
 */
export async function copyForEmail(s: BomState): Promise<boolean> {
  const { plain, html } = emailText(s)
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ])
      return true
    }
    await navigator.clipboard.writeText(plain)
    return true
  } catch {
    try {
      await navigator.clipboard.writeText(plain)
      return true
    } catch {
      return false
    }
  }
}
