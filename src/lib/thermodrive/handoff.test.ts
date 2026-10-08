import { describe, expect, it } from 'vitest'
import { makeInputs } from '../tdBulkDensity/defaults'
import { formToInputs, initialForm, inputsToForm, reconcile } from '../tdBulkDensity/form'
import type { TdInputs } from '../tdBulkDensity/types'
import { freshBelt, newVar, type TdBelt } from './belt'
import { IN, PITCH_MM } from './data'
import {
  applyHandoffToForm,
  beltFromHandoff,
  bulkDensityBlocker,
  decodeHandoff,
  encodeHandoff,
  handoffFromBelt,
  handoffFromForm,
} from './handoff'

const BELT_FIELDS = [
  'series',
  'beltWidthIn',
  'flightType',
  'flightHeightIn',
  'flightThicknessIn',
  'flightSpacingIn',
  'containment',
  'notchCount',
  'notchWidthIn',
  'sidewallPitch',
  'sidewallHeightIn',
  'sidewallIndentIn',
  'sidewallGapIn',
] as const satisfies readonly (keyof TdInputs)[]

const beltOf = (i: TdInputs) => Object.fromEntries(BELT_FIELDS.map((k) => [k, typeof i[k] === 'number' ? Math.round((i[k] as number) * 1000) / 1000 : i[k]]))

describe('Bulk Density <-> Belt Configurator hand-off', () => {
  it('H1: a Bulk Density belt opened in the configurator and sent back is unchanged', () => {
    const original = makeInputs({
      series: 'S8050',
      beltWidthIn: 24,
      flightType: 'scoop',
      flightHeightIn: 4,
      flightThicknessIn: 0.28,
      flightSpacingIn: 4 * (PITCH_MM['8050'] / IN),
      containment: 'sidewalls',
      sidewallPitch: '50mm',
      sidewallHeightIn: 3,
      sidewallIndentIn: 0.5,
      sidewallGapIn: 0.25,
      notchCount: 2,
      notchWidthIn: 1,
      inclineDeg: 45,
      densityLbFt3: 22,
      reposeDeg: 30,
    })
    const form = inputsToForm(original, 'imperial')
    const out = handoffFromForm(form)!
    const opened = beltFromHandoff(decodeHandoff(encodeHandoff(out))!)
    const back = handoffFromBelt(opened.belt)
    const returned = formToInputs(reconcile(applyHandoffToForm(form, decodeHandoff(encodeHandoff(back.handoff))!)))!
    expect(beltOf(returned)).toEqual(beltOf(original))
    // The product and incline never crossed over and are still there.
    expect(returned.densityLbFt3).toBe(22)
    expect(returned.inclineDeg).toBe(45)
  })

  it('H2: a configurator belt sent to Bulk Density and back keeps its product code, start row and length', () => {
    const p = PITCH_MM['8140']
    const belt: TdBelt = {
      ...freshBelt('8140'),
      style: 'Single-Lug Flat Top E (10.5 mm)',
      material: 'Polyurethane A23',
      color: 'White',
      widthMm: 30 * IN,
      lengthMm: 200 * p,
      flightSpacingMm: 5 * p,
      vars: [{ ...newVar(3.5), heightMm: 3 * IN, indentLMm: 1.5 * IN, indentRMm: 1.5 * IN }],
    }
    const { handoff } = handoffFromBelt(belt)
    const form = reconcile(applyHandoffToForm(initialForm(), handoff))
    const again = beltFromHandoff(handoffFromForm(form, handoff)!).belt
    expect({ style: again.style, material: again.material, color: again.color, startRow: again.vars[0].startRow }).toEqual({
      style: belt.style,
      material: belt.material,
      color: belt.color,
      startRow: 3.5,
    })
    expect(again.lengthMm).toBeCloseTo(belt.lengthMm, 2)
    expect(again.widthMm).toBeCloseTo(belt.widthMm, 2)
    expect(again.vars[0].heightMm).toBeCloseTo(belt.vars[0].heightMm, 2)
    expect(again.flightSpacingMm).toBeCloseTo(belt.flightSpacingMm, 1)
    expect(again.vars[0].indentLMm).toBeCloseTo(belt.vars[0].indentLMm, 2)
  })

  it('H3: 8126 cannot go to Bulk Density, and says why', () => {
    expect(bulkDensityBlocker('8126')).toMatch(/8126/)
    expect(bulkDensityBlocker('8050')).toBeNull()
  })

  it('H4: a mangled link opens nothing rather than a wrong belt', () => {
    expect(decodeHandoff('not-a-belt')).toBeNull()
    expect(decodeHandoff('')).toBeNull()
    expect(decodeHandoff(encodeHandoff({ ...handoffFromBelt({ ...freshBelt('8050'), widthMm: 100, vars: [{ ...newVar(2), heightMm: 50 }] }).handoff, widthIn: 0 }))).toBeNull()
  })

  it('H5: the belt needs a width, flight height and spacing before it can go', () => {
    expect(handoffFromForm(initialForm())).toBeNull()
  })
})
