// Builds the real document and inspects the PDF stream -- the same approach
// as pdf-export.test.ts, for the same reason: PDF bugs are invisible from code.
import { describe, expect, it } from 'vitest'
import { computeTdBulkDensity } from './tdBulkDensity/compute'
import { makeInputs } from './tdBulkDensity/defaults'
import { buildTdPdf, pdfSafe, type PdfVersion } from './tdBulkDensityPdf'

const inputs = makeInputs({ beltSpeedFpm: 60, targetLbPerHr: 1000, beltWidthIn: 16, inclineLengthFt: 20 })
const result = computeTdBulkDensity(inputs, 'coarse')

function build(version: PdfVersion, compare = false) {
  const { pdf, fileName, logoRendered } = buildTdPdf({
    version,
    customer: 'Acme Snacks',
    reference: 'Line 3 / incline',
    result,
    system: 'imperial',
    densitySource: 'Kettle chips (typical range — confirm with customer)',
    compare: compare
      ? { a: computeTdBulkDensity({ ...inputs, containment: 'sidewalls', sidewallHeightIn: 4 }, 'coarse') }
      : undefined,
    date: new Date('2026-10-02T12:00:00Z'),
  })
  return { fileName, logoRendered, pages: pdf.getNumberOfPages(), text: pdf.output() as string }
}

describe('the bulk density PDF', () => {
  it('embeds the logo and names the file after the run', () => {
    const b = build('customer')
    expect(b.logoRendered).toBe(true)
    expect(b.text).toContain('/Image')
    expect(b.fileName).toBe('TD_Bulk_Density_Acme_Snacks_Line_3_incline_2026-10-02.pdf')
  })

  it('customer copy carries the estimate line and hides engine internals', () => {
    const b = build('customer')
    expect(b.text).toContain('Estimate')
    expect(b.text).toContain('final values confirmed by Intralox engineering')
    expect(b.text).toContain('Assumptions')
    expect(b.text).not.toContain('Engine notes')
    expect(b.text).not.toContain('Warnings and notes')
  })

  it('internal copy adds warnings with cites and the engine notes', () => {
    const b = build('internal')
    expect(b.text).toContain('Engine notes')
    expect(b.text).toContain('Warnings and notes')
    expect(b.text).toContain('NOTE: ')
    // Wrapped lines split a cite across text runs, so look for the page number.
    expect(b.text).toMatch(/p\.1\d\d/)
    expect(b.fileName).toContain('_INTERNAL_')
  })

  it('adds the A/B comparison when active, with a footer on every page', () => {
    const b = build('internal', true)
    expect(b.text).toContain('A / B comparison')
    expect(b.pages).toBeGreaterThan(1)
    for (let p = 1; p <= b.pages; p++) expect(b.text).toContain(`Page ${p} of ${b.pages}`)
  })

  it('refuses to export an incomplete result rather than printing blanks', () => {
    const r = computeTdBulkDensity({ ...inputs, containment: 'guards', guardClearanceIn: null })
    expect(() =>
      buildTdPdf({ version: 'customer', customer: 'a', reference: 'b', result: r, system: 'imperial', densitySource: '' }),
    ).toThrow()
  })

  it('keeps text inside what the standard PDF font can draw', () => {
    expect(pdfSafe('A → B, γ ≥ α')).toBe('A to B, repose >= incline')
  })
})
