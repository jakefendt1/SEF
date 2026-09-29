import { describe, it, expect } from 'vitest'
import { buildPDF } from './pdf-export'
import { calculateTCO, EXAMPLE_INPUTS, type CalculatorInputs } from './calculator'

// These build the real document and inspect the resulting PDF stream. They exist
// because every bug this file had was invisible from the code: a truncated image
// that a catch swallowed, a footer drawn on only one page, and a table that ran
// off the bottom. All three are cheap to reintroduce and impossible to notice
// without opening the output.

function build(overrides: Partial<CalculatorInputs> = {}, benefitYears = 5) {
  const inputs = { ...EXAMPLE_INPUTS, customerName: 'Acme Bakery', projectName: 'Line 3', ...overrides }
  const tco = calculateTCO(inputs, benefitYears)
  const { pdf, fileName, logoRendered } = buildPDF(inputs, tco, benefitYears)
  return {
    fileName,
    logoRendered,
    pageCount: pdf.getNumberOfPages(),
    raw: pdf.output('datauristring'),
    text: pdf.output() as string,
  }
}

/** A long note, to push the document onto a second page. */
const LONG_NOTES = Array.from(
  { length: 30 },
  (_, i) =>
    `Assumption ${i + 1}: figures confirmed with the plant maintenance lead during the site visit, including downtime attributed to slat switch changeovers.`,
)

describe('the AIM Glide PDF', () => {
  it('embeds the Intralox logo rather than silently falling back', () => {
    const { logoRendered, text } = build()
    expect(logoRendered).toBe(true)
    // The image has to actually reach the document, not just avoid throwing.
    expect(text).toContain('/Image')
  })

  it('names the file after the customer and the date', () => {
    const { fileName } = build()
    expect(fileName).toMatch(/^AIM_Glide_ROI_Acme_Bakery_Line_3_\d{4}-\d{2}-\d{2}\.pdf$/)
  })

  it('strips characters a filename cannot carry', () => {
    const { fileName } = build({ customerName: 'Acme / Foods: Co.', projectName: '' })
    expect(fileName).toContain('Acme_Foods_Co')
    expect(fileName).not.toMatch(/[/:]/)
  })

  it('puts the footer and a page number on every page, not just the last', () => {
    const { pageCount, text } = build({ notes: LONG_NOTES })
    expect(pageCount).toBeGreaterThan(1)

    // The old version drew the footer inline, so it landed on whichever page
    // happened to be current when drawing finished -- page 1 got a number and
    // no footer.
    for (let page = 1; page <= pageCount; page++) {
      expect(text, `page ${page} lost its page number`).toContain(`Page ${page} of ${pageCount}`)
    }
    const footers = text.match(/Confidential/g) ?? []
    expect(footers.length).toBe(pageCount)
  })

  it('carries the calc traces the screen shows', () => {
    const { text } = build()
    // "1 hrs/week x 52 x $70/hr" -- the layer that answers "where did that come
    // from". The previous export dropped every one of these.
    expect(text).toContain('Slat switch:')
    expect(text).toContain('AIM Glide:')
  })

  it('states the inputs it was derived from', () => {
    const { text } = build()
    expect(text).toContain('Inputs & Assumptions')
    expect(text).toContain('Maintenance labor rate')
    expect(text).toContain('Benefit period')
  })

  it('does not claim a payback when the investment never recovers', () => {
    // The raw savings.paybackYears field is "0.00" here, which would read as an
    // *instant* payback. Both the summary box and the caption go through
    // formatPayback so they say what it actually means.
    const { text } = build({ aimSparePartsCost: 500_000 })
    expect(text).toContain('No payback')
    expect(text).toContain('does not recover')
  })

  it('survives the widest content without throwing', () => {
    expect(() =>
      build({
        notes: LONG_NOTES,
        laborReallocated: true,
        metalOtherCost: 4200,
        metalOtherCostDesc:
          'Third-party belt tracking service visits, quarterly, including travel and the replacement wear strips fitted during each visit',
        aimOtherCost: 800,
        aimOtherCostDesc: 'Annual inspection contract',
        customerName: 'A Very Long Customer Name That Runs Across The Header',
        projectName: 'Bakery Line 3 Spiral Infeed Switch Replacement Project',
      }),
    ).not.toThrow()
  })

  it('builds for every benefit period', () => {
    for (const years of [1, 5, 10]) {
      const { pageCount } = build({}, years)
      expect(pageCount).toBeGreaterThanOrEqual(1)
    }
  })
})
