// PDF of a Square Shaft Specification Sheet, laid out like Intralox's paper
// form (Onetrack/Shaft Spec Form.pdf): materials and sizes as tick boxes,
// sprockets, ring grooves and chamfer, the fixed tolerances, then the drive
// and idle shafts drawn with their dimensions written on.
import { jsPDF } from 'jspdf'
import { INTRALOX_LOGO_PNG, INTRALOX_LOGO_SIZE } from '../assets/intralox-logo-pdf'
import type { OnetrackJob } from './onetrack/bom'
import {
  SHAFT_FINISHES,
  SHAFT_MATERIALS,
  SHAFT_SIZES,
  SHAFT_TOLERANCES,
  SHAFT_TOLERANCE_NOTE,
  formatShaftDim,
  squareLengthIn,
  type ShaftDrawing,
  type ShaftSpec,
  type Sprockets,
} from './onetrack/shaft'
import { pdfSafe } from './onetrackPdf'
import type { Unit } from './measurement'

type RGB = [number, number, number]
const BRAND: RGB = [200, 16, 46]
const GRAY: RGB = [100, 100, 120]
const INK: RGB = [30, 30, 40]
const DIM: RGB = [196, 98, 10]

// Letter, landscape, like the form.
const PAGE_W = 279.4
const PAGE_H = 215.9
const M = 12
const RIGHT = PAGE_W - M
const BOTTOM = PAGE_H - 16

export interface ShaftPdfArgs {
  job: OnetrackJob
  unit: Unit
  spec: ShaftSpec
  /** "Line 3", so the sheet and the BOM can be matched up. */
  lineLabel: string
  itemDescription: string
  date?: Date
}

export function shaftPdfFileName(job: OnetrackJob, lineN: number): string {
  const part = (s: string) => s.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  return ['Shaft-Spec', part(job.customer), part(job.line), `Line${lineN}`, job.date].filter(Boolean).join('_') + '.pdf'
}

export function buildShaftPdf(args: ShaftPdfArgs): { pdf: jsPDF; logoRendered: boolean } {
  const { job, unit, spec } = args
  const pdf = new jsPDF('l', 'mm', 'letter')
  const setText = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2])
  const setDraw = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2])
  const font = (size: number, weight: 'bold' | 'normal' = 'normal') => {
    pdf.setFont('helvetica', weight)
    pdf.setFontSize(size)
  }
  const text = (s: string, x: number, y: number, opts?: { align?: 'left' | 'right' | 'center' }) => pdf.text(pdfSafe(s), x, y, opts)
  const v = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? `${formatShaftDim(n, unit)} ${unit}` : '—')

  const box = (x: number, y: number, label: string, checked: boolean) => {
    setDraw(INK)
    pdf.setLineWidth(0.3)
    pdf.rect(x, y - 2.6, 3, 3)
    if (checked) {
      pdf.setLineWidth(0.5)
      pdf.line(x + 0.5, y - 2.1, x + 2.5, y - 0.1)
      pdf.line(x + 2.5, y - 2.1, x + 0.5, y - 0.1)
    }
    setText(INK)
    font(8, checked ? 'bold' : 'normal')
    text(label, x + 4.5, y)
  }
  const heading = (s: string, x: number, y: number) => {
    setText(INK)
    font(8.5, 'bold')
    text(s.toUpperCase(), x, y)
  }
  const field = (label: string, value: string, x: number, y: number, w: number) => {
    setText(GRAY)
    font(8)
    text(label, x, y)
    setText(INK)
    font(8.5, 'bold')
    const lines = pdf.splitTextToSize(pdfSafe(value || '—'), w - 28) as string[]
    pdf.text(lines[0] ?? '', x + 28, y)
  }

  // ------------------------------------------------------------------ header
  let logoRendered = true
  const logoW = 28
  const logoH = (logoW * INTRALOX_LOGO_SIZE.height) / INTRALOX_LOGO_SIZE.width
  try {
    pdf.addImage(INTRALOX_LOGO_PNG, 'PNG', M, 9, logoW, logoH)
  } catch {
    logoRendered = false
    setText(BRAND)
    font(14, 'bold')
    pdf.text('INTRALOX', M, 9 + logoH - 2)
  }
  setText(INK)
  font(17, 'bold')
  text('Square Shaft Specification Sheet', M + logoW + 8, 17)
  setText(GRAY)
  font(9)
  text(`${args.itemDescription}  |  ${args.lineLabel} of the OneTrack BOM`, M + logoW + 8, 22.5)
  const date = args.date ?? new Date()
  text(date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), RIGHT, 14, { align: 'right' })

  // --------------------------------------------------------------- top boxes
  const top = 28
  const boxH = 72
  const cols = [M, M + 58, M + 118, M + 190, RIGHT]
  setDraw(INK)
  pdf.setLineWidth(0.4)
  pdf.rect(M, top, RIGHT - M, boxH)
  for (const x of cols.slice(1, -1)) pdf.line(x, top, x, top + boxH)

  // Column 1: material and size
  let y = top + 5
  heading('Shafts material', cols[0] + 2, y)
  for (const m of SHAFT_MATERIALS) box(cols[0] + 2, (y += 4.6), m, spec.material === m)
  y += 6
  heading('Size', cols[0] + 2, y)
  for (const s of SHAFT_SIZES) box(cols[0] + 2, (y += 4.6), s.label, spec.size === s.id)

  // Column 2: quantities, gear box, grooves, chamfer
  y = top + 5
  const c2 = cols[1] + 2
  heading('No. required', c2, y)
  font(8.5, 'bold')
  setText(INK)
  text(`Drive: ${spec.driveQty}     Idle: ${spec.idleQty}`, c2, (y += 5))
  y += 6
  heading('Hollow shaft gear box', c2, y)
  box(c2, (y += 4.6), 'Yes', spec.hollowGearBox === true)
  box(c2 + 16, y, 'No', spec.hollowGearBox === false)
  y += 6
  heading('Retainer ring grooves', c2, y)
  box(c2, (y += 4.6), 'Std.', spec.grooves === 'std')
  box(c2 + 16, y, 'None', spec.grooves === 'none')
  box(c2, (y += 4.6), 'Multiple', spec.grooves === 'multiple')
  if (spec.grooves === 'multiple' && spec.groovesNote.trim()) {
    font(7.5)
    setText(INK)
    const lines = pdf.splitTextToSize(pdfSafe(spec.groovesNote.trim()), 54) as string[]
    pdf.text(lines.slice(0, 2), c2, (y += 4))
    y += 4 * Math.min(lines.length, 2) - 4
  }
  y += 6
  heading('Chamfer', c2, y)
  box(c2, (y += 4.6), 'Yes', spec.chamfer === true)
  box(c2 + 16, y, 'No', spec.chamfer === false)
  font(6.5)
  setText(GRAY)
  text('Sprockets for S200, S400 & non-EZ Clean', c2, (y += 4))
  text('S800 require chamfers.', c2, (y += 3))

  // Column 3: who, and the sprockets
  y = top + 5
  const c3 = cols[2] + 2
  const w3 = cols[3] - cols[2] - 4
  field('Contact name', spec.contactName.trim(), c3, y, w3)
  field('Customer', [job.customer.trim(), job.plant.trim()].filter(Boolean).join(', '), c3, (y += 4.8), w3)
  field('Line', job.line.trim(), c3, (y += 4.8), w3)
  field('Date', job.date, c3, (y += 4.8), w3)
  field('Prepared by', job.preparedBy.trim(), c3, (y += 4.8), w3)
  const sprockets = (label: string, s: Sprockets, qty: number) => {
    y += 6.5
    heading(label, c3, y)
    if (qty === 0) {
      font(8)
      setText(GRAY)
      text('Not required', c3, (y += 4.8))
      return
    }
    field('Series', s.series.trim(), c3, (y += 4.8), w3)
    field('No. per shaft', s.perShaft === null ? '' : String(s.perShaft), c3, (y += 4.4), w3)
    field('Pitch diameter', s.pitchDia.trim(), c3, (y += 4.4), w3)
  }
  sprockets('Drive sprockets', spec.driveSprockets, spec.driveQty)
  sprockets('Idle sprockets', spec.idleSprockets, spec.idleQty)

  // Column 4: the form's fixed tolerances
  y = top + 5
  const c4 = cols[3] + 2
  heading('Tolerances', c4, y)
  font(6.5)
  setText(GRAY)
  text(`(${SHAFT_TOLERANCE_NOTE.replace(/\.$/, '').toLowerCase()})`, c4, (y += 3.6))
  font(7.5)
  setText(INK)
  for (const t of SHAFT_TOLERANCES) {
    const lines = pdf.splitTextToSize(pdfSafe(t), cols[4] - cols[3] - 4) as string[]
    pdf.text(lines, c4, (y += 4.2))
    y += (lines.length - 1) * 3.4
  }
  y += 3
  heading('Surface finishes', c4, (y += 2))
  font(7.5)
  setText(INK)
  for (const t of SHAFT_FINISHES) {
    const lines = pdf.splitTextToSize(pdfSafe(t), cols[4] - cols[3] - 4) as string[]
    pdf.text(lines, c4, (y += 4.2))
    y += (lines.length - 1) * 3.4
  }

  // ----------------------------------------------------------------- shafts
  y = top + boxH + 6
  const drawShaft = (d: ShaftDrawing, title: string, keyway: ShaftSpec['keyway']) => {
    const height = 46
    if (y + height > BOTTOM) {
      pdf.addPage()
      y = 16
    }
    setText(INK)
    font(11, 'bold')
    text(title, M, y + 3)
    const x0 = M + 22
    const x3 = M + 175
    const j = 22
    const [x1, x2] = [x0 + j, x3 - j]
    const cy = y + 26
    const setDim = () => {
      setDraw(DIM)
      pdf.setLineWidth(0.3)
    }
    const dimH = (a: number, b: number, yy: number, label: string) => {
      setDim()
      pdf.line(a, yy, b, yy)
      pdf.line(a, yy - 1.5, a, yy + 1.5)
      pdf.line(b, yy - 1.5, b, yy + 1.5)
      setText(DIM)
      font(8, 'bold')
      text(label, (a + b) / 2, yy - 1.2, { align: 'center' })
    }

    // Body
    setDraw(INK)
    pdf.setLineWidth(0.5)
    pdf.setFillColor(235, 235, 240)
    pdf.rect(x0, cy - 4, j, 8, 'FD')
    pdf.rect(x2, cy - 4, j, 8, 'FD')
    pdf.rect(x1, cy - 8, x2 - x1, 16, 'FD')
    const grooves = d.insideGroovesIn !== null
    const gx1 = x1 + (x2 - x1) * (d.grooveOffsetIn !== null ? 0.22 : 0.3)
    const gx2 = x2 - (x2 - x1) * (d.grooveOffsetIn !== null ? 0.38 : 0.3)
    if (grooves) {
      pdf.setLineWidth(1.2)
      for (const gx of [gx1, gx2]) {
        pdf.line(gx, cy - 8, gx, cy - 6.5)
        pdf.line(gx, cy + 6.5, gx, cy + 8)
      }
    }
    if (keyway) {
      const kx = keyway.end === 1 ? x0 + 3 : x2 + 4
      pdf.setLineWidth(0.4)
      pdf.setFillColor(255, 255, 255)
      pdf.roundedRect(kx, cy - 1.5, j - 7, 3, 1.5, 1.5, 'FD')
    }
    setText(INK)
    font(8, 'bold')
    text('END 1', x0, cy + 15)
    text('END 2', x3, cy + 15, { align: 'right' })

    // Dimensions
    dimH(x0, x3, y + 6, `Overall ${v(d.overallIn)}`)
    dimH(x0, x1, y + 12, v(d.end1.lengthIn))
    dimH(x2, x3, y + 12, v(d.end2.lengthIn))
    dimH(x1, x2, y + 12, `Square ${v(squareLengthIn(d))}`)
    setText(DIM)
    font(8, 'bold')
    text(`Dia. ${v(d.end1.diaIn)}`, x0 - 2, cy + 1, { align: 'right' })
    text(`Dia. ${v(d.end2.diaIn)}`, x3 + 2, cy + 1)
    if (grooves) dimH(gx1, gx2, cy + 13, `Inside ring grooves ${v(d.insideGroovesIn)}`)
    if (d.grooveOffsetIn !== null) dimH(x1, gx1, cy + 19, `Off center ${v(d.grooveOffsetIn)}`)

    // Side tables: keyway, drill & tap
    let ty = y + 6
    const tx = M + 205
    const row = (k: string, val: string) => {
      setText(GRAY)
      font(7.5)
      text(k, tx, (ty += 3.8))
      setText(INK)
      font(7.5, 'bold')
      text(val, RIGHT, ty, { align: 'right' })
    }
    if (keyway) {
      heading(`Keyway (End ${keyway.end})`, tx, ty)
      row('Width', v(keyway.widthIn))
      row('Depth', v(keyway.depthIn))
      row('Length (incl. arc)', v(keyway.lengthIn))
      row('Start', v(keyway.startIn))
      ty += 4
    }
    if (d.drillTap) {
      heading('Drill & tap', tx, ty)
      row('Depth', v(d.drillTap.depthIn))
      row('Screw size', d.drillTap.screwSize.trim() || '—')
      row('Threads per inch', d.drillTap.threadsPer.trim() || '—')
      row('Ends', [d.drillTap.end1 && 'End 1', d.drillTap.end2 && 'End 2'].filter(Boolean).join(', ') || '—')
    }
    y += height
  }
  if (spec.driveQty > 0) drawShaft(spec.drive, `Drive shaft  (${spec.driveQty})`, spec.keyway)
  if (spec.idleQty > 0) drawShaft(spec.idle, `Idle shaft  (${spec.idleQty})`, null)

  if (spec.notes.trim()) {
    const lines = pdf.splitTextToSize(pdfSafe(spec.notes.trim()), RIGHT - M) as string[]
    if (y + 8 + lines.length * 4 > BOTTOM) {
      pdf.addPage()
      y = 16
    }
    heading('Notes', M, y)
    setText(INK)
    font(9)
    pdf.text(lines, M, y + 5)
  }

  // --------------------------------------------------------- page furniture
  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page)
    setDraw([220, 220, 228])
    pdf.setLineWidth(0.2)
    pdf.line(M, PAGE_H - 11, RIGHT, PAGE_H - 11)
    setText(GRAY)
    font(7.5)
    text(
      `Prepared in the Intralox AM Hub${job.preparedBy.trim() ? `  ·  ${job.preparedBy.trim()}` : ''}  ·  ${[job.customer, job.line].filter(Boolean).join(', ')}  ·  ${args.lineLabel}`,
      M,
      PAGE_H - 7,
    )
    text(`Page ${page} of ${pageCount}`, RIGHT, PAGE_H - 7, { align: 'right' })
  }
  pdf.setProperties({
    title: pdfSafe(`Square Shaft Specification Sheet - ${[job.customer, job.line].filter(Boolean).join(' ')}`),
    creator: 'Intralox Account Manager Hub',
  })
  return { pdf, logoRendered }
}
