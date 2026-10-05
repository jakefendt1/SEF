// "Copy for email": the BOM as plain text and as Outlook-safe HTML. Both go on
// the clipboard in one write, so a paste looks right in Outlook, Gmail or
// Teams.
//
// Plain text has no column alignment -- Outlook and Teams use proportional
// fonts, so padded columns arrive ragged. HTML uses inline styles only (no
// classes, no <style> block): Outlook strips the rest.

import { WEARSTRIP_CAUTION_SHORT, type OnetrackJob, type ResolvedRow } from './bom'
import { formatDim } from './wearstrip'
import type { Unit } from '../measurement'

export interface BomText {
  job: OnetrackJob
  rows: readonly ResolvedRow[]
  notes: string
  unit: Unit
  /** True when the BOM has a wearstrip line; adds the field-identification caution. */
  caution: boolean
}

export const EMAIL_TITLE = 'OneTrack BOM: quote request'

function headerLines(b: BomText): string[] {
  const { job, unit } = b
  const customer = [job.customer.trim(), job.plant.trim()].filter(Boolean).join(', ')
  const lines = [`Customer: ${customer} | Line: ${job.line.trim()}`]
  if (job.contact.trim()) lines.push(`Contact: ${job.contact.trim()}`)
  const belt = [
    job.beltSeries.trim(),
    job.beltWidthIn !== null ? `${formatDim(job.beltWidthIn, unit)} ${unit}` : '',
  ].filter(Boolean)
  if (belt.length) lines.push(`Belt: ${belt.join(', ')}`)
  lines.push(`Prepared by: ${[job.preparedBy.trim(), job.date].filter(Boolean).join(', ')}`)
  return lines
}

const qtyText = (r: ResolvedRow) => `Qty ${r.qty ?? '—'}${r.uom ? ` (${r.uom})` : ''}`

export function formatPlainText(b: BomText): string {
  const out = [EMAIL_TITLE, ...headerLines(b), '']
  for (const r of b.rows) {
    out.push(`${r.n}) ${r.partNumber}`, `   ${r.description}`, `   ${qtyText(r)}`)
    if (r.notes) out.push(`   ${r.notes}`)
    out.push('')
  }
  if (b.notes.trim()) out.push(`Notes: ${b.notes.trim()}`)
  if (b.caution) out.push(WEARSTRIP_CAUTION_SHORT)
  while (out.at(-1) === '') out.pop()
  return out.join('\n')
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const FONT = 'font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111111'
const CELL = 'border:1px solid #999999;padding:6px 8px;text-align:left;vertical-align:top'
const HEAD = `${CELL};background:#eeeeee;font-weight:bold`

export function formatHtml(b: BomText): string {
  const p = (html: string, extra = '') => `<p style="margin:0 0 4px;${extra}">${html}</p>`
  const header = headerLines(b).map((l) => p(esc(l))).join('')
  const head = ['Line', 'Part number', 'Description', 'Qty', 'UOM', 'Notes']
    .map((h) => `<th style="${HEAD}">${h}</th>`)
    .join('')
  const body = b.rows
    .map(
      (r) =>
        '<tr>' +
        `<td style="${CELL}">${r.n}</td>` +
        `<td style="${CELL};font-family:Consolas,'Courier New',monospace;font-weight:bold;white-space:nowrap">${esc(r.partNumber)}</td>` +
        `<td style="${CELL}">${esc(r.description)}</td>` +
        `<td style="${CELL};text-align:right">${r.qty ?? '—'}</td>` +
        `<td style="${CELL}">${esc(r.uom)}</td>` +
        `<td style="${CELL}">${esc(r.notes)}</td>` +
        '</tr>',
    )
    .join('')
  const notes = b.notes.trim() ? p(`Notes: ${esc(b.notes.trim())}`, 'margin-top:8px') : ''
  const caution = b.caution ? p(esc(WEARSTRIP_CAUTION_SHORT), 'margin-top:8px;font-style:italic;color:#555555') : ''
  return (
    `<div style="${FONT}">` +
    p(`<strong>${esc(EMAIL_TITLE)}</strong>`) +
    header +
    `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;${FONT}">` +
    `<tr>${head}</tr>${body}</table>` +
    notes +
    caution +
    '</div>'
  )
}
