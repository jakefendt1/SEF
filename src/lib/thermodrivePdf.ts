// ThermoDrive Belt Build Sheet PDF: what CS builds from. Page 1: job, the 3D
// belt and the dimensioned top view and cross-section, then the belt summary,
// sections, repair section and anything still flagged. Layout habits follow
// lib/onetrackPdf.ts (ensureSpace before every block, furniture at the end).
import { jsPDF } from 'jspdf'
import { INTRALOX_LOGO_PNG, INTRALOX_LOGO_SIZE } from '../assets/intralox-logo-pdf'
import { pdfSafe, type PdfImage } from './onetrackPdf'
import type { BuildSheet } from './thermodrive/buildSheet'

type RGB = [number, number, number]
const BRAND: RGB = [200, 16, 46]
const GRAY: RGB = [100, 100, 120]
const INK: RGB = [40, 40, 55]
const ZEBRA: RGB = [247, 247, 250]
const RED: RGB = [185, 28, 28]
const ORANGE: RGB = [196, 98, 10]

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2
const RIGHT = PAGE_W - MARGIN
const CONTENT_BOTTOM = 268
const CONTINUATION_TOP = 22

export interface BuildSheetImages {
  belt3d?: PdfImage
  top?: PdfImage
  side?: PdfImage
  cross?: PdfImage
  splice?: PdfImage
}

export function buildSheetFileName(s: BuildSheet): string {
  const part = (x: string) => x.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  const v = (k: string) => s.meta.find(([key]) => key === k)?.[1] ?? ''
  return ['ThermoDrive-Build-Sheet', part(v('Customer') === '—' ? '' : v('Customer')), part(v('Reference') === '—' ? '' : v('Reference')), v('Date')]
    .filter(Boolean)
    .join('_') + '.pdf'
}

export function buildThermodrivePdf(s: BuildSheet, images: BuildSheetImages): { pdf: jsPDF; fileName: string; logoRendered: boolean } {
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
  const text = (t: string, x: number, yy: number, opts?: { align?: 'left' | 'right' | 'center' }) => pdf.text(pdfSafe(t), x, yy, opts)
  const wrapped = (t: string, width: number) => pdf.splitTextToSize(pdfSafe(t), width) as string[]
  const heading = (t: string, keepWith: number) => {
    ensureSpace(10 + keepWith)
    setText(BRAND)
    bold(12.5)
    text(t, MARGIN, y)
    pdf.setDrawColor(225, 225, 232)
    pdf.setLineWidth(0.2)
    pdf.line(MARGIN, y + 2.5, RIGHT, y + 2.5)
    y += 9
  }
  const keyValues = (list: [string, string][]) => {
    list.forEach(([k, v], idx) => {
      const vLines = wrapped(v, CONTENT_W * 0.66)
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
  /** A titled picture: the heading moves to the next page with it, never alone. */
  const figure = (title: string, img: PdfImage, maxH: number, caption: string) => {
    const scale = Math.min(CONTENT_W / img.w, maxH / img.h)
    const w = img.w * scale
    const h = img.h * scale
    heading(title, h + 10)
    try {
      pdf.addImage(img.data, img.data.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG', MARGIN + (CONTENT_W - w) / 2, y, w, h, undefined, 'FAST')
    } catch {
      setText(GRAY)
      normal(8)
      text('(picture could not be drawn)', MARGIN + 2, y + 6)
    }
    y += h + 4
    setText(GRAY)
    normal(8)
    text(caption, MARGIN, y)
    y += 6
  }

  // ---- header
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
  const date = s.meta.find(([k]) => k === 'Date')?.[1] ?? ''
  setText(GRAY)
  normal(8.5)
  text(date, RIGHT, 14, { align: 'right' })
  y = 12 + logoH + 10
  setText(INK)
  bold(19)
  text(s.title, MARGIN, y)
  y += 7
  setText(GRAY)
  normal(10)
  text(
    s.meta
      .filter(([k, v]) => (k === 'Customer' || k === 'Reference') && v !== '—')
      .map(([, v]) => v)
      .join('  |  '),
    MARGIN,
    y,
  )
  y += 4
  pdf.setDrawColor(BRAND[0], BRAND[1], BRAND[2])
  pdf.setLineWidth(0.8)
  pdf.line(MARGIN, y, RIGHT, y)
  y += 9

  heading('Job', 20)
  keyValues(s.meta)

  if (images.belt3d) {
    figure('The belt', images.belt3d, 80, 'Across the splice: the end of one loop, the splice, the start of the next. A dashed red flight is left off.')
  }
  if (images.top) {
    figure('Top view', images.top, 70, 'From the splice, first flights of each variation. Lengths along and across the belt are scaled separately.')
  }
  if (images.side) {
    figure('Flights from the side', images.side, 60, 'Each flight variation at its real profile and height; the dashed band is the sidewall height.')
  }
  if (images.cross) {
    figure('Cross-section', images.cross, 80, 'Across the width: flights by piece, sidewalls, V-guides.')
  }
  if (images.splice) {
    figure('Across the splice', images.splice, 60, 'Last flight, splice, first flight of the next loop.')
  }

  heading('Belt', 30)
  keyValues(s.belt)
  if (s.sections.length) {
    heading('Sections', 20)
    keyValues(s.sections)
  }
  if (s.repair.length) {
    heading('Repair section', 20)
    keyValues(s.repair)
  }
  if (s.warnings.length) {
    heading('To check', 14)
    for (const w of s.warnings) {
      normal(9.5)
      const lines = wrapped(`${w.severity === 'error' ? 'Must fix: ' : 'Check: '}${w.message} ${w.fix}`.trim(), CONTENT_W - 4)
      ensureSpace(lines.length * 4.6 + 2)
      setText(w.severity === 'error' ? RED : ORANGE)
      normal(9.5)
      pdf.text(lines, MARGIN + 2, y)
      y += lines.length * 4.6 + 2
    }
    y += 2
  }
  if (s.notes) {
    heading('Notes', 10)
    setText(INK)
    normal(9.5)
    for (const line of wrapped(s.notes, CONTENT_W)) {
      ensureSpace(5)
      pdf.text(line, MARGIN, y)
      y += 4.6
    }
  }

  const pageCount = pdf.getNumberOfPages()
  const by = s.meta.find(([k]) => k === 'Prepared by')?.[1]
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page)
    pdf.setDrawColor(230, 230, 236)
    pdf.setLineWidth(0.2)
    pdf.line(MARGIN, PAGE_H - 16, RIGHT, PAGE_H - 16)
    setText(GRAY)
    normal(8)
    text(`ThermoDrive Belt Configurator, Intralox AM Hub${by && by !== '—' ? `  ·  ${by}` : ''}`, MARGIN, PAGE_H - 11)
    text(`Page ${page} of ${pageCount}`, RIGHT, PAGE_H - 11, { align: 'right' })
  }
  pdf.setProperties({ title: pdfSafe(s.title), subject: 'ThermoDrive belt for CS to build', creator: 'Intralox Account Manager Hub' })
  return { pdf, fileName: buildSheetFileName(s), logoRendered }
}
