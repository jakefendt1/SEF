import { describe, it, expect } from 'vitest'
import {
  emptyDrillTap,
  emptyKeyway,
  emptyShaftSpec,
  missingForShaft,
  shaftOptions,
  shaftRow,
  shaftWarnings,
  squareLengthIn,
  type ShaftSpec,
} from './shaft'
import { addItem, emptyJob, missingFor, resolveBom, setQty, upsertShaft } from './bom'
import { buildRecord, fromRecord, recheckRecord } from '../onetrackRecord'
import { buildShaftPdf, shaftPdfFileName } from '../shaftSpecPdf'

const drawing = (overall: number) => ({
  overallIn: overall,
  end1: { lengthIn: 3, diaIn: 1.25 },
  end2: { lengthIn: 4, diaIn: 1.25 },
  insideGroovesIn: 20,
  grooveOffsetIn: null,
  drillTap: null,
})

const done: ShaftSpec = {
  ...emptyShaftSpec(),
  material: 'Stainless steel #316',
  size: '1.5',
  driveQty: 2,
  idleQty: 1,
  hollowGearBox: false,
  grooves: 'std',
  chamfer: true,
  drive: drawing(36),
  idle: drawing(36),
  driveSprockets: { series: 'S1600', perShaft: 4, pitchDia: '6.4 in' },
}

describe('shaft worksheet', () => {
  it('S1: an empty sheet lists what CS needs first', () => {
    expect(missingForShaft(emptyShaftSpec())).toEqual(['Material', 'Size', 'How many (drive or idle)', 'Retainer ring grooves'])
  })

  it('S2: asks for each requested shaft’s dimensions, and nothing for the other', () => {
    const m = missingForShaft({ ...emptyShaftSpec(), material: 'Carbon steel #1018', size: '1', driveQty: 1, hollowGearBox: true, grooves: 'none' })
    expect(m).toEqual([
      'Drive shaft: overall length',
      'Drive shaft: End 1 journal length',
      'Drive shaft: End 2 journal length',
    ])
  })

  it('S3: 0 journal length means no journal, and then no diameter is needed', () => {
    const spec = { ...done, idleQty: 0, drive: { ...drawing(36), end2: { lengthIn: 0, diaIn: null } } }
    expect(missingForShaft(spec)).toEqual([])
  })

  it('S4: a keyway or drill & tap, once added, must be filled in', () => {
    const spec = { ...done, keyway: emptyKeyway(), drive: { ...drawing(36), drillTap: emptyDrillTap() } }
    expect(missingForShaft(spec)).toEqual([
      'Drive shaft: drill & tap depth',
      'Drive shaft: drill & tap screw size',
      'Drive shaft: drill & tap threads per inch',
      'Drive shaft: which end to drill & tap',
      'Keyway width',
      'Keyway depth',
      'Keyway length',
      'Keyway start',
    ])
  })

  it('S5: the square section is overall less both journals', () => {
    expect(squareLengthIn(drawing(36))).toBe(29)
    expect(squareLengthIn({ ...drawing(36), overallIn: null })).toBeNull()
  })

  it('S6: one BOM line summarising the sheet', () => {
    expect(shaftRow(done, 'CleanLock stainless steel square shaft (…)', 'in')).toEqual({
      partNumber: 'TBD: CS to quote',
      description: 'CleanLock square shaft, 1.5 in square, stainless steel #316: 2 drive (36 in long), 1 idle (36 in long)',
      qty: 3,
      uom: 'each',
      notes: 'Details on the attached Square Shaft Specification Sheet.',
    })
    expect(shaftRow(emptyShaftSpec(), 'x', 'in')).toBeNull()
  })

  it('S7: catches journals bigger than the square, grooves off the square, and a missing chamfer', () => {
    const spec: ShaftSpec = {
      ...done,
      chamfer: false,
      drive: { ...drawing(36), end1: { lengthIn: 3, diaIn: 1.75 }, insideGroovesIn: 30 },
    }
    expect(shaftWarnings({ ...spec, driveSprockets: { ...spec.driveSprockets, series: 'S800' } }, 'in')).toEqual([
      'Drive shaft: End 1 journal (1.75 in) is bigger than the 1.5 in square. Is that right?',
      "Drive shaft: the ring grooves (30 in apart) don't fit on the 29 in square section.",
      'Sprockets for S200, S400 and non-EZ Clean S800 need a chamfered shaft. The sheet says no chamfer.',
    ])
  })

  it('S8: CleanLock shafts only offer what the menu lists', () => {
    expect(shaftOptions('quote-cleanlock-shaft')).toEqual({
      materials: ['Stainless steel #303/304', 'Stainless steel #316'],
      sizes: ['1.5', '2.5'],
    })
    expect(shaftOptions('quote-ss-shaft').sizes).toHaveLength(5)
  })
})

describe('shaft lines on the BOM', () => {
  const lines = upsertShaft(addItem([], 's3f8m2che7ng-00', 4), 's1', 'quote-cleanlock-shaft', done)

  it('sit after the parts, carry the summary, and keep their own quantity', () => {
    const rows = resolveBom(lines, 'in')
    expect(rows.map((r) => r.kind)).toEqual(['catalog', 'shaft'])
    expect(rows[1]).toMatchObject({ n: 2, qty: 3, partNumber: 'TBD: CS to quote' })
    // The stepper never edits a shaft: its quantity comes from the sheet.
    expect(setQty(lines, 's1', 9)).toEqual(lines)
  })

  it('an unfinished sheet shows on the BOM and in the missing list', () => {
    const l = upsertShaft([], 's1', 'quote-ss-shaft', emptyShaftSpec())
    expect(resolveBom(l, 'in')[0]).toMatchObject({ description: 'Square shaft (spec sheet not finished)', qty: null })
    const job = { ...emptyJob('2026-10-05', 'J'), customer: 'A', line: 'L' }
    expect(missingFor(job, l)[0]).toMatchObject({ label: 'Line 1 (shaft): Material', target: { lineId: 's1' } })
  })

  it('save and reopen without losing the sheet', () => {
    const rec = buildRecord({ id: 'b', job: emptyJob('2026-10-05', 'J'), unit: 'in', lines, notes: '', createdAt: 1, now: 1 })
    expect(fromRecord(rec).lines).toEqual(lines)
    expect(recheckRecord(rec).changed).toBe(false)
  })

  it('the spec sheet PDF builds, with a name that says which line', () => {
    const job = { ...emptyJob('2026-10-05', 'Jake Fendt'), customer: 'Acme Snacks', line: 'Incline 3' }
    const { pdf } = buildShaftPdf({
      job,
      unit: 'in',
      spec: { ...done, keyway: { end: 2, widthIn: 0.375, depthIn: 0.1875, lengthIn: 3, startIn: 0 }, notes: 'Match the old shaft.' },
      lineLabel: 'Line 2',
      itemDescription: 'CleanLock stainless steel square shaft',
      date: new Date(2026, 9, 5),
    })
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1)
    expect(shaftPdfFileName(job, 2)).toBe('Shaft-Spec_Acme-Snacks_Incline-3_Line2_2026-10-05.pdf')
  })
})
