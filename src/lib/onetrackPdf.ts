// PDF for a OneTrack BOM: what CS quotes from.
//
// Page 1: job, the BOM table (bold part numbers), one block per wearstrip line
// with its measurements, warnings, notes. Photos follow, two to a page.
//
// Layout habits follow lib/pdf-export.ts and lib/tdBulkDensityPdf.ts:
// ensureSpace before every block and row, page furniture drawn in one pass
// over every page at the end.
import { jsPDF } from 'jspdf'
import { INTRALOX_LOGO_PNG, INTRALOX_LOGO_SIZE } from '../assets/intralox-logo-pdf'
import type { OnetrackJob, ResolvedRow } from './onetrack/bom'
import { getFamily, getProfile, DIM_LABELS } from './onetrack/profiles'
import { formatDim, formatRun, formatTotal, railLengths, type WearstripWorksheet } from './onetrack/wearstrip'
import type { Unit } from './measurement'

type RGB = [number, number, number]
const BRAND: RGB = [200, 16, 46]
const GRAY: RGB = [100, 100, 120]
const INK: RGB = [40, 40, 55]
const ZEBRA: RGB = [247, 247, 250]
const ORANGE: RGB = [196, 98, 10]

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2
const RIGHT = PAGE_W - MARGIN
const CONTENT_BOTTOM = 268
const CONTINUATION_TOP = 22

export interface PdfImage {
  /** PNG or JPEG data URL. */
  data: string
  w: number
  h: number
}

export interface OnetrackPdfArgs {
  job: OnetrackJob
  unit: Unit
  rows: readonly ResolvedRow[]
  wearstrips: readonly { n: number; worksheet: WearstripWorksheet; profileImage?: PdfImage }[]
  warnings: readonly string[]
  notes: string
  caution: string | null
  photos: readonly (PdfImage & { caption: string; label: string })[]
  date?: Date
}

/** WinAnsi punctuation the standard fonts can draw: en/em dash, curly quotes, bullet, ellipsis. */
const WINANSI_EXTRA = [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2026]
  .map((c) => String.fromCharCode(c))
  .join('')
const UNDRAWABLE = new RegExp(`[^\\x20-\\x7E\\xA0-\\xFF${WINANSI_EXTRA}]`, 'g')

/** Standard PDF fonts are WinAnsi: swap what they can't draw. */
export function pdfSafe(s: string): string {
  return s
    .replace(/→/g, 'to')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(UNDRAWABLE, '')
}

export function onetrackPdfFileName(job: OnetrackJob): string {
  const part = (s: string) => s.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  return ['OneTrack-BOM', part(job.customer), part(job.line), job.date].filter(Boolean).join('_') + '.pdf'
}

export function buildOnetrackPdf(args: OnetrackPdfArgs): { pdf: jsPDF; fileName: string; logoRendered: boolean } {
  const { job, unit } = args
  const pdf = new jsPDF('p', 'mm', 'a4')
  let y = 0
  const setFill = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2])
  const setText = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2])
  const bold = (size: number) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(size)
  }
  const normal = (size: number) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(size)
  }
  const ensureSpace = (needed: number) => {
    if (y + needed > CONTENT_BOTTOM) {
      pdf.addPage()
      y = CONTINUATION_TOP
    }
  }
  const text = (s: string, x: number, yy: number, opts?: { align?: 'left' | 'right' | 'center' }) =>
    pdf.text(pdfSafe(s), x, yy, opts)
  const wrapped = (s: string, width: number) => pdf.splitTextToSize(pdfSafe(s), width) as string[]

  const heading = (s: string, keepWith: number) => {
    ensureSpace(10 + keepWith)
    setText(BRAND)
    bold(12.5)
    text(s, MARGIN, y)
    pdf.setDrawColor(225, 225, 232)
    pdf.setLineWidth(0.2)
    pdf.line(MARGIN, y + 2.5, RIGHT, y + 2.5)
    y += 9
  }

  const keyValues = (list: [string, string][]) => {
    list.forEach(([k, v], idx) => {
      const vLines = wrapped(v, CONTENT_W * 0.62)
      const h = Math.max(6.5, vLines.length * 4.4 + 2.2)
      ensureSpace(h)
      if (idx % 2 === 0) {
        setFill(ZEBRA)
        pdf.rect(MARGIN, y - 4.4, CONTENT_W, h, 'F')
      }
      setText(GRAY)
      normal(9)
      text(k, MARGIN + 2, y)
      setText(INK)
      bold(9)
      pdf.text(vLines, RIGHT - 2, y, { align: 'right' })
      y += h
    })
    y += 3
  }

  const paragraph = (s: string, size = 9.5, color: RGB = INK) => {
    normal(size)
    setText(color)
    for (const line of wrapped(s, CONTENT_W)) {
      ensureSpace(5)
      pdf.text(line, MARGIN, y)
      y += size * 0.47
    }
    y += 2
  }

  const image = (img: PdfImage, x: number, top: number, maxW: number, maxH: number) => {
    const scale = Math.min(maxW / img.w, maxH / img.h)
    const w = img.w * scale
    const h = img.h * scale
    try {
      const format = img.data.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
      pdf.addImage(img.data, format, x + (maxW - w) / 2, top, w, h, undefined, 'FAST')
    } catch {
      setText(GRAY)
      normal(8)
      text('(picture could not be drawn)', x + 2, top + 6)
    }
    return h
  }

  // ------------------------------------------------------------------ header
  let logoRendered = true
  const logoW = 30
  const logoH = (logoW * INTRALOX_LOGO_SIZE.height) / INTRALOX_LOGO_SIZE.width
  try {
    pdf.addImage(INTRALOX_LOGO_PNG, 'PNG', MARGIN, 12, logoW, logoH)
  } catch {
    logoRendered = false
    setText(BRAND)
    bold(14)
    pdf.text('INTRALOX', MARGIN, 12 + logoH - 2)
  }
  const date = args.date ?? new Date()
  setText(GRAY)
  normal(8.5)
  text(date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), RIGHT, 14, { align: 'right' })
  y = 12 + logoH + 10
  setText(INK)
  bold(19)
  text('OneTrack BOM: Quote Request', MARGIN, y)
  y += 7
  setText(GRAY)
  normal(10)
  text([job.customer, job.line].filter(Boolean).join('  |  '), MARGIN, y)
  y += 4
  pdf.setDrawColor(BRAND[0], BRAND[1], BRAND[2])
  pdf.setLineWidth(0.8)
  pdf.line(MARGIN, y, RIGHT, y)
  y += 9

  // --------------------------------------------------------------------- job
  heading('Job', 20)
  const belt = [job.beltSeries.trim(), job.beltWidthIn !== null ? `${formatDim(job.beltWidthIn, unit)} ${unit} wide` : '']
    .filter(Boolean)
    .join(', ')
  keyValues(
    (
      [
        ['Customer', job.customer.trim()],
        ['Plant / city', job.plant.trim()],
        ['Line / conveyor', job.line.trim()],
        ['Belt', belt],
        ['Prepared by', [job.preparedBy.trim(), job.date].filter(Boolean).join(', ')],
      ] as [string, string][]
    ).filter(([, v]) => v),
  )

  // --------------------------------------------------------------------- BOM
  heading('Bill of materials', 16)
  const cols = [
    { label: 'Line', w: 11, align: 'left' as const },
    { label: 'Part number', w: 37, align: 'left' as const },
    { label: 'Description', w: CONTENT_W - 11 - 37 - 14 - 28, align: 'left' as const },
    { label: 'Qty', w: 14, align: 'right' as const },
    { label: 'UOM', w: 28, align: 'left' as const },
  ]
  const colX = cols.map((_, i) => MARGIN + cols.slice(0, i).reduce((a, c) => a + c.w, 0))
  const tableHead = () => {
    setFill([236, 236, 242])
    pdf.rect(MARGIN, y - 4.6, CONTENT_W, 7, 'F')
    setText(INK)
    bold(8.5)
    cols.forEach((c, i) => text(c.label, c.align === 'right' ? colX[i] + c.w - 2 : colX[i] + 2, y, { align: c.align }))
    y += 6
  }
  ensureSpace(14)
  tableHead()
  for (const r of args.rows) {
    normal(9)
    const desc = wrapped(r.description, cols[2].w - 4)
    const notes = r.notes ? wrapped(r.notes, cols[2].w + cols[3].w + cols[4].w - 4) : []
    const pn = wrapped(r.partNumber, cols[1].w - 3)
    const h = Math.max(desc.length, pn.length) * 4.2 + (notes.length ? notes.length * 3.8 + 1 : 0) + 3
    if (y + h > CONTENT_BOTTOM) {
      pdf.addPage()
      y = CONTINUATION_TOP
      tableHead()
    }
    if (r.n % 2 === 1) {
      setFill(ZEBRA)
      pdf.rect(MARGIN, y - 4.4, CONTENT_W, h, 'F')
    }
    setText(INK)
    normal(9)
    text(String(r.n), colX[0] + 2, y)
    bold(9)
    pdf.text(pn, colX[1] + 2, y)
    normal(9)
    pdf.text(desc, colX[2] + 2, y)
    bold(9)
    text(r.qty === null ? '—' : String(r.qty), colX[3] + cols[3].w - 2, y, { align: 'right' })
    normal(9)
    text(r.uom, colX[4] + 2, y)
    if (notes.length) {
      setText(GRAY)
      normal(8)
      pdf.text(notes, colX[2] + 2, y + desc.length * 4.2)
    }
    y += h
  }
  y += 4

  // -------------------------------------------------------------- wearstrip
  for (const w of args.wearstrips) {
    const ws = w.worksheet
    const profile = getProfile(ws.profileId)
    const quoted =
      ws.quoteAs === 'match'
        ? 'Match the installed profile (CS to source)'
        : ws.quoteAs
          ? `${getFamily(ws.quoteAs).label}${ws.color ? `, ${ws.color.toLowerCase()}` : ''}${ws.frameIn ? `, ${ws.frameIn} in frame` : ''}`
          : '—'
    const lengths = railLengths(ws)
    const kv: [string, string][] = [
      ['Installed profile', profile ? (profile.id === 'other' ? `Other: ${ws.otherDescription.trim()}` : profile.label) : '—'],
      ['Quoted as', quoted],
    ]
    for (const k of profile?.dims ?? []) {
      const v = ws.dims[k]
      if (typeof v === 'number') kv.push([`${DIM_LABELS[k]} (${k})`, `${formatDim(v, unit)} ${unit}`])
    }
    if (lengths) {
      kv.push(['Rails', String(lengths.length)])
      kv.push([
        'Length per rail',
        ws.sameLength ? formatRun(lengths[0], unit) : lengths.map((l, i) => `${i + 1}: ${formatRun(l, unit)}`).join(';  '),
      ])
      kv.push(['Total', formatTotal(lengths.reduce((a, b) => a + b, 0), unit)])
      kv.push(['Rounding', 'Rounded up per rail'])
    }
    // Keep the block on one page: the picture and its rows belong together.
    heading(`Line ${w.n}: wearstrip${ws.use ? `, ${ws.use.toLowerCase()}` : ''}`, (w.profileImage ? 36 : 0) + kv.length * 6.6)
    if (w.profileImage) {
      image(w.profileImage, MARGIN, y - 3, 40, 32)
      y += 33
    }
    keyValues(kv)
  }

  // --------------------------------------------------------------- warnings
  if (args.warnings.length) {
    heading('Check before quoting', 10)
    for (const wText of args.warnings) paragraph(`•  ${wText}`, 9.5, ORANGE)
  }
  if (args.notes.trim()) {
    heading('Notes', 8)
    paragraph(args.notes.trim())
  }
  if (args.caution) {
    y += 2
    paragraph(args.caution, 8.5, GRAY)
  }

  // ----------------------------------------------------------------- photos
  if (args.photos.length) {
    pdf.addPage()
    y = CONTINUATION_TOP
    heading('Photos', 100)
    const slotH = (CONTENT_BOTTOM - CONTINUATION_TOP - 30) / 2
    args.photos.forEach((p, i) => {
      if (i > 0 && i % 2 === 0) {
        pdf.addPage()
        y = CONTINUATION_TOP
      }
      const h = image(p, MARGIN, y, CONTENT_W, slotH - 12)
      y += h + 5
      setText(INK)
      bold(9.5)
      text(p.label, MARGIN, y)
      if (p.caption.trim()) {
        y += 4.5
        setText(GRAY)
        normal(9)
        for (const line of wrapped(p.caption.trim(), CONTENT_W)) {
          pdf.text(line, MARGIN, y)
          y += 4.2
        }
      }
      y += 8
    })
  }

  // --------------------------------------------------------- page furniture
  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page)
    pdf.setDrawColor(230, 230, 236)
    pdf.setLineWidth(0.2)
    pdf.line(MARGIN, PAGE_H - 16, RIGHT, PAGE_H - 16)
    setText(GRAY)
    normal(8)
    text(
      `Prepared in the Intralox AM Hub${job.preparedBy.trim() ? `  ·  ${job.preparedBy.trim()}` : ''}`,
      MARGIN,
      PAGE_H - 11,
    )
    text(`Page ${page} of ${pageCount}`, RIGHT, PAGE_H - 11, { align: 'right' })
  }

  pdf.setProperties({
    title: pdfSafe(`OneTrack BOM - ${[job.customer, job.line].filter(Boolean).join(' ')}`),
    subject: 'OneTrack parts for CS to quote',
    creator: 'Intralox Account Manager Hub',
  })
  return { pdf, fileName: onetrackPdfFileName(job), logoRendered }
}
