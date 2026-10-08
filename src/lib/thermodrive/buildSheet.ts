// The build sheet's content, once, for the PDF and Copy for email: the belt
// summary, sections, repair section and anything still flagged.
import type { Warning } from '../tdBulkDensity/types'
import type { UnitSystem } from '../tdBulkDensity/units'
import { effective, pitchMm, type TdBelt } from './belt'
import { FLIGHT_CLEAR_ROWS } from './data'
import { fmtBeltLen, fmtMm } from './format'
import { jointRemovals, maxSectionInfo, type SectionMode } from './geometry'
import { repairResult, sectionsFor, type RepairState } from './repair'
import { summaryRows } from './summary'
import { validateBelt, validateRepair } from './validate'

export interface BuildSheetMeta {
  customer: string
  reference: string
  notes: string
  preparedBy: string
  date: string
}

export interface BuildSheet {
  title: string
  meta: [string, string][]
  belt: [string, string][]
  sections: [string, string][]
  repair: [string, string][]
  warnings: Warning[]
  notes: string
}

export function buildSheet(belt: TdBelt, repair: RepairState, mode: SectionMode, meta: BuildSheetMeta, system: UnitSystem): BuildSheet {
  const b = effective(belt)
  const p = pitchMm(b)
  const sections: [string, string][] = []
  if (b.lengthMm > 0) {
    const res = sectionsFor(b, mode)
    const msi = maxSectionInfo(b)
    if (res.rows.length && !res.error) {
      res.rows.forEach((r, i) => {
        const over = msi.m !== null && r * p > msi.m * 1000 + 1e-6
        sections.push([`Section ${i + 1}`, `${r} rows, ${fmtBeltLen(r * p, system)}${over ? ` (over the ${msi.ft} ft max)` : ''}`])
      })
      const joints = jointRemovals(b, res.rows)
      const off = joints.reduce((a, j) => a + j.removedBefore.length + j.removedAfter.length, 0)
      if (joints.length) sections.push(['Flights at joints', off ? `${off} left off within ${FLIGHT_CLEAR_ROWS} row of a joint` : 'None left off'])
    } else if (res.error) sections.push(['Sections', res.error])
  }
  const repairRows: [string, string][] = []
  if (b.widthMm > 0 && repair.rows > 0) {
    const r = repairResult(b, repair)
    repairRows.push(['Repair section', `${repair.rows} rows, ${fmtBeltLen(r.L, system)}`])
    repairRows.push(['ThermoLace', `${r.lace.mode === 'onFeature' ? 'replaces the drive row' : 'between drive rows'} at ${fmtMm(r.lace.laceMm, system)} from the section start, 1/2 in loops`])
    if (r.flights) repairRows.push(['Repair flights', `${r.flights.kept.length} on the section, ${r.flights.removed.length} left off near the lace`])
  }
  return {
    title: 'ThermoDrive Belt Build Sheet',
    meta: [
      ['Customer', meta.customer || '—'],
      ['Reference', meta.reference || '—'],
      ['Prepared by', meta.preparedBy || '—'],
      ['Date', meta.date],
    ],
    belt: summaryRows(b, system),
    sections,
    repair: repairRows,
    warnings: [...validateBelt(b, system), ...validateRepair(b, system)].filter((w) => w.severity !== 'info'),
    notes: meta.notes.trim(),
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function buildSheetText(s: BuildSheet): string {
  const block = (title: string, rows: [string, string][]) => (rows.length ? [`${title}`, ...rows.map(([k, v]) => `  ${k}: ${v}`), ''] : [])
  return [
    s.title,
    ...s.meta.map(([k, v]) => `${k}: ${v}`),
    '',
    ...block('BELT', s.belt),
    ...block('SECTIONS', s.sections),
    ...block('REPAIR', s.repair),
    ...(s.warnings.length ? ['TO CHECK', ...s.warnings.map((w) => `  - ${w.severity === 'error' ? 'Must fix: ' : ''}${w.message} ${w.fix}`.trimEnd()), ''] : []),
    ...(s.notes ? ['NOTES', s.notes, ''] : []),
    'Made with the Intralox AM Hub ThermoDrive Belt Configurator.',
  ].join('\n')
}

/** Outlook-safe HTML: inline styles, simple tables. */
export function buildSheetHtml(s: BuildSheet): string {
  const table = (title: string, rows: [string, string][]) =>
    rows.length
      ? `<p style="margin:12px 0 4px;font:bold 14px Arial;color:#c8102e">${esc(title)}</p><table style="border-collapse:collapse;font:13px Arial">${rows
          .map(([k, v], i) => `<tr style="background:${i % 2 ? '#fff' : '#f7f7fa'}"><td style="padding:4px 10px;color:#646478">${esc(k)}</td><td style="padding:4px 10px;font-weight:bold">${esc(v)}</td></tr>`)
          .join('')}</table>`
      : ''
  return [
    `<p style="font:bold 16px Arial;margin:0 0 6px">${esc(s.title)}</p>`,
    table('Job', s.meta),
    table('Belt', s.belt),
    table('Sections', s.sections),
    table('Repair', s.repair),
    s.warnings.length
      ? `<p style="margin:12px 0 4px;font:bold 14px Arial;color:#c8102e">To check</p><ul style="font:13px Arial">${s.warnings
          .map((w) => `<li>${w.severity === 'error' ? '<b>Must fix:</b> ' : ''}${esc(`${w.message} ${w.fix}`.trim())}</li>`)
          .join('')}</ul>`
      : '',
    s.notes ? `<p style="margin:12px 0 4px;font:bold 14px Arial;color:#c8102e">Notes</p><p style="font:13px Arial;white-space:pre-wrap">${esc(s.notes)}</p>` : '',
  ].join('')
}
