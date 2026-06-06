import { describe, it, expect } from 'vitest'
import { formSchema } from './formSchema'
import type { FormValues } from './formSchema'

// Minimal valid Quick submission (customer essentials required)
const VALID_QUICK_CORE: Partial<FormValues> = {
  mode: 'quick',
  // Customer essentials — required in both modes
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
  beltLength: 150,
  drumBasis: 'Diameter',
  drumValue: 24,
  beltWidth: 12,
  infeedLength: 5,
  dischargeLength: 5,
  configurationSpiral1: '360°',
  returnTypeSpiral1: 'Drum',
  numRails: '3',
  railSpacing: 4,
  overhang: 1,
  carrywayWearstripMaterial: 'UHMW',
  drumType: 'Solid',
  cageBarCapMaterial: 'UHMW',
}

// Minimal valid Full submission (all required fields populated)
const VALID_FULL_CORE: FormValues = {
  ...(VALID_QUICK_CORE as FormValues),
  mode: 'full',
  name: 'Jacob Fendt',
  title: 'Sales Rep',
  phone: '555-123-4567',
  email: 'jacob@intralox.com',
  companyName: 'Intralox',
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

function errorsFor(data: Partial<FormValues>): string[] {
  const result = formSchema.safeParse(data)
  if (result.success) return []
  return result.error.issues.map((i) => i.path.join('.') + ': ' + i.message)
}

function hasErrorOn(data: Partial<FormValues>, field: keyof FormValues): boolean {
  const result = formSchema.safeParse(data)
  if (result.success) return false
  return result.error.issues.some((i) => i.path[0] === field)
}

// ── Temperature ────────────────────────────────────────────────────────────

describe('temperature fields accept negative values', () => {
  it('incomingProductTemp: -40°F is valid', () => {
    expect(formSchema.safeParse(VALID_QUICK_CORE).success).toBe(true)
  })

  it('operating temps: deeply negative values are valid in full mode', () => {
    const data: FormValues = {
      ...VALID_FULL_CORE,
      incomingProductTemp: -40,
      operatingEnvTemp: -35,
      minOperatingEnvTemp: -50,
      maxOperatingEnvTemp: -10,
    }
    expect(formSchema.safeParse(data).success).toBe(true)
  })

  it('zero °F is valid', () => {
    const data = { ...VALID_FULL_CORE, incomingProductTemp: 0 }
    expect(formSchema.safeParse(data).success).toBe(true)
  })
})

// ── Required-set per mode ──────────────────────────────────────────────────

describe('Quick mode — customer essentials required, address/title/phone not required', () => {
  it('passes with name, companyName, email and system fields', () => {
    expect(formSchema.safeParse(VALID_QUICK_CORE).success).toBe(true)
  })

  it('fails without name in quick mode', () => {
    const data = { ...VALID_QUICK_CORE, name: undefined }
    expect(hasErrorOn(data, 'name')).toBe(true)
  })

  it('fails without companyName in quick mode', () => {
    const data = { ...VALID_QUICK_CORE, companyName: undefined }
    expect(hasErrorOn(data, 'companyName')).toBe(true)
  })

  it('fails without email in quick mode', () => {
    const data = { ...VALID_QUICK_CORE, email: undefined }
    expect(hasErrorOn(data, 'email')).toBe(true)
  })

  it('does not require address/city/state in quick mode', () => {
    expect(hasErrorOn(VALID_QUICK_CORE, 'address')).toBe(false)
    expect(hasErrorOn(VALID_QUICK_CORE, 'city')).toBe(false)
    expect(hasErrorOn(VALID_QUICK_CORE, 'stateProvince')).toBe(false)
  })

  it('does not require phone in quick mode', () => {
    expect(hasErrorOn(VALID_QUICK_CORE, 'phone')).toBe(false)
  })

  it('does not require howProductCarried', () => {
    expect(hasErrorOn(VALID_QUICK_CORE, 'howProductCarried')).toBe(false)
  })

  it('does not require heatSource', () => {
    expect(hasErrorOn(VALID_QUICK_CORE, 'heatSource')).toBe(false)
  })

  it('does not require productLoad', () => {
    expect(hasErrorOn(VALID_QUICK_CORE, 'productLoad')).toBe(false)
  })
})

describe('Full mode — address/title/phone required on top of Quick', () => {
  it('fails without name in full mode (same as quick)', () => {
    const data = { ...VALID_FULL_CORE, name: undefined }
    expect(hasErrorOn(data, 'name')).toBe(true)
  })

  it('fails without email in full mode (same as quick)', () => {
    const data = { ...VALID_FULL_CORE, email: undefined }
    expect(hasErrorOn(data, 'email')).toBe(true)
  })

  it('fails with invalid email format', () => {
    const data = { ...VALID_FULL_CORE, email: 'not-an-email' }
    expect(hasErrorOn(data, 'email')).toBe(true)
  })

  it('passes with valid email', () => {
    const data = { ...VALID_FULL_CORE, email: 'rep@intralox.com' }
    expect(formSchema.safeParse(data).success).toBe(true)
  })

  it('fails without phone in full mode', () => {
    const data = { ...VALID_FULL_CORE, phone: undefined }
    expect(hasErrorOn(data, 'phone')).toBe(true)
  })

  it('fails without address in full mode', () => {
    const data = { ...VALID_FULL_CORE, address: undefined }
    expect(hasErrorOn(data, 'address')).toBe(true)
  })

  it('fails without heatSource in full mode', () => {
    const data = { ...VALID_FULL_CORE, heatSource: undefined }
    expect(hasErrorOn(data, 'heatSource')).toBe(true)
  })

  it('fails without productLoad in full mode', () => {
    const data = { ...VALID_FULL_CORE, productLoad: undefined }
    expect(hasErrorOn(data, 'productLoad')).toBe(true)
  })

  it('passes a complete full-mode submission', () => {
    const errors = errorsFor(VALID_FULL_CORE)
    expect(errors).toEqual([])
  })
})

// ── System Info / System Details — required in both modes ─────────────────

describe('System Information required in both modes', () => {
  it('fails without spiralManufacturer in quick mode', () => {
    const data = { ...VALID_QUICK_CORE, spiralManufacturer: undefined }
    expect(hasErrorOn(data, 'spiralManufacturer')).toBe(true)
  })

  it('fails without beltLength in quick mode', () => {
    const data = { ...VALID_QUICK_CORE, beltLength: undefined }
    expect(hasErrorOn(data, 'beltLength')).toBe(true)
  })

  it('fails without drumBasis in full mode', () => {
    const data = { ...VALID_FULL_CORE, drumBasis: undefined }
    expect(hasErrorOn(data, 'drumBasis')).toBe(true)
  })
})

describe('System Details required in both modes', () => {
  it('fails without numRails in quick mode', () => {
    const data = { ...VALID_QUICK_CORE, numRails: undefined }
    expect(hasErrorOn(data, 'numRails')).toBe(true)
  })

  it('fails without drumType in full mode', () => {
    const data = { ...VALID_FULL_CORE, drumType: undefined }
    expect(hasErrorOn(data, 'drumType')).toBe(true)
  })
})

// ── Conditional required fields ────────────────────────────────────────────

describe('applicationTypeOther is required when applicationType = Other', () => {
  it('required when Other is selected and specify is empty', () => {
    const data = { ...VALID_QUICK_CORE, applicationType: 'Other' as const }
    expect(hasErrorOn(data, 'applicationTypeOther')).toBe(true)
  })

  it('passes when Other is selected and specify is filled', () => {
    const data = {
      ...VALID_QUICK_CORE,
      applicationType: 'Other' as const,
      applicationTypeOther: 'Custom type',
    }
    expect(hasErrorOn(data, 'applicationTypeOther')).toBe(false)
  })

  it('not required when applicationType is not Other', () => {
    expect(hasErrorOn(VALID_QUICK_CORE, 'applicationTypeOther')).toBe(false)
  })
})

describe('Cage Bar Dimensions required when drumType = Cage', () => {
  it('requires cageBarDimA/B/C when drumType is Cage', () => {
    const data = { ...VALID_QUICK_CORE, drumType: 'Cage' as const }
    expect(hasErrorOn(data, 'cageBarDimA')).toBe(true)
    expect(hasErrorOn(data, 'cageBarDimB')).toBe(true)
    expect(hasErrorOn(data, 'cageBarDimC')).toBe(true)
  })

  it('does not require cage dims when drumType is Solid', () => {
    expect(hasErrorOn(VALID_QUICK_CORE, 'cageBarDimA')).toBe(false)
  })

  it('passes when Cage is selected and all dims are provided', () => {
    const data = {
      ...VALID_QUICK_CORE,
      drumType: 'Cage' as const,
      cageBarDimA: 0.5,
      cageBarDimB: 0.5,
      cageBarDimC: 0.5,
    }
    expect(hasErrorOn(data, 'cageBarDimA')).toBe(false)
  })
})

describe('Spiral 2 fields required for double-drum travel direction', () => {
  const doubleDrumBase = {
    ...VALID_QUICK_CORE,
    travelDirection: 'Two Drum, One Belt' as const,
    distanceBetweenDrums: 10,
    numTiersSpiral2: 20,
    configurationSpiral2: '360°' as const,
    returnTypeSpiral2: 'Drum' as const,
  }

  it('passes with all Spiral 2 fields for double-drum direction', () => {
    expect(formSchema.safeParse(doubleDrumBase).success).toBe(true)
  })

  it('requires numTiersSpiral2 for Two Drum, One Belt', () => {
    const data = { ...doubleDrumBase, numTiersSpiral2: undefined }
    expect(hasErrorOn(data, 'numTiersSpiral2')).toBe(true)
  })

  it('requires distanceBetweenDrums for double-drum direction', () => {
    const data = { ...doubleDrumBase, distanceBetweenDrums: undefined }
    expect(hasErrorOn(data, 'distanceBetweenDrums')).toBe(true)
  })

  it('does not require Spiral 2 fields for Upgo', () => {
    expect(hasErrorOn(VALID_QUICK_CORE, 'numTiersSpiral2')).toBe(false)
    expect(hasErrorOn(VALID_QUICK_CORE, 'distanceBetweenDrums')).toBe(false)
  })

  it('triggers for One Drum, Two Belt as well', () => {
    const data = {
      ...VALID_QUICK_CORE,
      travelDirection: 'One Drum, Two Belt' as const,
    }
    expect(hasErrorOn(data, 'numTiersSpiral2')).toBe(true)
  })
})

// ── Heat source mutual exclusivity ─────────────────────────────────────────

describe('Heat source constraints', () => {
  it('rejects No Heat Source combined with other selections', () => {
    const data = {
      ...VALID_FULL_CORE,
      heatSource: ['No Heat Source', 'Oven'] as Array<'No Heat Source' | 'Oven'>,
    }
    expect(hasErrorOn(data, 'heatSource')).toBe(true)
  })

  it('accepts No Heat Source alone', () => {
    const data = { ...VALID_FULL_CORE, heatSource: ['No Heat Source' as const] }
    expect(hasErrorOn(data, 'heatSource')).toBe(false)
  })

  it('accepts multiple non-exclusive selections', () => {
    const data = {
      ...VALID_FULL_CORE,
      heatSource: ['Oven', 'Fryer'] as Array<'Oven' | 'Fryer'>,
    }
    expect(hasErrorOn(data, 'heatSource')).toBe(false)
  })

  it('requires heatSourceSpecify when Other Heat Source is selected', () => {
    const data = {
      ...VALID_FULL_CORE,
      heatSource: ['Other Heat Source' as const],
      heatSourceSpecify: undefined,
    }
    expect(hasErrorOn(data, 'heatSourceSpecify')).toBe(true)
  })

  it('passes when Other Heat Source has a specify value', () => {
    const data = {
      ...VALID_FULL_CORE,
      heatSource: ['Other Heat Source' as const],
      heatSourceSpecify: 'Steam injection',
    }
    expect(hasErrorOn(data, 'heatSourceSpecify')).toBe(false)
  })
})

// ── Product Properties None mutual exclusivity ────────────────────────────

describe('Product Properties None constraint', () => {
  it('rejects None combined with other properties', () => {
    const data = {
      ...VALID_FULL_CORE,
      productProperties: ['None', 'Glazing'] as Array<'None' | 'Glazing'>,
    }
    expect(hasErrorOn(data, 'productProperties')).toBe(true)
  })

  it('accepts None alone', () => {
    const data = { ...VALID_FULL_CORE, productProperties: ['None' as const] }
    expect(hasErrorOn(data, 'productProperties')).toBe(false)
  })
})
