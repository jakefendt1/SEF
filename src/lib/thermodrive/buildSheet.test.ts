import { describe, expect, it } from 'vitest'
import { buildThermodrivePdf, buildSheetFileName } from '../thermodrivePdf'
import { freshBelt, newVar, type TdBelt } from './belt'
import { IN, PITCH_MM } from './data'
import { buildSheet, buildSheetHtml, buildSheetText } from './buildSheet'
import { defaultRepair } from './repair'

const p = PITCH_MM['8050']
const belt: TdBelt = {
  ...freshBelt('8050'),
  widthMm: 24 * IN,
  lengthMm: 400 * p,
  flightSpacingMm: 4 * p,
  vars: [{ ...newVar(2), heightMm: 3 * IN }],
}
const meta = { customer: 'Jacksons Chips <Mez>', reference: 'Line 4', notes: 'Rush', preparedBy: 'Jake Fendt', date: '2026-10-08' }

describe('build sheet', () => {
  const sheet = buildSheet(belt, defaultRepair(belt), { kind: 'count', count: 3 }, meta, 'imperial')

  it('B1: carries the job, the belt, its sections and repair section, and what to check', () => {
    expect(sheet.meta).toContainEqual(['Customer', 'Jacksons Chips <Mez>'])
    expect(sheet.belt.map(([k]) => k)).toEqual(expect.arrayContaining(['Series', 'Style', 'Belt width', 'Flight spacing', 'Flights']))
    expect(sheet.sections.filter(([k]) => k.startsWith('Section ')).length).toBe(3)
    expect(sheet.repair[0][1]).toMatch(/^18 rows/)
    // 400 rows of 8050 is 65 ft: over the 60 ft max for 3 in flights.
    expect(sheet.warnings.map((w) => w.id)).toContain('section-max')
  })

  it('B2: the email text and HTML say the same, and the HTML is escaped', () => {
    const plain = buildSheetText(sheet)
    expect(plain).toContain('Customer: Jacksons Chips <Mez>')
    expect(plain).toContain('SECTIONS')
    const html = buildSheetHtml(sheet)
    expect(html).toContain('Jacksons Chips &lt;Mez&gt;')
    expect(html).not.toContain('<Mez>')
  })

  it('B3: the PDF builds without pictures, named for the job', () => {
    const { pdf, fileName } = buildThermodrivePdf(sheet, {})
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1)
    expect(fileName).toBe('ThermoDrive-Build-Sheet_Jacksons-Chips-Mez_Line-4_2026-10-08.pdf')
    expect(buildSheetFileName({ ...sheet, meta: [['Customer', '—'], ['Reference', '—'], ['Date', '2026-10-08']] })).toBe('ThermoDrive-Build-Sheet_2026-10-08.pdf')
  })
})
