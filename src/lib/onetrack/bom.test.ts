import { describe, it, expect } from 'vitest'
import {
  addItem,
  addQuoteOnly,
  emptyJob,
  hasWearstrip,
  missingFor,
  removeLine,
  resolveBom,
  setQty,
  upsertWearstrip,
  warningsFor,
  type BomLine,
  type OnetrackJob,
} from './bom'
import { filterItems, chipOptions, normalizeSeries } from './filter'
import { itemsIn } from './catalog'
import { formatHtml, formatPlainText } from './format'
import { emptyWorksheet, type WearstripWorksheet } from './wearstrip'

const SPROCKET_1600 = 's3f8m2che7ng-00'
const SPROCKET_800 = 's3d8m2cpe7ng-00'
const PULLER_5LINK = 'c3sf125xxxxx-00'

const job: OnetrackJob = {
  ...emptyJob('2026-10-05', 'Jake Fendt'),
  customer: 'Acme Snacks',
  plant: 'Beloit WI',
  line: 'Packaging incline 3',
  beltSeries: 'S1600',
  beltWidthIn: 24,
}

const flatWorksheet: WearstripWorksheet = {
  ...emptyWorksheet(),
  use: 'Carryway',
  profileId: 'onetrack-flat',
  quoteAs: 'onetrackFlat',
  color: 'Natural',
  rails: 4,
  lengthsIn: [282],
}

describe('BOM operations', () => {
  it('M1: adding the same part twice raises one line', () => {
    const lines = addItem(addItem([], SPROCKET_1600, 2), SPROCKET_1600, 3)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ kind: 'catalog', itemId: SPROCKET_1600, qty: 5 })
  })

  it('M2: quantity 0 removes the line; fractions round to whole parts', () => {
    const lines = addItem([], SPROCKET_1600, 2)
    expect(setQty(lines, lines[0].id, 0)).toEqual([])
    expect(setQty(lines, lines[0].id, 3.4)[0]).toMatchObject({ qty: 3 })
  })

  it('refuses to add wearstrip or quote-only items as list parts', () => {
    expect(() => addItem([], 'ot-flat-natural', 1)).toThrow()
    expect(() => addItem([], 'quote-ss-shaft', 1)).toThrow()
  })

  it('keeps two shafts as two lines: they are two different specs', () => {
    let lines: BomLine[] = addQuoteOnly([], 'q1', 'quote-ss-shaft', '1 in, 24 in long')
    lines = addQuoteOnly(lines, 'q2', 'quote-ss-shaft', '1.5 in, 36 in long')
    expect(lines).toHaveLength(2)
  })

  it('edits a wearstrip line in place', () => {
    let lines = upsertWearstrip([], 'w1', flatWorksheet)
    lines = upsertWearstrip(lines, 'w1', { ...flatWorksheet, color: 'Blue' })
    expect(lines).toHaveLength(1)
    expect(resolveBom(lines, 'in')[0].partNumber).toBe('B6XX86IXXWJQ-00')
    expect(removeLine(lines, 'w1')).toEqual([])
  })
})

describe('resolveBom', () => {
  it('M4: wearstrip first, then parts in category order, then CS-quoted items', () => {
    let lines: BomLine[] = addQuoteOnly([], 'q1', 'quote-cip', 'Two lines, S1600')
    lines = addItem(lines, SPROCKET_1600, 4) // sprockets come after pullers
    lines = addItem(lines, PULLER_5LINK, 1)
    lines = upsertWearstrip(lines, 'w1', flatWorksheet)
    const rows = resolveBom(lines, 'in')
    expect(rows.map((r) => r.partNumber)).toEqual([
      'B6XX86IXXWMV-00',
      'C3SF125XXXXX-00',
      'S3F8M2CHE7NG-00',
      'TBD: CS to quote',
    ])
    expect(rows.map((r) => r.n)).toEqual([1, 2, 3, 4])
  })

  it('shows an unfinished wearstrip line rather than hiding it', () => {
    const rows = resolveBom(upsertWearstrip([], 'w1', emptyWorksheet()), 'in')
    expect(rows[0]).toMatchObject({ description: 'Wearstrip (not finished)', qty: null })
  })

  it('keeps a part that has left the catalog, and says so', () => {
    const rows = resolveBom([{ id: 'item:gone', kind: 'catalog', itemId: 'zzzz9999zzzz-00', qty: 2 }], 'in')
    expect(rows[0]).toMatchObject({ partNumber: 'ZZZZ9999ZZZZ-00', description: 'No longer in the OneTrack menu', qty: 2 })
  })
})

describe('missingFor', () => {
  it('needs a customer, a line and at least one part', () => {
    expect(missingFor(emptyJob('2026-10-05', 'J'), []).map((m) => m.field)).toEqual([
      'Customer',
      'Line / conveyor ID',
      'Parts',
    ])
  })

  it('B13: names the missing color on a wearstrip line, with where to go', () => {
    const lines = upsertWearstrip([], 'w1', { ...flatWorksheet, color: null })
    const missing = missingFor(job, lines)
    expect(missing.map((m) => m.field)).toEqual(['Color'])
    expect(missing[0]).toMatchObject({ label: 'Line 1 (wearstrip): Color', target: { lineId: 'w1' } })
  })

  it('M3: a CS-quoted line needs a note', () => {
    const lines = addQuoteOnly(addItem([], SPROCKET_1600, 1), 'q1', 'quote-ss-shaft', '   ')
    expect(missingFor(job, lines).map((m) => m.label)).toEqual(['Line 2: what CS needs to quote it'])
  })

  it('is empty for a complete BOM', () => {
    expect(missingFor(job, upsertWearstrip(addItem([], SPROCKET_1600, 1), 'w1', flatWorksheet))).toEqual([])
  })
})

describe('warningsFor', () => {
  const none = { endProfileTaken: false }

  it('W1: a sprocket for another series than the job', () => {
    expect(warningsFor(job, addItem([], SPROCKET_800, 2), 'in', none).map((w) => w.text)).toEqual([
      'Line 1: This part is for S800; the job says S1600.',
    ])
  })

  it('lists every series a multi-series part is for', () => {
    const w = warningsFor({ ...job, beltSeries: '900' }, addItem([], 'c3sf087xxxxx-00', 1), 'in', none)
    expect(w[0].text).toBe('Line 1: This part is for S800, S850, S888 or S1800; the job says 900.')
  })

  it('no series warning when the job has no series, or the part fits any belt', () => {
    expect(warningsFor({ ...job, beltSeries: '' }, addItem([], SPROCKET_800, 1), 'in', none)).toEqual([])
    expect(warningsFor(job, addItem([], 'c3k8xxxxxxhn-00', 1), 'in', none)).toEqual([])
  })

  it('checks a large quantity', () => {
    expect(warningsFor(job, addItem([], SPROCKET_1600, 60), 'in', none)[0].text).toBe(
      'Line 1: Quantity is 60. Is that right?',
    )
  })

  it('asks for an end photo on a match line until one is taken', () => {
    const lines = upsertWearstrip([], 'w1', {
      ...flatWorksheet,
      profileId: 'clip-on',
      quoteAs: 'match',
      color: null,
      dims: { W: 1, H: 1 },
    })
    expect(warningsFor(job, lines, 'in', none).map((w) => w.text)).toEqual([
      'Line 1: No end-profile photo. CS needs a straight-on end photo with a ruler to match it.',
    ])
    expect(warningsFor(job, lines, 'in', { endProfileTaken: true })).toEqual([])
  })
})

describe('filterItems', () => {
  const sprockets = itemsIn('cleanLockSprockets')

  it('FL1: belt series S1600 narrows sprockets to the four S1600 parts', () => {
    const r = filterItems(sprockets, { beltSeries: 'S1600', bySeries: true })
    expect(r.items).toHaveLength(4)
    expect(r.seriesApplied).toBe('1600')
    expect(r.items.every((i) => i.series.includes('1600'))).toBe(true)
  })

  it('FL2: however the rep typed the series', () => {
    expect(normalizeSeries('1600')).toBe('1600')
    expect(normalizeSeries('Series 1600 Flush Grid')).toBe('1600')
    expect(normalizeSeries('s 1600')).toBe('1600')
    expect(normalizeSeries('ThermoDrive 8050')).toBe('8050')
    expect(normalizeSeries('flat top')).toBeNull()
  })

  it('FL3: a series with no parts shows everything and says so', () => {
    const r = filterItems(sprockets, { beltSeries: 'S900', bySeries: true })
    expect(r.items).toHaveLength(sprockets.length)
    expect(r.seriesNoMatch).toBe(true)
    expect(r.seriesApplied).toBeNull()
  })

  it('ignores the series in categories that are not filtered by it', () => {
    expect(filterItems(sprockets, { beltSeries: 'S1600', bySeries: false }).items).toHaveLength(sprockets.length)
  })

  it('combines chips with the series', () => {
    const r = filterItems(sprockets, { beltSeries: 'S1600', bySeries: true, chips: { teeth: '20', bore: '40 mm' } })
    expect(r.items.map((i) => i.partNumber)).toEqual(['S3F8M2CYK1NG-00'])
  })

  it('a chip choice that empties the list is not reported as a series mismatch', () => {
    const r = filterItems(sprockets, { beltSeries: 'S1600', bySeries: true, chips: { bore: '2.5 in' } })
    expect(r.items).toEqual([])
    expect(r.seriesNoMatch).toBe(false)
  })

  it('chip options come from the items, in catalog order', () => {
    expect(chipOptions(itemsIn('retainerRings'), 'shaft')).toEqual(['Round', 'Square'])
    expect(chipOptions(sprockets, 'bore')).toEqual(['1.5 in', '40 mm', '2.5 in', '60 mm'])
  })
})

describe('copy for email', () => {
  let lines: BomLine[] = addQuoteOnly([], 'q1', 'quote-cleanlock-shaft', '1.5 in square, 30 in long, 1 in round journals both ends')
  lines = addItem(lines, SPROCKET_1600, 4)
  lines = upsertWearstrip(lines, 'w1', flatWorksheet)
  const text = {
    job,
    rows: resolveBom(lines, 'in'),
    notes: 'Wet line, washdown nightly.',
    unit: 'in' as const,
    caution: hasWearstrip(lines),
  }

  it('F1: plain text for a mixed BOM', () => {
    expect(formatPlainText(text)).toBe(
      [
        'OneTrack BOM: quote request',
        'Customer: Acme Snacks, Beloit WI | Line: Packaging incline 3',
        'Belt: S1600, 24 in',
        'Prepared by: Jake Fendt, 2026-10-05',
        '',
        '1) B6XX86IXXWMV-00',
        '   OneTrack UHMW-PE flat wearstrip, natural',
        '   Qty 12 (10 ft section)',
        '   Carryway. 4 rails, 23 ft 6 in each, 94 ft total',
        '',
        '2) S3F8M2CHE7NG-00',
        '   CleanLock sprocket, S1600, 12 teeth, 3.9 in (99 mm) PD, 1.5 in square bore',
        '   Qty 4 (each)',
        '',
        '3) TBD: CS to quote',
        '   CleanLock stainless steel square shaft (1.5 in / 40 mm: S800, 1600, 1800, 2400, 8050; 2.5 in / 60 mm: S1800)',
        '   Qty 1 (each)',
        '   1.5 in square, 30 in long, 1 in round journals both ends',
        '',
        'Notes: Wet line, washdown nightly.',
        'Field identification only. Confirm profile, compatibility and availability before ordering.',
      ].join('\n'),
    )
  })

  it('leaves out the belt line and the caution when there is nothing to say', () => {
    const plain = formatPlainText({
      ...text,
      job: { ...job, beltSeries: '', beltWidthIn: null, plant: '' },
      rows: resolveBom(addItem([], SPROCKET_1600, 1), 'in'),
      notes: '',
      caution: false,
    })
    expect(plain).not.toContain('Belt:')
    expect(plain).not.toContain('Field identification')
    expect(plain).toContain('Customer: Acme Snacks | Line:')
    expect(plain.endsWith('Qty 1 (each)')).toBe(true)
  })

  it('F2: HTML carries every part number, inline styles only, and escapes input', () => {
    const html = formatHtml({ ...text, notes: '<script>alert(1)</script> & more' })
    for (const r of text.rows) expect(html).toContain(r.partNumber)
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/\sclass=/i)
    expect(html).not.toMatch(/<style/i)
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp; more')
  })
})
