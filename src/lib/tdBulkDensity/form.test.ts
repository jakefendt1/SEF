import { describe, expect, it } from 'vitest'
import {
  applyPreset,
  convertForm,
  formToInputs,
  initialForm,
  inputsKey,
  inputsToForm,
  missingFields,
  reconcile,
  type TdForm,
} from './form'
import { bulkDensityLbFt3, reposeFromPile } from './helpers'

function filled(overrides: Partial<TdForm> = {}): TdForm {
  return {
    ...initialForm(),
    beltWidth: '12',
    incline: '52',
    flightHeightText: '5',
    flightSpacing: '8',
    density: '7.9',
    repose: '35',
    smallestDim: '1',
    ...overrides,
  }
}

describe('form', () => {
  it('opens with no application numbers: nothing to compute until the rep enters them', () => {
    const f = initialForm()
    expect(formToInputs(f)).toBeNull()
    expect(missingFields(f)).toContain('Belt width')
    expect(f.guardClearance).toBe('')
  })

  it('a typed 0 is an answer, not a blank', () => {
    const f = filled({ repose: '0' })
    expect(missingFields(f)).not.toContain('Angle of repose')
    expect(formToInputs(f)?.reposeDeg).toBe(0)
  })

  it('a blank guard clearance stays null rather than a guess', () => {
    const inputs = formToInputs(filled({ containment: 'guards' }))
    expect(inputs?.guardClearanceIn).toBeNull()
  })

  it('switching to metric and back changes no value', () => {
    const f = filled({ speed: '60', target: '2625', inclineLength: '20' })
    const there = convertForm(f, 'metric')
    expect(there.beltWidth).toBe('304.8')
    expect(there.density).toBe('126.55')
    const back = convertForm(there, 'imperial')
    expect(back.speed).toBe('60')
    expect(back.beltWidth).toBe('12')
    expect(back.density).toBe('7.9')
    const a = formToInputs(f)!
    const b = formToInputs(back)!
    for (const k of ['beltWidthIn', 'densityLbFt3', 'beltSpeedFpm', 'targetLbPerHr', 'inclineLengthFt'] as const) {
      expect(b[k]!).toBeCloseTo(a[k]!, 2)
    }
  })

  it('metric input is converted to canonical units for the engine', () => {
    const f = convertForm(filled(), 'metric')
    expect(formToInputs(f)!.flightSpacingIn).toBeCloseTo(8, 3)
  })

  it('fixed-height flights read their height from the dropdown, in inches', () => {
    const f = reconcile(filled({ flightType: 'scoop', flightHeightChoice: '5' }))
    expect(formToInputs(f)!.flightHeightIn).toBe(5)
    const bad = reconcile(filled({ flightType: 'scoop', flightHeightChoice: '4.5' }))
    expect(bad.flightHeightChoice).toBe('')
  })

  it('reconcile drops an unavailable sidewall height and S8026 sidewalls', () => {
    const f = reconcile(filled({ series: 'S8140', containment: 'sidewalls', sidewallPitch: '50mm', sidewallHeight: '6' }))
    expect(f.sidewallPitch).toBe('40mm')
    expect(f.sidewallHeight).toBe('')
    expect(reconcile(filled({ series: 'S8026', containment: 'sidewalls' })).containment).toBe('open')
  })

  it('a preset fills density, repose and size in the current units', () => {
    const f = applyPreset(convertForm(filled(), 'metric'), 'kettle-chips')
    expect(f.repose).toBe('40')
    expect(formToInputs(f)!.densityLbFt3).toBeCloseTo(8, 2)
  })

  it('identifies the same inputs whatever the key order', () => {
    const a = formToInputs(filled())!
    const shuffled = Object.fromEntries(Object.entries(a).reverse()) as typeof a
    expect(inputsKey(shuffled)).toBe(inputsKey(a))
    expect(inputsKey({ ...a, beltWidthIn: 13 })).not.toBe(inputsKey(a))
  })

  it('round-trips through saved inputs', () => {
    const a = formToInputs(filled({ flightType: 'deg90', notchCount: '1' }))!
    const b = formToInputs(inputsToForm(a, 'imperial'))!
    expect(b).toEqual(a)
  })
})

describe('measurement helpers', () => {
  it('bulk density from a 1 gal pail holding 0.5 lb', () => {
    expect(bulkDensityLbFt3(1, 'gal', 0.5, 'lb')).toBeCloseTo(3.74, 2)
    expect(bulkDensityLbFt3(1, 'gal', 0, 'lb')).toBeNull()
  })
  it('repose from a pile: h = D/2 is 45°', () => {
    expect(reposeFromPile(5, 10)).toBeCloseTo(45, 9)
    expect(reposeFromPile(null, 10)).toBeNull()
  })
})
