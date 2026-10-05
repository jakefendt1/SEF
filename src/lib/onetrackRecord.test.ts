import { describe, it, expect } from 'vitest'
import { addItem, addQuoteOnly, emptyJob, upsertWearstrip } from './onetrack/bom'
import { emptyWorksheet, type WearstripWorksheet } from './onetrack/wearstrip'
import { ONETRACK_VERSION } from './onetrack/version'
import { buildRecord, fromRecord, recheckRecord, recordTitle } from './onetrackRecord'
import { buildOnetrackPdf, onetrackPdfFileName, pdfSafe } from './onetrackPdf'
import { resolveBom } from './onetrack/bom'

const job = { ...emptyJob('2026-10-05', 'Jake Fendt'), customer: ' Acme Snacks ', line: 'Incline 3 ', beltSeries: 'S1600' }
let lines = addItem([], 's3f8m2che7ng-00', 4)
lines = addQuoteOnly(lines, 'q1', 'quote-ss-shaft', '1 in, 24 in long')
lines = upsertWearstrip(lines, 'w1', {
  ...emptyWorksheet(),
  use: 'Carryway',
  profileId: 'clip-on',
  quoteAs: 'match',
  dims: { W: 1.25, H: undefined as unknown as number },
  rails: 2,
  lengthsIn: [240],
})

const rec = buildRecord({ id: 'b1', job, unit: 'in', lines, notes: '  wet line ', createdAt: 1, now: 2 })

describe('buildRecord', () => {
  it('trims the job fields it lists by, and stamps the version', () => {
    expect(rec.customer).toBe('Acme Snacks')
    expect(rec.reference).toBe('Incline 3')
    expect(rec.notes).toBe('wet line')
    expect(rec.version).toBe(ONETRACK_VERSION)
    expect(recordTitle(rec)).toBe('Acme Snacks · Incline 3')
  })

  it('holds nothing Firestore would refuse (no undefined anywhere)', () => {
    const walk = (v: unknown): boolean =>
      v === undefined ? false : Array.isArray(v) ? v.every(walk) : v && typeof v === 'object' ? Object.values(v).every(walk) : true
    expect(walk(rec)).toBe(true)
    expect(Object.keys((rec.lines[2] as { worksheet: { dims: object } }).worksheet.dims)).toEqual(['W'])
  })

  it('snapshots the part numbers and quantities', () => {
    expect(rec.snapshot).toEqual([
      { partNumber: 'TBD: CS to source', qty: 40 },
      { partNumber: 'S3F8M2CHE7NG-00', qty: 4 },
      { partNumber: 'TBD: CS to quote', qty: 1 },
    ])
  })
})

describe('reopening', () => {
  it('gives back the same BOM, and says nothing changed', () => {
    const s = fromRecord(rec)
    expect(resolveBom(s.lines, s.unit).map((r) => r.partNumber)).toEqual(rec.snapshot.map((r) => r.partNumber))
    expect(recheckRecord(rec)).toEqual({ changed: false, versionChanged: false })
  })

  it('says so when today’s catalog gives a different BOM', () => {
    const stale = { ...rec, snapshot: [{ partNumber: 'OLD', qty: 1 }, ...rec.snapshot.slice(1)], version: '0.9.0' }
    expect(recheckRecord(stale)).toEqual({ changed: true, versionChanged: true })
  })

  it('fills in fields an older record never had', () => {
    const s = fromRecord({ id: 'x' })
    expect(s.job.customer).toBe('')
    expect(s.lines).toEqual([])
    expect(s.unit).toBe('in')
  })
})

describe('PDF', () => {
  it('builds with every line and a safe file name', () => {
    const { pdf, fileName } = buildOnetrackPdf({
      job: { ...job, customer: 'Acme/Snacks', line: 'Incline 3' },
      unit: 'in',
      rows: resolveBom(lines, 'in'),
      wearstrips: [{ n: 1, worksheet: (lines[2] as { worksheet: WearstripWorksheet }).worksheet }],
      warnings: ['Line 1: No end-profile photo.'],
      notes: 'Wet line',
      caution: 'Field identification only.',
      photos: [],
      date: new Date(2026, 9, 5),
    })
    expect(fileName).toBe('OneTrack-BOM_AcmeSnacks_Incline-3_2026-10-05.pdf')
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1)
  })

  it('file name drops characters a file system would refuse', () => {
    expect(onetrackPdfFileName({ ...job, customer: 'A: B?', line: 'L*1', date: '2026-10-05' })).toBe(
      'OneTrack-BOM_A-B_L1_2026-10-05.pdf',
    )
  })

  it('keeps what the PDF font can draw and swaps what it cannot', () => {
    expect(pdfSafe('4 rails × 23 ft → 12 sections · ≥ 1 — “ok”')).toBe('4 rails × 23 ft to 12 sections · >= 1 — “ok”')
    expect(pdfSafe('✓ done')).toBe(' done')
  })
})
