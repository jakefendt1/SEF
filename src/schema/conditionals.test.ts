import { describe, it, expect } from 'vitest'
import {
  isSpiral2Applicable,
  isFieldVisible,
  QUICK_MODE_FIELDS,
  isQuickModeField,
  getFullOnlyFields,
} from './conditionals'
import type { FormValues } from './formSchema'

// ── isSpiral2Applicable ────────────────────────────────────────────────────

describe('isSpiral2Applicable', () => {
  it('returns true for Two Drum, One Belt', () => {
    expect(isSpiral2Applicable('Two Drum, One Belt')).toBe(true)
  })

  it('returns true for One Drum, Two Belt', () => {
    expect(isSpiral2Applicable('One Drum, Two Belt')).toBe(true)
  })

  it('returns false for Upgo', () => {
    expect(isSpiral2Applicable('Upgo')).toBe(false)
  })

  it('returns false for Downgo', () => {
    expect(isSpiral2Applicable('Downgo')).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isSpiral2Applicable(undefined)).toBe(false)
  })
})

// ── isFieldVisible — Other/specify conditionals ───────────────────────────

describe('applicationTypeOther visibility', () => {
  it('visible when applicationType is Other', () => {
    expect(isFieldVisible('applicationTypeOther', { applicationType: 'Other' })).toBe(true)
  })

  it('hidden when applicationType is Freezer', () => {
    expect(isFieldVisible('applicationTypeOther', { applicationType: 'Freezer' })).toBe(false)
  })

  it('hidden when applicationType is undefined', () => {
    expect(isFieldVisible('applicationTypeOther', {})).toBe(false)
  })
})

describe('heatSourceSpecify visibility', () => {
  it('visible when heatSource includes Other Heat Source', () => {
    expect(isFieldVisible('heatSourceSpecify', { heatSource: ['Other Heat Source'] })).toBe(true)
  })

  it('visible when heatSource has Other Heat Source alongside other selections', () => {
    expect(isFieldVisible('heatSourceSpecify', { heatSource: ['Oven', 'Other Heat Source'] })).toBe(true)
  })

  it('hidden when heatSource does not include Other Heat Source', () => {
    expect(isFieldVisible('heatSourceSpecify', { heatSource: ['Oven', 'Fryer'] })).toBe(false)
  })

  it('hidden when heatSource is undefined', () => {
    expect(isFieldVisible('heatSourceSpecify', {})).toBe(false)
  })
})

describe('preferredBeltSeriesOther visibility', () => {
  it('visible when preferredBeltSeries is Other', () => {
    expect(isFieldVisible('preferredBeltSeriesOther', { preferredBeltSeries: 'Other' })).toBe(true)
  })

  it('hidden when preferredBeltSeries is 2400', () => {
    expect(isFieldVisible('preferredBeltSeriesOther', { preferredBeltSeries: '2400' })).toBe(false)
  })
})

describe('beltAccessoriesOther visibility', () => {
  it('visible when beltAccessories includes Other', () => {
    expect(isFieldVisible('beltAccessoriesOther', { beltAccessories: ['Other'] })).toBe(true)
  })

  it('hidden when beltAccessories does not include Other', () => {
    expect(isFieldVisible('beltAccessoriesOther', { beltAccessories: ['Friction'] })).toBe(false)
  })
})

// ── isFieldVisible — Spiral 2 conditionals ───────────────────────────────

describe('Spiral 2 field visibility', () => {
  const spiral2Fields: Array<keyof FormValues> = [
    'distanceBetweenDrums',
    'numTiersSpiral2',
    'configurationSpiral2',
    'returnTypeSpiral2',
  ]

  for (const field of spiral2Fields) {
    it(`${field} is visible for Two Drum, One Belt`, () => {
      expect(isFieldVisible(field, { travelDirection: 'Two Drum, One Belt' })).toBe(true)
    })

    it(`${field} is visible for One Drum, Two Belt`, () => {
      expect(isFieldVisible(field, { travelDirection: 'One Drum, Two Belt' })).toBe(true)
    })

    it(`${field} is hidden for Upgo`, () => {
      expect(isFieldVisible(field, { travelDirection: 'Upgo' })).toBe(false)
    })

    it(`${field} is hidden when travelDirection is undefined`, () => {
      expect(isFieldVisible(field, {})).toBe(false)
    })
  }
})

// ── isFieldVisible — System Details conditionals ──────────────────────────

describe('carrywayWearstripMaterialOther visibility', () => {
  it('visible when material is Other', () => {
    expect(isFieldVisible('carrywayWearstripMaterialOther', { carrywayWearstripMaterial: 'Other' })).toBe(true)
  })

  it('hidden when material is UHMW', () => {
    expect(isFieldVisible('carrywayWearstripMaterialOther', { carrywayWearstripMaterial: 'UHMW' })).toBe(false)
  })
})

describe('Cage Bar Dimensions visibility', () => {
  const cageFields: Array<keyof FormValues> = ['cageBarDimA', 'cageBarDimB', 'cageBarDimC']

  for (const field of cageFields) {
    it(`${field} is visible when drumType is Cage`, () => {
      expect(isFieldVisible(field, { drumType: 'Cage' })).toBe(true)
    })

    it(`${field} is hidden when drumType is Solid`, () => {
      expect(isFieldVisible(field, { drumType: 'Solid' })).toBe(false)
    })

    it(`${field} is hidden when drumType is undefined`, () => {
      expect(isFieldVisible(field, {})).toBe(false)
    })
  }
})

describe('cageBarCapMaterialOther visibility', () => {
  it('visible when cageBarCapMaterial is Other', () => {
    expect(isFieldVisible('cageBarCapMaterialOther', { cageBarCapMaterial: 'Other' })).toBe(true)
  })

  it('hidden when cageBarCapMaterial is UHMW', () => {
    expect(isFieldVisible('cageBarCapMaterialOther', { cageBarCapMaterial: 'UHMW' })).toBe(false)
  })
})

describe('capProfileOther visibility', () => {
  it('visible when capProfile is Other', () => {
    expect(isFieldVisible('capProfileOther', { capProfile: 'Other' })).toBe(true)
  })

  it('hidden when capProfile is Flat', () => {
    expect(isFieldVisible('capProfileOther', { capProfile: 'Flat' })).toBe(false)
  })
})

// ── isFieldVisible — unknown fields always visible ────────────────────────

describe('isFieldVisible for always-visible fields', () => {
  it('returns true for spiralManufacturer (no conditional)', () => {
    expect(isFieldVisible('spiralManufacturer', {})).toBe(true)
  })

  it('returns true for beltSpeed (no conditional)', () => {
    expect(isFieldVisible('beltSpeed', {})).toBe(true)
  })
})

// ── Quick / Full partition ─────────────────────────────────────────────────

describe('Quick-mode field partition', () => {
  it('System Information fields are in Quick mode', () => {
    const sysInfoFields: Array<keyof FormValues> = [
      'spiralManufacturer', 'travelDirection', 'rotationDirection',
      'numTiersSpiral1', 'tierPitch', 'beltLength', 'drumBasis',
      'drumValue', 'beltWidth', 'configurationSpiral1', 'returnTypeSpiral1',
    ]
    for (const f of sysInfoFields) {
      expect(isQuickModeField(f), `${f} should be Quick mode`).toBe(true)
    }
  })

  it('System Details fields are in Quick mode', () => {
    const sysDetailFields: Array<keyof FormValues> = [
      'numRails', 'railSpacing', 'overhang', 'carrywayWearstripMaterial',
      'drumType', 'cageBarCapMaterial',
    ]
    for (const f of sysDetailFields) {
      expect(isQuickModeField(f), `${f} should be Quick mode`).toBe(true)
    }
  })

  it('Customer essentials are in Quick mode', () => {
    expect(isQuickModeField('name')).toBe(true)
    expect(isQuickModeField('companyName')).toBe(true)
    expect(isQuickModeField('email')).toBe(true)
    expect(isQuickModeField('phone')).toBe(true)
  })

  it('Address / title fields are NOT in Quick mode', () => {
    const fullOnlyPersonalInfo: Array<keyof FormValues> = [
      'title', 'countryOrRegion', 'address', 'city', 'stateProvince', 'zipPostalCode',
    ]
    for (const f of fullOnlyPersonalInfo) {
      expect(isQuickModeField(f), `${f} should NOT be Quick mode`).toBe(false)
    }
  })

  it('Project Information fields are NOT in Quick mode', () => {
    const projectFields: Array<keyof FormValues> = [
      'projectNumber', 'endUserName', 'endUserCity', 'endUserState', 'lineId',
    ]
    for (const f of projectFields) {
      expect(isQuickModeField(f), `${f} should NOT be Quick mode`).toBe(false)
    }
  })

  it('Quick mode fields are a strict subset of all form fields', () => {
    const fullOnlyFields = getFullOnlyFields()
    for (const f of fullOnlyFields) {
      expect(QUICK_MODE_FIELDS.has(f), `${f} appears in both Quick and Full-only`).toBe(false)
    }
  })

  it('Application essentials are in Quick mode', () => {
    expect(isQuickModeField('installationType')).toBe(true)
    expect(isQuickModeField('applicationType')).toBe(true)
    expect(isQuickModeField('productProcessed')).toBe(true)
    expect(isQuickModeField('incomingProductTemp')).toBe(true)
    expect(isQuickModeField('beltSpeed')).toBe(true)
  })

  it('Full-only Application fields are not in Quick mode', () => {
    expect(isQuickModeField('howProductCarried')).toBe(false)
    expect(isQuickModeField('heatSource')).toBe(false)
    expect(isQuickModeField('productProperties')).toBe(false)
    expect(isQuickModeField('productLoad')).toBe(false)
  })
})
