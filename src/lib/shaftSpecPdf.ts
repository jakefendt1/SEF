// PDF of a Square Shaft Specification Sheet, laid out like Intralox's paper
// form (Onetrack/Shaft Spec Form.pdf) so the machine shop reads it the same
// way: the title down the left edge; a header band with shafts material and
// size, contact and sprockets, and the tolerances; then the drive and idle
// shafts with every dimension written into a box on its dimension line, the
// keyway table at the keyway end and the optional drill & tap box.
import { jsPDF } from 'jspdf'
import { INTRALOX_LOGO_PNG, INTRALOX_LOGO_SIZE } from '../assets/intralox-logo-pdf'
import type { OnetrackJob } from './onetrack/bom'
import {
  SHAFT_FINISHES,
  SHAFT_MATERIALS,
  SHAFT_SIZES,
  SHAFT_TOLERANCES,
  formatShaftDim,
  squareLengthIn,
  type ShaftDrawing,
  type ShaftSpec,
  type Sprockets,
} from './onetrack/shaft'
import { pdfSafe } from './onetrackPdf'
import type { Unit } from './measurement'

type RGB = [number, number, number]
const INK: RGB = [25, 25, 30]
const GRAY: RGB = [110, 110, 125]
const FILL: RGB = [24, 70, 160]
const BODY: RGB = [236, 236, 241]

// Letter, landscape, like the form.
const PAGE_W = 279.4
const PAGE_H = 215.9
const FRAME_L = 24
const FRAME_R = PAGE_W - 8
const FRAME_T = 8
const HEADER_B = 83
const FRAME_B = PAGE_H - 9

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
  const text = (s: string, x: number, y: number, opts?: { align?: 'left' | 'right' | 'center'; angle?: number }) =>
    pdf.text(pdfSafe(s), x, y, opts)
  const val = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? `${formatShaftDim(n, unit)} ${unit}` : '')

  /** A tick box, ticked when chosen. */
  const tick = (x: number, y: number, label: string, checked: boolean) => {
    setDraw(INK)
    pdf.setLineWidth(0.25)
    pdf.rect(x, y - 2.5, 2.8, 2.8)
    if (checked) {
      setDraw(FILL)
      pdf.setLineWidth(0.5)
      pdf.line(x + 0.4, y - 2.1, x + 2.4, y - 0.1)
      pdf.line(x + 2.4, y - 2.1, x + 0.4, y - 0.1)
    }
    setText(checked ? FILL : INK)
    font(7.5, checked ? 'bold' : 'normal')
    text(label, x + 4, y)
  }
  const head = (s: string, x: number, y: number) => {
    setText(INK)
    font(8, 'bold')
    text(s.toUpperCase(), x, y)
  }
  /** "LABEL ____" with the value written on the line, like a filled-in form. */
  const blank = (label: string, value: string, x: number, y: number, lineFrom: number, lineTo: number) => {
    setText(INK)
    font(7.5)
    if (label) text(label, x, y)
    setDraw(GRAY)
    pdf.setLineWidth(0.15)
    pdf.line(lineFrom, y + 0.6, lineTo, y + 0.6)
    if (value) {
      setText(FILL)
      font(8, 'bold')
      const fit = pdf.splitTextToSize(pdfSafe(value), lineTo - lineFrom - 1) as string[]
      pdf.text(fit[0] ?? '', lineFrom + 0.8, y - 0.2)
    }
  }

  // ------------------------------------------------------------- side title
  setText(INK)
  font(20, 'bold')
  text('Square Shaft Specification Sheet', 15, FRAME_B - 4, { angle: 90 })
  font(8)
  setText(GRAY)
  text(`${args.itemDescription}  ·  ${args.lineLabel} of the OneTrack BOM`, 20.5, FRAME_B - 4, { angle: 90 })

  // ------------------------------------------------------------------ frame
  setDraw(INK)
  pdf.setLineWidth(0.5)
  pdf.rect(FRAME_L, FRAME_T, FRAME_R - FRAME_L, FRAME_B - FRAME_T)
  pdf.line(FRAME_L, HEADER_B, FRAME_R, HEADER_B)
  const W = FRAME_R - FRAME_L
  const c1 = FRAME_L
  const c2 = c1 + W * 0.19
  const c3 = c2 + W * 0.2
  const c4 = c3 + W * 0.34
  for (const x of [c2, c3, c4]) pdf.line(x, FRAME_T, x, HEADER_B)

  // Column 1: logo and who made the sheet
  let logoRendered = true
  const logoW = 34
  const logoH = (logoW * INTRALOX_LOGO_SIZE.height) / INTRALOX_LOGO_SIZE.width
  try {
    pdf.addImage(INTRALOX_LOGO_PNG, 'PNG', c1 + 4, FRAME_T + 5, logoW, logoH)
  } catch {
    logoRendered = false
    setText([200, 16, 46])
    font(15, 'bold')
    pdf.text('INTRALOX', c1 + 4, FRAME_T + 5 + logoH - 2)
  }
  let y = FRAME_T + logoH + 13
  setText(INK)
  font(8)
  for (const line of ['Intralox, L.L.C.', 'New Orleans, LA USA']) {
    text(line, c1 + 4, y)
    y += 4
  }
  y += 3
  setText(GRAY)
  font(7)
  text('Prepared in the Intralox AM Hub', c1 + 4, y)
  text(`by ${job.preparedBy.trim() || '—'}`, c1 + 4, (y += 3.6))
  const date = args.date ?? new Date()
  text(date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), c1 + 4, (y += 3.6))

  // Column 2: material, size, number required, hollow shaft gear box
  const x2 = c2 + 3
  y = FRAME_T + 5
  head('Shafts material:', x2, y)
  for (const m of SHAFT_MATERIALS) tick(x2, (y += 4), m.toUpperCase(), spec.material === m)
  head('Size:', x2, (y += 6))
  for (const s of SHAFT_SIZES) tick(x2, (y += 4), s.label.replace(' in square', '" SQUARE'), spec.size === s.id)
  head('No. required:', x2, (y += 6))
  blank('DRIVE', String(spec.driveQty), x2, (y += 4.4), x2 + 10, x2 + 20)
  blank('IDLE', String(spec.idleQty), x2 + 23, y, x2 + 30, x2 + 40)
  head('Hollow shaft gear box', x2, (y += 6))
  tick(x2, (y += 4), 'YES', spec.hollowGearBox === true)
  tick(x2 + 14, y, 'NO', spec.hollowGearBox === false)

  // Column 3: contact, customer, date; sprockets; ring grooves; chamfer
  const x3 = c3 + 3
  const r3 = c4 - 3
  y = FRAME_T + 5
  blank('CONTACT NAME:', job.contact.trim(), x3, y, x3 + 24, r3)
  blank('CUSTOMER:', [job.customer.trim(), job.plant.trim()].filter(Boolean).join(', '), x3, (y += 4.6), x3 + 24, r3)
  blank('LINE:', job.line.trim(), x3, (y += 4.6), x3 + 24, r3)
  blank('DATE:', job.date, x3, (y += 4.6), x3 + 24, r3)
  pdf.setLineWidth(0.3)
  setDraw(INK)
  pdf.line(c3, y + 2.5, c4, y + 2.5)
  const sprockets = (label: string, s: Sprockets, qty: number) => {
    head(label, x3, (y += 6))
    const none = qty === 0
    blank('SERIES', none ? 'not required' : s.series.trim(), x3, (y += 4.4), x3 + 12, x3 + 38)
    blank('NO. PER SHAFT', none || s.perShaft === null ? '' : String(s.perShaft), x3 + 41, y, x3 + 63, r3)
    blank('PITCH DIAMETER', none ? '' : s.pitchDia.trim(), x3, (y += 4.4), x3 + 25, x3 + 60)
  }
  sprockets('Drive sprockets:', spec.driveSprockets, spec.driveQty)
  sprockets('Idle sprockets:', spec.idleSprockets, spec.idleQty)
  head('Retainer ring grooves:', x3, (y += 5.5))
  tick(x3, (y += 4), 'STD.', spec.grooves === 'std')
  tick(x3 + 26, y, 'NONE', spec.grooves === 'none')
  tick(x3, (y += 4), 'MULTIPLE', spec.grooves === 'multiple')
  if (spec.grooves === 'multiple') blank('', spec.groovesNote.trim(), x3 + 22, y, x3 + 22, r3)
  head('Chamfer', x3, (y += 5))
  tick(x3 + 16, y, 'YES', spec.chamfer === true)
  tick(x3 + 30, y, 'NO', spec.chamfer === false)
  setText(GRAY)
  font(6.3)
  pdf.text(
    pdf.splitTextToSize('(NOTE: SPROCKETS FOR SERIES 200, 400 & NON EZ CLEAN 800 REQUIRE CHAMFERS)', r3 - x3) as string[],
    x3,
    (y += 3.4),
  )

  // Column 4: the form's fixed tolerances and finishes
  const x4 = c4 + 3
  const w4 = FRAME_R - c4 - 5
  y = FRAME_T + 5
  head('Tolerances', x4, y)
  setText(GRAY)
  font(6.5)
  text('(UNLESS OTHERWISE SPECIFIED)', x4, (y += 3.4))
  setText(INK)
  font(7)
  const letters = 'ABCD'
  SHAFT_TOLERANCES.forEach((t, i) => {
    const lines = pdf.splitTextToSize(pdfSafe(`${letters[i]}) ${t.toUpperCase()}`), w4) as string[]
    pdf.text(lines, x4, (y += 3.9))
    y += (lines.length - 1) * 3
  })
  head('Surface finishes', x4, (y += 6))
  setText(INK)
  font(7)
  SHAFT_FINISHES.forEach((t, i) => {
    const lines = pdf.splitTextToSize(pdfSafe(`${letters[i]}) ${t.toUpperCase()}`), w4) as string[]
    pdf.text(lines, x4, (y += 3.9))
    y += (lines.length - 1) * 3
  })

  // ----------------------------------------------------------------- shafts
  const arrow = (x: number, yy: number, dir: 1 | -1) => {
    pdf.setFillColor(INK[0], INK[1], INK[2])
    pdf.triangle(x, yy, x + dir * 2, yy - 0.8, x + dir * 2, yy + 0.8, 'F')
  }
  /** A value box like the form's, filled in. Empty when there's nothing to say. */
  const box = (cx: number, yy: number, value: string, w = 22) => {
    pdf.setFillColor(255, 255, 255)
    setDraw(INK)
    pdf.setLineWidth(0.3)
    pdf.rect(cx - w / 2, yy - 3.2, w, 5.4, 'FD')
    if (value) {
      setText(FILL)
      font(7.8, 'bold')
      text(value, cx, yy + 0.7, { align: 'center' })
    }
  }
  const dimLine = (a: number, b: number, yy: number, value: string, w = 22) => {
    setDraw(INK)
    pdf.setLineWidth(0.25)
    pdf.line(a, yy, b, yy)
    arrow(a, yy, 1)
    arrow(b, yy, -1)
    box((a + b) / 2, yy, value, Math.min(w, Math.max(14, b - a - 6)))
  }
  const ext = (x: number, from: number, to: number) => {
    setDraw(GRAY)
    pdf.setLineWidth(0.15)
    pdf.line(x, from, x, to)
  }
  const small = (s: string, x: number, yy: number, align: 'left' | 'center' | 'right' = 'left') => {
    setText(GRAY)
    font(5.8)
    text(s.toUpperCase(), x, yy, { align })
  }

  const drawShaft = (
    d: ShaftDrawing,
    top: number,
    title: string,
    qty: number,
    keyway: ShaftSpec['keyway'] | undefined,
    drillTapSide: 'left' | 'right',
  ) => {
    const sx0 = 82
    const sx3 = 214
    const jw = 20
    const [sx1, sx2] = [sx0 + jw, sx3 - jw]
    const cy = top + 30
    const overallY = top + 8
    const rowY = top + 17

    // Body
    setDraw(INK)
    pdf.setLineWidth(0.5)
    pdf.setFillColor(BODY[0], BODY[1], BODY[2])
    pdf.rect(sx0, cy - 4.5, jw, 9, 'FD')
    pdf.rect(sx2, cy - 4.5, jw, 9, 'FD')
    pdf.rect(sx1, cy - 8, sx2 - sx1, 16, 'FD')
    pdf.setLineWidth(0.25)
    pdf.line(sx1, cy, sx2, cy)

    // Ring grooves
    const grooves = spec.grooves === 'std'
    const off = d.grooveOffsetIn !== null
    const gx1 = sx1 + (sx2 - sx1) * (off ? 0.22 : 0.32)
    const gx2 = sx2 - (sx2 - sx1) * (off ? 0.42 : 0.32)
    if (grooves) {
      for (const gx of [gx1, gx2]) {
        pdf.setFillColor(255, 255, 255)
        pdf.circle(gx, cy - 8, 0.9, 'FD')
        pdf.circle(gx, cy + 8, 0.9, 'FD')
        pdf.circle(gx, cy, 0.7, 'FD')
      }
    }
    // Keyway slot
    if (keyway) {
      const kx = keyway.end === 1 ? sx0 + 3 : sx2 + 4
      pdf.setFillColor(255, 255, 255)
      pdf.setLineWidth(0.35)
      pdf.roundedRect(kx, cy - 1.4, jw - 7, 2.8, 1.4, 1.4, 'FD')
    }

    // Overall, journals and square
    ext(sx0, overallY - 3, cy - 5)
    ext(sx3, overallY - 3, cy - 5)
    ext(sx1, rowY - 2, cy - 8)
    ext(sx2, rowY - 2, cy - 8)
    dimLine(sx0, sx3, overallY, val(d.overallIn), 26)
    dimLine(sx0, sx1, rowY, val(d.end1.lengthIn), 18)
    dimLine(sx1, sx2, rowY, val(squareLengthIn(d)), 26)
    dimLine(sx2, sx3, rowY, val(d.end2.lengthIn), 18)

    // Journal diameters, with leaders like the form
    const dia = (x: number, value: string, side: 'left' | 'right') => {
      const bx = side === 'left' ? x - 17 : x + 17
      setDraw(INK)
      pdf.setLineWidth(0.25)
      pdf.line(x, cy + 4.5, x, cy + 13)
      pdf.line(x, cy + 13, bx, cy + 13)
      box(bx, cy + 13, value, 18)
      small('Dia.', bx, cy + 9.2, 'center')
    }
    dia(sx0 + jw / 2, val(d.end1.diaIn), 'left')
    dia(sx3 - jw / 2, val(d.end2.diaIn), 'right')

    if (grooves) {
      ext(gx1, cy + 8, cy + 18)
      ext(gx2, cy + 8, cy + 18)
      dimLine(gx1, gx2, cy + 15, val(d.insideGroovesIn), 22)
      small('Dimension inside ring grooves', gx2 + 2, cy + 17.5)
      if (off) {
        ext(sx1, cy + 8, cy + 24)
        dimLine(sx1, gx1, cy + 22, val(d.grooveOffsetIn), 16)
        small('If retainer rings', sx1 - 2, cy + 21.6, 'right')
        small('are off center', sx1 - 2, cy + 24.2, 'right')
      }
    }

    // Keyway table at the keyway end (drive only)
    if (keyway !== undefined) {
      const kx = 230
      const ky = top + 4
      setDraw(INK)
      pdf.setLineWidth(0.3)
      pdf.rect(kx, ky, 38, 26)
      setText(INK)
      font(8, 'bold')
      text(keyway ? `KEYWAY  (END ${keyway.end})` : 'KEYWAY', kx + 19, ky + 4.5, { align: 'center' })
      if (keyway) {
        const rows: [string, number | null][] = [
          ['WIDTH', keyway.widthIn],
          ['DEPTH', keyway.depthIn],
          ['LENGTH', keyway.lengthIn],
          ['START', keyway.startIn],
        ]
        rows.forEach(([k, v], i) => blank(k, val(v), kx + 2.5, ky + 9.5 + i * 4.6, kx + 15, kx + 36))
      } else {
        setText(GRAY)
        font(7.5)
        text('None', kx + 19, ky + 14, { align: 'center' })
      }
      small('Keyway length includes arc', kx, ky + 29)
    }

    // Optional drill & tap box (End 1 side on the drive, End 2 on the idle, like the form)
    const tx = drillTapSide === 'left' ? FRAME_L + 3 : 230
    const ty = drillTapSide === 'left' ? top + 4 : top + 14
    const bw = drillTapSide === 'left' ? 36 : 38
    const t = d.drillTap
    setDraw(INK)
    pdf.setLineWidth(0.3)
    pdf.rect(tx, ty, bw, 30)
    setText(INK)
    font(7.5)
    text('OPTIONAL', tx + bw / 2, ty + 3.8, { align: 'center' })
    text('DRILL & TAP', tx + bw / 2, ty + 7.2, { align: 'center' })
    const r = tx + bw - 2
    blank('DEPTH', t ? val(t.depthIn) : '', tx + 2, ty + 11.5, tx + 16, r)
    blank('SCREW SIZE', t?.screwSize.trim() ?? '', tx + 2, ty + 15.6, tx + 19, r)
    blank('THREADS PER', t?.threadsPer.trim() ?? '', tx + 2, ty + 19.7, tx + 21, r)
    blank('END 1', t?.end1 ? 'Yes' : '', tx + 2, ty + 23.8, tx + 12, r)
    blank('END 2', t?.end2 ? 'Yes' : '', tx + 2, ty + 27.9, tx + 12, r)

    // End labels and the shaft name
    setText(INK)
    font(9, 'bold')
    text('END 1', sx0 - 2, cy - 7, { align: 'right' })
    text('END 2', sx3 + 2, cy - 7)
    font(14, 'bold')
    text(`${title}${qty > 0 ? `  (${qty})` : ''}`, (sx0 + sx3) / 2 + 12, top + 58.5, { align: 'center' })
    if (qty === 0) {
      setText(GRAY)
      font(9, 'bold')
      text('NOT REQUIRED', (sx0 + sx3) / 2, cy + 1.2, { align: 'center' })
    }
  }

  drawShaft(spec.drive, HEADER_B + 1, 'DRIVE SHAFT', spec.driveQty, spec.keyway, 'left')
  pdf.setLineWidth(0.15)
  setDraw([200, 200, 210])
  pdf.line(FRAME_L + 2, HEADER_B + 61.5, FRAME_R - 2, HEADER_B + 61.5)
  drawShaft(spec.idle, HEADER_B + 62, 'IDLE SHAFT', spec.idleQty, undefined, 'right')

  // Footer
  setText(GRAY)
  font(7)
  text(
    `${[job.customer, job.line].filter(Boolean).join(', ')}  ·  ${args.lineLabel}  ·  Shaft dimensions in ${unit === 'in' ? 'inches' : 'millimetres'}`,
    FRAME_L,
    PAGE_H - 4,
  )

  // Notes for the shop on a second page, so the sheet itself stays the form.
  if (spec.notes.trim()) {
    pdf.addPage('letter', 'l')
    setText(INK)
    font(13, 'bold')
    text('Notes for the shop', FRAME_L, 20)
    font(10)
    const lines = pdf.splitTextToSize(pdfSafe(spec.notes.trim()), FRAME_R - FRAME_L) as string[]
    pdf.text(lines, FRAME_L, 28)
    setText(GRAY)
    font(7)
    text(`${[job.customer, job.line].filter(Boolean).join(', ')}  ·  ${args.lineLabel}`, FRAME_L, PAGE_H - 4)
  }

  pdf.setProperties({
    title: pdfSafe(`Square Shaft Specification Sheet - ${[job.customer, job.line].filter(Boolean).join(' ')}`),
    creator: 'Intralox Account Manager Hub',
  })
  return { pdf, logoRendered }
}
