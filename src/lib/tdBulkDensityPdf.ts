// PDF export for the ThermoDrive Bulk Density Calculator (plan §8).
//
// Two versions, chosen at export time (Customer is the default):
//  - Customer: inputs, results, the views, and an assumptions block. Engine
//    internals and profile-verification detail are left out and replaced by
//    "Estimate — final values confirmed by Intralox engineering."
//  - Internal: everything, plus every warning with its page cite and the
//    engine notes.
//
// Layout follows lib/pdf-export.ts (the AIM Glide export), including the two
// load-bearing habits documented there: ensureSpace before every block and
// row, and page furniture drawn in one pass over every page at the end.
import { jsPDF } from 'jspdf'
import { INTRALOX_LOGO_PNG, INTRALOX_LOGO_SIZE } from '../assets/intralox-logo-pdf'
import { compareRuns, containmentLabel } from './tdBulkDensity/compare'
import type { TdComputed } from './tdBulkDensity/compute'
import { FLIGHT_TYPES, SERIES_LABEL } from './tdBulkDensity/data/flights'
import { GRID } from './tdBulkDensity/heap3d'
import { CASE_WORDING } from './tdBulkDensity/pocket2d'
import { formatLen, formatQty, type UnitSystem } from './tdBulkDensity/units'
import { ENGINE_VERSION } from './tdBulkDensity/version'

type RGB = [number, number, number]
const BRAND: RGB = [200, 16, 46]
const GRAY: RGB = [100, 100, 120]
const INK: RGB = [40, 40, 55]
const PANEL: RGB = [244, 244, 248]
const ZEBRA: RGB = [250, 250, 252]
const ORANGE: RGB = [196, 98, 10]

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2
const RIGHT = PAGE_W - MARGIN
const CONTENT_BOTTOM = 268
const CONTINUATION_TOP = 25

export type PdfVersion = 'customer' | 'internal'

export interface PdfImage {
  /** PNG or JPEG data URL. */
  data: string
  /** Pixel size, for the aspect ratio. */
  w: number
  h: number
}

export interface TdPdfArgs {
  version: PdfVersion
  customer: string
  reference: string
  result: TdComputed
  system: UnitSystem
  /** e.g. "Kettle chips (typical range — confirm with customer)" or "Entered / measured". */
  densitySource: string
  images?: { pocket3d?: PdfImage; side?: PdfImage; end?: PdfImage }
  compare?: { a: TdComputed; images?: { a?: PdfImage; b?: PdfImage } }
  date?: Date
}

export interface TdPdfResult {
  fileName: string
  logoRendered: boolean
}

/** Standard PDF fonts are WinAnsi: swap what they can't draw. */
export function pdfSafe(s: string): string {
  return s
    .replace(/→/g, 'to')
    .replace(/γ_d|γd/g, 'dynamic repose')
    .replace(/γ/g, 'repose')
    .replace(/α/g, 'incline')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/θ/g, 'theta')
    .replace(/[^\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g, '')
}

export function buildTdPdf(args: TdPdfArgs): TdPdfResult & { pdf: jsPDF } {
  const { result: r, system: sys, version } = args
  const i = r.inputs
  const t = r.throughput
  if (r.status !== 'ok' || !t) throw new Error('Only a complete result can be exported.')

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
    bold(13)
    text(s, MARGIN, y)
    pdf.setDrawColor(225, 225, 232)
    pdf.setLineWidth(0.2)
    pdf.line(MARGIN, y + 2.5, RIGHT, y + 2.5)
    y += 9
  }

  const rows = (list: [string, string][]) => {
    list.forEach(([k, v], idx) => {
      const vLines = wrapped(v, CONTENT_W * 0.55)
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
      text('(view could not be drawn)', x + 2, top + 6)
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
  text(version === 'internal' ? 'INTERNAL — not for customers' : 'Customer copy', RIGHT, 19, { align: 'right' })
  y = 12 + logoH + 10
  setText(INK)
  bold(19)
  text('ThermoDrive Incline: Bulk Product Estimate', MARGIN, y)
  y += 7
  setText(GRAY)
  normal(10)
  text([args.customer, args.reference].filter(Boolean).join('  |  '), MARGIN, y)
  y += 4
  pdf.setDrawColor(BRAND[0], BRAND[1], BRAND[2])
  pdf.setLineWidth(0.8)
  pdf.line(MARGIN, y, RIGHT, y)
  y += 9

  if (version === 'customer') {
    setFill([253, 246, 236])
    pdf.roundedRect(MARGIN, y - 5, CONTENT_W, 9, 2, 2, 'F')
    setText(ORANGE)
    bold(9.5)
    text('Estimate — final values confirmed by Intralox engineering.', MARGIN + 3, y + 0.8)
    y += 10
  }

  // ----------------------------------------------------------------- results
  heading('Results', 28)
  const boxW = (CONTENT_W - 3 * 4) / 4
  const box = (idx: number, label: string, value: string, sub: string) => {
    const x = MARGIN + idx * (boxW + 4)
    setFill(PANEL)
    pdf.roundedRect(x, y, boxW, 25, 2.5, 2.5, 'F')
    setText(GRAY)
    normal(7.2)
    text(label.toUpperCase(), x + 3.5, y + 7)
    setText(INK)
    bold(value.length > 13 ? 10.5 : 13)
    text(value, x + 3.5, y + 16)
    setText(GRAY)
    normal(7)
    text(sub, x + 3.5, y + 21.5)
  }
  box(0, 'Min. belt speed', t.minSpeedFpm !== null ? formatQty(t.minSpeedFpm, 'speed', sys) : '—', i.targetLbPerHr !== null ? `for ${formatQty(i.targetLbPerHr, 'massRate', sys)}` : 'no target entered')
  box(1, 'Throughput', t.throughputLbPerHr !== null ? formatQty(t.throughputLbPerHr, 'massRate', sys) : '—', i.beltSpeedFpm !== null ? `at ${formatQty(i.beltSpeedFpm, 'speed', sys)}` : 'no speed entered')
  box(2, 'Product per flight', formatQty(t.massPerFlightLb, 'mass', sys), `${i.fillPct}% fill`)
  box(3, 'Edge loss', `${r.edgeLossPct.toFixed(0)}%`, 'vs. walls at both ends')
  y += 25 + 7
  if (r.geometricCase) paragraph(CASE_WORDING[r.geometricCase])

  const res: [string, string][] = []
  if (r.load) {
    const l = r.load
    res.push([
      l.source === 'target' ? 'Each pocket carries (for the target at this speed)' : `Each pocket carries (at ${i.fillPct}% fill)`,
      `${formatQty(l.massLb, 'mass', sys)}  —  ${Math.round(l.fraction * 100)}% of capacity${l.overCapacity ? ' (more than it can hold)' : ''}`,
    ])
  }
  res.push(
    ['Pocket capacity, brim-full', formatQty((i.densityLbFt3 / 1728) * r.pocketVolumeIn3, 'mass', sys)],
    ['Flights per minute', t.flightsPerMin !== null ? t.flightsPerMin.toFixed(1) : '—'],
    ['Pocket area (side section)', formatQty(r.pocketAreaIn2, 'area', sys)],
    ['Pocket volume', formatQty(r.pocketVolumeIn3, 'volume', sys)],
    ['Flight load', `${formatQty(t.flightLoadLbf, 'force', sys)}  (${formatQty(t.flightLoadLbfPerIn, 'forcePerLen', sys)})`],
    [
      'Flight load, brim-full (surge)',
      t.flightLoadSurgeLbf !== null && t.flightLoadSurgeLbfPerIn !== null
        ? `${formatQty(t.flightLoadSurgeLbf, 'force', sys)}  (${formatQty(t.flightLoadSurgeLbfPerIn, 'forcePerLen', sys)})`
        : '—',
    ],
    ['Product load on belt', formatQty(t.beltLoadLbPerFt, 'linearLoad', sys)],
    ['Belt-pull input (CalcLab-compatible)', formatQty(t.areaLoadLbPerFt2, 'areaLoad', sys)],
  )
  if (t.inclineProductLb !== null) res.push(['Product on the incline', formatQty(t.inclineProductLb, 'mass', sys)])
  if (t.inclineLiftLbf !== null) res.push(['Product lift (for belt pull)', formatQty(t.inclineLiftLbf, 'force', sys)])
  if (r.wallLoad) {
    res.push([
      r.guardDragPerPocketLbf !== null ? 'Guard pressure, max' : 'Sidewall pressure, max',
      formatQty(r.wallLoad.maxPressurePsi, 'pressure', sys),
    ])
  }
  if (r.guardDragPerPocketLbf !== null) res.push(['Guard drag per pocket per side', formatQty(r.guardDragPerPocketLbf, 'force', sys)])
  if (r.guardDragTotalLbf !== null) res.push(['Guard drag on the incline (add to belt pull)', formatQty(r.guardDragTotalLbf, 'force', sys)])
  rows(res)

  // ------------------------------------------------------------------- views
  const imgs = args.images ?? {}
  if (imgs.pocket3d || imgs.side || imgs.end) {
    heading('The pocket', 70)
    if (imgs.pocket3d) {
      ensureSpace(75)
      y += image(imgs.pocket3d, MARGIN, y, CONTENT_W, 75) + 3
      setText(GRAY)
      normal(8)
      text('Three pockets with your load. Clear amber is what a pocket can hold; colour shows where product would spill.', MARGIN, y)
      y += 6
    }
    if (imgs.side || imgs.end) {
      ensureSpace(68)
      const half = (CONTENT_W - 6) / 2
      let h = 0
      if (imgs.side) h = Math.max(h, image(imgs.side, MARGIN, y, half, 62))
      if (imgs.end) h = Math.max(h, image(imgs.end, MARGIN + half + 6, y, half, 62))
      y += h + 3
      setText(GRAY)
      normal(8)
      text('Side section (left) and end section (right), to scale.', MARGIN, y)
      y += 7
    }
  }

  // ------------------------------------------------------------------ inputs
  heading('Inputs', 40)
  const ft = FLIGHT_TYPES[i.flightType]
  const inputsRows: [string, string][] = [
    ['Belt', `${SERIES_LABEL[i.series]}, ${formatLen(i.beltWidthIn, sys)} wide`],
    ['Incline', `${i.inclineDeg}°${i.inclineLengthFt !== null ? `, ${formatQty(i.inclineLengthFt, 'lengthFt', sys)} long` : ''}`],
    ['Target throughput', i.targetLbPerHr !== null ? formatQty(i.targetLbPerHr, 'massRate', sys) : 'not entered'],
    ['Belt speed', i.beltSpeedFpm !== null ? formatQty(i.beltSpeedFpm, 'speed', sys) : 'not entered'],
    ['Flights', `${ft.label}, ${formatLen(i.flightHeightIn, sys)} high, ${formatLen(i.flightThicknessIn, sys)} thick, ${formatLen(i.flightSpacingIn, sys)} apart`],
    ['Flight ends', containmentLabel(i, sys)],
    ['Flight (carry) width', r.width ? formatLen(r.width.flightWidthIn, sys) : '—'],
  ]
  if (i.containment === 'sidewalls' || i.containment === 'sealed') {
    inputsRows.push(['Sidewall indent / gap', `${formatLen(i.sidewallIndentIn, sys)} / ${formatLen(i.containment === 'sealed' ? 0 : i.sidewallGapIn, sys)}, ${i.sidewallPitch.replace('mm', ' mm')} pitch`])
  } else {
    inputsRows.push(['Indents (left / right)', `${formatLen(i.indentLeftIn, sys)} / ${formatLen(i.indentRightIn, sys)}`])
  }
  if (i.notchCount > 0) inputsRows.push(['Notches', `${i.notchCount} x ${formatLen(i.notchWidthIn, sys)}`])
  inputsRows.push(
    ['Bulk density', formatQty(i.densityLbFt3, 'density', sys)],
    ['Angle of repose (static)', `${i.reposeDeg}°`],
    ['Smallest product dimension', formatLen(i.smallestDimIn, sys)],
  )
  rows(inputsRows)

  // ------------------------------------------------------------- assumptions
  heading('Assumptions', 30)
  rows([
    ['Fill factor', `${i.fillPct}%`],
    ['Flight ends', containmentLabel(i, sys)],
    ['Density source', args.densitySource],
    ['Repose used on the moving incline', `${r.gammaDynamicDeg.toFixed(1)}° (${i.reposeDeg}° static less ${i.calcLabMode ? 0 : i.dynamicDerateDeg}° for flight impacts and surges)`],
  ])
  paragraph(
    'Product preset values are typical ranges, not Intralox data. Throughput assumes a steady feed at the stated fill factor; product that falls into the indents has no flight behind it and is not counted.',
    8.5,
    GRAY,
  )

  // ---------------------------------------------------------------- internal
  if (version === 'internal') {
    heading('Warnings and notes', 20)
    for (const w of r.warnings) {
      const tag = w.severity === 'error' ? 'MUST FIX' : w.severity === 'warning' ? 'CHECK' : 'NOTE'
      const lines = wrapped(`${tag}: ${w.message}${w.fix ? ` ${w.fix}` : ''}`, CONTENT_W - 4)
      ensureSpace(lines.length * 4.3 + 2)
      normal(8.8)
      setText(w.severity === 'info' ? GRAY : w.severity === 'error' ? BRAND : ORANGE)
      pdf.text(lines, MARGIN + 2, y)
      y += lines.length * 4.3 + 1.5
    }
    y += 3
    if (r.waterfall) {
      heading('From CalcLab to this result', 30)
      rows(
        r.waterfall.map((w): [string, string] => [
          w.label,
          `${formatQty(w.massLb, 'mass', sys)}${w.throughputLbPerHr !== null ? `  |  ${formatQty(w.throughputLbPerHr, 'massRate', sys)}` : ''}${w.deltaPct !== null ? `  (${w.deltaPct >= 0 ? '+' : ''}${w.deltaPct.toFixed(0)}%)` : ''}`,
        ]),
      )
    }
    heading('Engine notes', 30)
    const g = GRID.fine
    rows([
      ['Engine version', ENGINE_VERSION],
      ['Model', '2D pocket by polygon clip; 3D critical-slope heap (min over spill edges of E + tan(repose) x distance)'],
      ['Grid', `${g.nx} x ${g.ny} x ${g.nz} cells`],
      ['Dynamic repose', `${r.gammaDynamicDeg.toFixed(1)}°`],
      ['CalcLab-equivalent mode', i.calcLabMode ? 'On (walls at both ends, no derate)' : 'Off'],
      ['Walls-at-both-ends volume', formatQty(r.wallsVolumeIn3, 'volume', sys)],
      ['Flight profile', r.profile?.verified ? 'Parametric, verified' : 'UNVERIFIED — estimate until confirmed against CAD'],
      ['Profile source', i.profileOverride ? 'Imported CAD point list' : 'Parametric (plan §4.1)'],
    ])
  }

  // ------------------------------------------------------------------ A / B
  if (args.compare) {
    const a = args.compare.a
    const c = compareRuns(a, r, sys)
    heading('A / B comparison', 40)
    paragraph(c.summary, 10.5, INK)
    if (c.changes.length > 1) for (const ch of c.changes) paragraph(`•  ${ch}`, 9, GRAY)
    rows([
      ['', 'A (pinned)  |  B (this result)'],
      ['Flight ends', `${containmentLabel(a.inputs, sys)}  |  ${containmentLabel(i, sys)}`],
      ['Product per flight', `${formatQty(a.throughput?.massPerFlightLb ?? 0, 'mass', sys)}  |  ${formatQty(t.massPerFlightLb, 'mass', sys)}`],
      [
        'Throughput',
        `${a.throughput?.throughputLbPerHr != null ? formatQty(a.throughput.throughputLbPerHr, 'massRate', sys) : '—'}  |  ${t.throughputLbPerHr !== null ? formatQty(t.throughputLbPerHr, 'massRate', sys) : '—'}`,
      ],
      [
        'Min. belt speed',
        `${a.throughput?.minSpeedFpm != null ? formatQty(a.throughput.minSpeedFpm, 'speed', sys) : '—'}  |  ${t.minSpeedFpm !== null ? formatQty(t.minSpeedFpm, 'speed', sys) : '—'}`,
      ],
      ['Edge loss', `${a.edgeLossPct.toFixed(0)}%  |  ${r.edgeLossPct.toFixed(0)}%`],
    ])
    const ci = args.compare.images
    if (ci?.a || ci?.b) {
      ensureSpace(62)
      const half = (CONTENT_W - 6) / 2
      let h = 0
      if (ci.a) h = Math.max(h, image(ci.a, MARGIN, y, half, 56))
      if (ci.b) h = Math.max(h, image(ci.b, MARGIN + half + 6, y, half, 56))
      y += h + 3
      setText(GRAY)
      normal(8)
      text('A (left) and B (right).', MARGIN, y)
      y += 6
    }
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
      `Intralox ThermoDrive Bulk Density Calculator  |  ${version === 'internal' ? 'Internal' : 'Estimate'}  |  Confidential`,
      MARGIN,
      PAGE_H - 11,
    )
    text(`Page ${page} of ${pageCount}`, RIGHT, PAGE_H - 11, { align: 'right' })
  }

  const slug = [args.customer, args.reference]
    .filter(Boolean)
    .join(' ')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
  const fileName =
    ['TD_Bulk_Density', slug, version === 'internal' ? 'INTERNAL' : '', date.toISOString().split('T')[0]]
      .filter(Boolean)
      .join('_') + '.pdf'
  pdf.setProperties({
    title: pdfSafe(`ThermoDrive bulk product estimate${slug ? ' - ' + [args.customer, args.reference].join(' ') : ''}`),
    subject: 'ThermoDrive flighted incline: product per flight, throughput and belt speed',
    creator: 'Intralox Account Manager Hub',
  })
  return { pdf, fileName, logoRendered }
}
