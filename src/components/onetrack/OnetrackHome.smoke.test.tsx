// Server renders of the page and its pieces. The rest of the suite is
// node-only logic; this proves the screens still mount -- that no import,
// hook order or null-handling mistake takes the tool down to a blank card.
// It is not a substitute for opening it on an iPad.
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Router } from 'wouter'
import { emptyJob, upsertWearstrip } from '@/lib/onetrack/bom'
import { emptyWorksheet } from '@/lib/onetrack/wearstrip'
import { OnetrackHome } from './OnetrackHome'
import { CategoryList, CategoryTiles } from './PartsStep'
import { WearstripEditor } from './WearstripEditor'
import { ReviewStep } from './ReviewStep'
import { BomPanel } from './BomPanel'
import { resolveBom, addItem } from '@/lib/onetrack/bom'

const noop = () => {}
const page = () =>
  renderToStaticMarkup(
    <Router ssrPath="/onetrack">
      <OnetrackHome />
    </Router>,
  )

describe('OnetrackHome', () => {
  // The beta gate itself (OnetrackRoute -> canSeeTool) is covered in
  // lib/betaAccess.test.ts: a server render reads the auth store's initial
  // state, so it can't be signed in here.
  it('opens on the job step with nothing invented', () => {
    const html = page()
    expect(html).toContain('OneTrack BOM Builder')
    expect(html).toContain('1. Job')
    expect(html).toContain('Not saved')
    expect(html).toContain('BOM · 0 lines')
  })
})

describe('pieces', () => {
  it('category tiles list every category', () => {
    const html = renderToStaticMarkup(<CategoryTiles lines={[]} onOpen={noop} />)
    expect(html).toContain('CleanLock sprockets')
    expect(html).toContain('Shafts &amp; CIP (CS quotes)')
  })

  it('a category list filters to the job belt series', () => {
    const html = renderToStaticMarkup(
      <CategoryList category="cleanLockSprockets" beltSeries="S1600" onBack={noop} onAdd={noop} onAddQuoteOnly={noop} />,
    )
    expect(html).toContain('S3F8M2CHE7NG-00')
    expect(html).not.toContain('S3D8M2CPE7NG-00')
    expect(html).toContain('Show all')
  })

  it('the wearstrip editor opens empty', () => {
    const html = renderToStaticMarkup(
      <WearstripEditor initial={emptyWorksheet()} isNew unit="in" onSave={noop} onCancel={noop} />,
    )
    expect(html).toContain('Add wearstrip')
    expect(html).toContain('Clip-on')
    expect(html).toContain('Radius snap-on')
  })

  it('the wearstrip editor shows the line for a finished worksheet', () => {
    const html = renderToStaticMarkup(
      <WearstripEditor
        initial={{ ...emptyWorksheet(), use: 'Carryway', profileId: 'onetrack-flat', quoteAs: 'onetrackFlat', color: 'Natural', rails: 4, lengthsIn: [282] }}
        isNew={false}
        unit="in"
        onSave={noop}
        onCancel={noop}
      />,
    )
    expect(html).toContain('B6XX86IXXWMV-00')
    expect(html).toContain('Qty 12')
  })

  it('review lists what is missing and hides the outputs until it is ready', () => {
    const lines = upsertWearstrip([], 'w1', emptyWorksheet())
    const html = renderToStaticMarkup(
      <ReviewStep state={{ job: emptyJob('2026-10-05', 'J'), unit: 'in', lines, notes: '', photos: [] }} onGoTo={noop} />,
    )
    expect(html).toContain('Before this can go to CS')
    expect(html).toContain('Take me there')
    expect(html).not.toContain('Download PDF')
  })

  it('review offers the outputs for a complete BOM', () => {
    const job = { ...emptyJob('2026-10-05', 'J'), customer: 'Acme', line: 'L1' }
    const html = renderToStaticMarkup(
      <ReviewStep state={{ job, unit: 'in', lines: addItem([], 's3f8m2che7ng-00', 2), notes: '', photos: [] }} onGoTo={noop} />,
    )
    expect(html).toContain('Download PDF')
    expect(html).toContain('Copy for email')
  })

  it('the BOM panel shows each line', () => {
    const lines = addItem([], 's3f8m2che7ng-00', 2)
    const html = renderToStaticMarkup(<BomPanel rows={resolveBom(lines, 'in')} lines={lines} onQty={noop} onRemove={noop} onEdit={noop} />)
    expect(html).toContain('S3F8M2CHE7NG-00')
    expect(html).toContain('1 line')
  })
})
