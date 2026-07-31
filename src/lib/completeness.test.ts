import { describe, it, expect } from 'vitest'
import { getCompleteness, getSectionProgress } from './completeness'
import { formSchema, type FormValues } from '../schema/formSchema'

const VALID_QUICK: Partial<FormValues> = {
  mode: 'quick',
  name: 'Jacob Fendt',
  companyName: 'Intralox',
  email: 'jacob@intralox.com',
  installationType: 'New',
  applicationType: 'Freezer',
  productProcessed: 'Chicken nuggets',
  incomingProductTemp: -20,
  beltSpeed: 40,
  spiralManufacturer: 'Ashworth',
  travelDirection: 'Upgo',
  rotationDirection: 'Clockwise',
  numTiersSpiral1: 20,
  tierPitch: 3,
  takeUpTravelLength: 2,
  drumBasis: 'Diameter',
  drumValue: 24,
  beltWidth: 12,
  infeedLength: 5,
  dischargeLength: 5,
  configurationSpiral1: '360°',
  returnTypeSpiral1: 'Drum',
  numRails: 3,
  railSpacing: 4,
  insideOverhang: 1,
  outsideOverhang: 1,
  carrywayWearstripMaterial: 'UHMW',
  drumType: 'Solid',
  cageBarCapMaterial: 'UHMW',
}

const VALID_FULL: Partial<FormValues> = {
  ...VALID_QUICK,
  mode: 'full',
  title: 'Sales Rep',
  phone: '555-123-4567',
  countryOrRegion: 'United States',
  address: '201 Laitram Lane',
  city: 'Harahan',
  stateProvince: 'Louisiana',
  zipPostalCode: '70123',
  howProductCarried: 'Fully Packaged',
  heatSource: ['No Heat Source'],
  productProperties: ['None'],
  productLoad: 2.5,
  productLoadUnit: 'lbs/linear ft',
  productDimL: 8,
  productDimW: 4,
  productDimH: 3,
  operatingEnvTemp: -10,
  minOperatingEnvTemp: -30,
  maxOperatingEnvTemp: -5,
}

describe('getCompleteness', () => {
  it('reports 0% for an empty quick form', () => {
    const c = getCompleteness({ mode: 'quick' })
    expect(c.filled).toBe(0)
    expect(c.pct).toBe(0)
    expect(c.total).toBeGreaterThan(0)
    expect(c.canSubmit).toBe(false)
  })

  // The central guarantee of this module. Previously the bar hit 100% while
  // submit still failed, because the two lists were maintained separately.
  it('100% and a valid submission mean the same thing, in both modes', () => {
    for (const values of [VALID_QUICK, VALID_FULL]) {
      const c = getCompleteness(values)
      expect(c.pct, `mode=${values.mode}`).toBe(100)
      expect(c.missing).toEqual([])
      expect(formSchema.safeParse(values).success).toBe(true)
      expect(c.canSubmit).toBe(true)
    }
  })

  it('drops below 100% the moment any single required field is removed', () => {
    const c = getCompleteness(VALID_QUICK)
    for (const rule of [
      { field: 'name' },
      { field: 'drumValue' },
      { field: 'cageBarCapMaterial' },
    ] as const) {
      const without = { ...VALID_QUICK, [rule.field]: undefined }
      const cw = getCompleteness(without)
      expect(cw.pct, rule.field).toBeLessThan(100)
      expect(cw.filled).toBe(c.filled - 1)
      expect(cw.missing.map((m) => m.field)).toContain(rule.field)
    }
  })

  it('counts more required fields in full mode than quick mode', () => {
    expect(getCompleteness({ ...VALID_FULL, mode: 'full' }).total).toBeGreaterThan(
      getCompleteness({ ...VALID_QUICK, mode: 'quick' }).total,
    )
  })

  // These are the conditional "Other -> specify" fields the old module was
  // blind to, which is exactly how the bar reached a lying 100%.
  it('counts conditional "Other" specify fields that the old module missed', () => {
    const withOther: Partial<FormValues> = {
      ...VALID_QUICK,
      applicationType: 'Other',
    }
    const c = getCompleteness(withOther)
    expect(c.missing.map((m) => m.field)).toContain('applicationTypeOther')
    expect(c.pct).toBeLessThan(100)
    expect(formSchema.safeParse(withOther).success).toBe(false)
  })

  it('counts cage bar dimensions only when the drum is a cage', () => {
    const solid = getCompleteness(VALID_QUICK)
    const cage = getCompleteness({ ...VALID_QUICK, drumType: 'Cage' })
    expect(cage.total).toBe(solid.total + 3)
    expect(cage.missing.map((m) => m.field)).toEqual(
      expect.arrayContaining(['cageBarDimA', 'cageBarDimB', 'cageBarDimC']),
    )
  })

  it('counts spiral 2 fields only for a double-drum travel direction', () => {
    const single = getCompleteness(VALID_QUICK)
    const double = getCompleteness({ ...VALID_QUICK, travelDirection: 'Two Drum, One Belt' })
    expect(double.total).toBe(single.total + 4)
  })

  // 0 °F is a real reading, not a blank. A naive truthiness check breaks this.
  it('treats a numeric zero as answered', () => {
    const c = getCompleteness({ ...VALID_QUICK, incomingProductTemp: 0 })
    expect(c.missing.map((m) => m.field)).not.toContain('incomingProductTemp')
    expect(c.pct).toBe(100)
  })

  it('treats whitespace-only text as unanswered', () => {
    const c = getCompleteness({ ...VALID_QUICK, companyName: '   ' })
    expect(c.missing.map((m) => m.field)).toContain('companyName')
  })

  it('treats an empty array as unanswered', () => {
    const c = getCompleteness({ ...VALID_FULL, heatSource: [] })
    expect(c.missing.map((m) => m.field)).toContain('heatSource')
  })

  // 100% is necessary but not sufficient: a badly formatted email still fails.
  it('reports 100% but canSubmit=false when a format rule fails', () => {
    const c = getCompleteness({ ...VALID_QUICK, email: 'not-an-email' })
    expect(c.pct).toBe(100)
    expect(c.canSubmit).toBe(false)
  })

  it('gives every missing field a human-readable label', () => {
    const c = getCompleteness({ mode: 'quick' })
    for (const m of c.missing) {
      expect(m.label.length).toBeGreaterThan(0)
      expect(m.label).not.toBe(m.field)
      expect(m.section.length).toBeGreaterThan(0)
    }
  })
})

describe('deferred fields ("I don\'t know / measure later")', () => {
  it('counts a deferred field as answered rather than blocking the rep', () => {
    const without = { ...VALID_QUICK, takeUpTravelLength: undefined }
    expect(getCompleteness(without).pct).toBeLessThan(100)

    const deferred = { ...without, unknownFields: ['takeUpTravelLength'] }
    const c = getCompleteness(deferred)
    expect(c.pct).toBe(100)
    expect(c.deferredCount).toBe(1)
    expect(c.canSubmit).toBe(true)
    expect(formSchema.safeParse(deferred).success).toBe(true)
  })

  it('does not credit deferring a field that was never required', () => {
    const c = getCompleteness({ ...VALID_QUICK, unknownFields: ['beltLength'] })
    expect(c.deferredCount).toBe(0)
    expect(c.pct).toBe(100)
  })

  it('leaves the required total unchanged when a field is deferred', () => {
    const base = getCompleteness(VALID_QUICK)
    const deferred = getCompleteness({ ...VALID_QUICK, unknownFields: ['tierPitch'] })
    expect(deferred.total).toBe(base.total)
  })
})

describe('getSectionProgress', () => {
  it('returns one entry per section, all complete for a valid full form', () => {
    const progress = getSectionProgress(VALID_FULL)
    expect(progress).toHaveLength(5)
    for (const p of progress) {
      // The project section has no required fields at all.
      if (p.total > 0) expect(p.complete, p.id).toBe(true)
    }
  })

  it('marks an empty form as untouched everywhere', () => {
    for (const p of getSectionProgress({ mode: 'quick' })) {
      expect(p.untouched, p.id).toBe(true)
      expect(p.filled).toBe(0)
    }
  })

  it('marks only the section that was answered as touched', () => {
    const progress = getSectionProgress({ mode: 'quick', name: 'Jacob' })
    const personal = progress.find((p) => p.id === 'personal')!
    expect(personal.untouched).toBe(false)
    expect(personal.filled).toBe(1)
    expect(progress.filter((p) => p.id !== 'personal').every((p) => p.untouched)).toBe(true)
  })

  it('section totals add up to the overall required total', () => {
    const overall = getCompleteness(VALID_FULL)
    const summed = getSectionProgress(VALID_FULL).reduce((n, p) => n + p.total, 0)
    expect(summed).toBe(overall.total)
  })
})
