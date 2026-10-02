// The form as the person types it, and its translation into engine inputs.
//
// Typed fields hold text in the current unit system, so "0" stays an answer
// and a half-typed "1." isn't reformatted under the user's thumb. Fields fed
// by a dropdown (fixed flight heights, thickness, sidewall height) hold
// canonical inches, because a rounded metric label must never be parsed back
// into a height the table doesn't list (2.3 in -> "58 mm" -> 2.283 in).
import { parseMeasurement } from '../measurement'
import {
  DEFAULT_DYNAMIC_DERATE_DEG,
  DEFAULT_FILL_PCT,
  DEFAULT_HOLD_DOWN_WIDTH_IN,
  DEFAULT_WALL_FRICTION,
  MIN_INDENT_IN,
  MIN_SIDEWALL_GAP_IN,
  MIN_SIDEWALL_INDENT_IN,
  STANDARD_NOTCH_IN,
} from './data/indents'
import { FLIGHT_TYPES } from './data/flights'
import { findPreset } from './data/products'
import { sidewallHeights, sidewallPitches } from './data/sidewalls'
import type { Containment, FlightType, Point, Series, SidewallPitch, TdInputs, WidthModel } from './types'
import { buildWidthModel } from './width'
import { decimalsFor, fromCanonical, toCanonical, trimNumber, type Quantity, type UnitSystem } from './units'

export interface TdForm {
  system: UnitSystem
  series: Series
  beltWidth: string
  incline: string
  inclineLength: string
  target: string
  speed: string

  flightType: FlightType
  /** Typed height for 90° flights, current unit. */
  flightHeightText: string
  /** Chosen height for fixed-height flights, canonical inches. */
  flightHeightChoice: string
  /** Canonical inches. */
  flightThickness: string
  flightSpacing: string

  containment: Containment
  indentLeft: string
  indentRight: string
  holdDownWidth: string
  rollerLimiters: boolean
  guardClearance: string
  notchCount: string
  notchWidth: string
  sidewallPitch: SidewallPitch
  /** Canonical inches. */
  sidewallHeight: string
  sidewallIndent: string
  sidewallGap: string

  productPreset: string
  density: string
  repose: string
  smallestDim: string
  fill: string
  derate: string
  maxSpeed: string
  wallFriction: string

  calcLabMode: boolean
  profileOverride: Point[] | null
}

/** Typed fields and what they measure. The one home for field labels. */
export const FIELD_DEFS = {
  beltWidth: { label: 'Belt width', q: 'length' },
  incline: { label: 'Incline angle', q: 'angle' },
  inclineLength: { label: 'Incline length', q: 'lengthFt' },
  target: { label: 'Target throughput', q: 'massRate' },
  speed: { label: 'Belt speed', q: 'speed' },
  flightHeightText: { label: 'Flight height', q: 'length' },
  flightSpacing: { label: 'Flight spacing', q: 'length' },
  indentLeft: { label: 'Left indent', q: 'length' },
  indentRight: { label: 'Right indent', q: 'length' },
  holdDownWidth: { label: 'Hold-down width', q: 'length' },
  guardClearance: { label: 'Guard clearance', q: 'length' },
  notchCount: { label: 'Notches', q: 'count' },
  notchWidth: { label: 'Notch width', q: 'length' },
  sidewallIndent: { label: 'Sidewall indent', q: 'length' },
  sidewallGap: { label: 'Sidewall-to-flight gap', q: 'length' },
  density: { label: 'Bulk density', q: 'density' },
  repose: { label: 'Angle of repose', q: 'angle' },
  smallestDim: { label: 'Smallest product dimension', q: 'length' },
  fill: { label: 'Fill factor', q: 'pct' },
  derate: { label: 'Dynamic derate', q: 'angle' },
  maxSpeed: { label: 'Product max belt speed', q: 'speed' },
  wallFriction: { label: 'Product-on-guard friction', q: 'count' },
} as const satisfies Record<string, { label: string; q: Quantity }>

export type TypedField = keyof typeof FIELD_DEFS

const inch = (v: number) => trimNumber(v, 4)

export function initialForm(): TdForm {
  return {
    system: 'imperial',
    series: 'S8050',
    beltWidth: '',
    incline: '',
    inclineLength: '',
    target: '',
    speed: '',
    flightType: 'deg90',
    flightHeightText: '',
    flightHeightChoice: '',
    flightThickness: inch(0.16),
    flightSpacing: '',
    containment: 'open',
    indentLeft: inch(MIN_INDENT_IN),
    indentRight: inch(MIN_INDENT_IN),
    holdDownWidth: inch(DEFAULT_HOLD_DOWN_WIDTH_IN),
    rollerLimiters: false,
    // Deliberately blank: the guard gap decides whether guards hold product,
    // and an invented default would decide it for the rep.
    guardClearance: '',
    notchCount: '0',
    notchWidth: inch(STANDARD_NOTCH_IN),
    sidewallPitch: '50mm',
    sidewallHeight: '',
    sidewallIndent: inch(MIN_SIDEWALL_INDENT_IN),
    sidewallGap: inch(MIN_SIDEWALL_GAP_IN),
    productPreset: '',
    density: '',
    repose: '',
    smallestDim: '',
    fill: String(DEFAULT_FILL_PCT),
    derate: String(DEFAULT_DYNAMIC_DERATE_DEG),
    maxSpeed: '',
    wallFriction: String(DEFAULT_WALL_FRICTION),
    calcLabMode: false,
    profileOverride: null,
  }
}

function num(text: string): number | null {
  const v = parseMeasurement(text)
  return v === null || !Number.isFinite(v) ? null : v
}

/** A typed field's canonical value, or null when blank or unreadable. */
export function readField(form: TdForm, field: TypedField): number | null {
  const v = num(form[field])
  if (v === null) return null
  return toCanonical(v, FIELD_DEFS[field].q, form.system)
}

/** Text to put in a typed field for a canonical value. */
export function fieldText(value: number, field: TypedField, system: UnitSystem): string {
  const q = FIELD_DEFS[field].q
  const dp = q === 'length' ? (system === 'metric' ? 1 : 3) : Math.max(decimalsFor(q, system), 2)
  return trimNumber(fromCanonical(value, q, system), dp)
}

export function flightHeightIn(form: TdForm): number | null {
  if (FLIGHT_TYPES[form.flightType].heights) return num(form.flightHeightChoice)
  return readField(form, 'flightHeightText')
}

export type StepId = 'conveyor' | 'flights' | 'edges' | 'product' | 'results'

export const STEPS: { id: StepId; title: string }[] = [
  { id: 'conveyor', title: 'Conveyor' },
  { id: 'flights', title: 'Flights' },
  { id: 'edges', title: 'Edges' },
  { id: 'product', title: 'Product' },
  { id: 'results', title: 'Results' },
]

/** Which required fields are still blank, with the step each lives on. */
export function missingByStep(form: TdForm): { label: string; step: StepId }[] {
  const missing: { label: string; step: StepId }[] = []
  let step: StepId = 'conveyor'
  const need = (ok: boolean, label: string) => {
    if (!ok) missing.push({ label, step })
  }
  need(readField(form, 'beltWidth') !== null, FIELD_DEFS.beltWidth.label)
  need(readField(form, 'incline') !== null, FIELD_DEFS.incline.label)
  step = 'flights'
  need(flightHeightIn(form) !== null, FIELD_DEFS.flightHeightText.label)
  need(readField(form, 'flightSpacing') !== null, FIELD_DEFS.flightSpacing.label)
  need(num(form.flightThickness) !== null, 'Flight thickness')
  step = 'edges'
  if (form.containment === 'sidewalls') need(num(form.sidewallHeight) !== null, 'Sidewall height')
  step = 'product'
  need(readField(form, 'density') !== null, FIELD_DEFS.density.label)
  need(readField(form, 'repose') !== null, FIELD_DEFS.repose.label)
  need(readField(form, 'smallestDim') !== null, FIELD_DEFS.smallestDim.label)
  need(readField(form, 'fill') !== null, FIELD_DEFS.fill.label)
  return missing
}

/** Which required fields are still blank, by label. */
export function missingFields(form: TdForm): string[] {
  return missingByStep(form).map((m) => m.label)
}

/** Engine inputs, or null while a required field is blank. */
export function formToInputs(form: TdForm): TdInputs | null {
  if (missingFields(form).length > 0) return null
  const r = (f: TypedField, fallback: number) => readField(form, f) ?? fallback
  const opt = (f: TypedField) => {
    const v = readField(form, f)
    return v === null || v <= 0 ? null : v
  }
  const height = flightHeightIn(form) as number
  return {
    series: form.series,
    beltWidthIn: r('beltWidth', 0),
    inclineDeg: r('incline', 0),
    inclineLengthFt: opt('inclineLength'),
    targetLbPerHr: opt('target'),
    beltSpeedFpm: opt('speed'),
    flightType: form.flightType,
    flightHeightIn: height,
    flightThicknessIn: num(form.flightThickness) ?? 0,
    flightSpacingIn: r('flightSpacing', 0),
    containment: form.containment,
    indentLeftIn: r('indentLeft', 0),
    indentRightIn: r('indentRight', 0),
    holdDownWidthIn: r('holdDownWidth', DEFAULT_HOLD_DOWN_WIDTH_IN),
    rollerLimiters: form.rollerLimiters,
    guardClearanceIn: readField(form, 'guardClearance'),
    notchCount: Math.max(0, Math.floor(r('notchCount', 0))),
    notchWidthIn: r('notchWidth', STANDARD_NOTCH_IN),
    sidewallPitch: form.sidewallPitch,
    sidewallHeightIn: form.containment === 'sealed' ? height : (num(form.sidewallHeight) ?? 0),
    sidewallIndentIn: r('sidewallIndent', MIN_SIDEWALL_INDENT_IN),
    sidewallGapIn: r('sidewallGap', MIN_SIDEWALL_GAP_IN),
    densityLbFt3: r('density', 0),
    reposeDeg: r('repose', 0),
    smallestDimIn: r('smallestDim', 0),
    fillPct: r('fill', DEFAULT_FILL_PCT),
    dynamicDerateDeg: r('derate', DEFAULT_DYNAMIC_DERATE_DEG),
    productMaxSpeedFpm: opt('maxSpeed'),
    wallFrictionMu: r('wallFriction', DEFAULT_WALL_FRICTION),
    calcLabMode: form.calcLabMode,
    profileOverride: form.profileOverride,
  }
}

/**
 * Convert one typed value between systems. Picks the shortest text that
 * converts back to what was typed, at the precision it was typed, so toggling
 * units and back never turns "60" into "60.01".
 */
export function convertText(text: string, field: TypedField, from: UnitSystem, to: UnitSystem): string {
  const v = num(text)
  if (v === null || from === to) return text
  const q = FIELD_DEFS[field].q
  const target = fromCanonical(toCanonical(v, q, from), q, to)
  // How precisely the person typed it: "7.9" is good to ±0.05.
  const typedDp = /^\s*-?\d*\.(\d+)\s*$/.exec(text)?.[1].length ?? (/^\s*-?\d+\s*$/.test(text) ? 0 : 6)
  // ...but never looser than 0.01%, or "8 in" would become "203 mm" (7.992 in)
  // and trip a minimum-spacing rule it actually meets.
  const tol = Math.min(0.5 * 10 ** -typedDp, 1e-4 * Math.abs(v)) + 1e-9
  for (let dp = 0; dp <= 6; dp++) {
    const candidate = trimNumber(target, dp)
    const back = fromCanonical(toCanonical(Number(candidate), q, to), q, from)
    if (Math.abs(back - v) <= tol) return candidate
  }
  return trimNumber(target, 6)
}

/** Switch unit systems, converting every typed value so nothing changes meaning. */
export function convertForm(form: TdForm, next: UnitSystem): TdForm {
  if (next === form.system) return form
  const out: TdForm = { ...form, system: next }
  for (const field of Object.keys(FIELD_DEFS) as TypedField[]) {
    out[field] = convertText(form[field], field, form.system, next)
  }
  return out
}

/** Keep dependent choices valid after series / flight / pitch changes. */
export function reconcile(form: TdForm): TdForm {
  const out = { ...form }
  const ft = FLIGHT_TYPES[out.flightType]
  if (!ft.thicknessesIn.some((t) => Math.abs(t - (num(out.flightThickness) ?? -1)) < 1e-9)) {
    out.flightThickness = inch(ft.thicknessesIn.includes(0.16) ? 0.16 : ft.thicknessesIn[0])
  }
  if (ft.heights) {
    const h = num(out.flightHeightChoice)
    if (h === null || !ft.heights.some((x) => Math.abs(x - h) < 1e-9)) out.flightHeightChoice = ''
  }
  const pitches = sidewallPitches(out.series)
  if (pitches.length && !pitches.includes(out.sidewallPitch)) out.sidewallPitch = pitches[0]
  const heights = pitches.length ? sidewallHeights(out.series, out.sidewallPitch) : []
  const sh = num(out.sidewallHeight)
  if (sh !== null && !heights.some((x) => Math.abs(x - sh) < 1e-9)) out.sidewallHeight = ''
  if ((out.containment === 'sidewalls' && !pitches.length) || (out.containment === 'sealed' && (out.series === 'S8026' || out.flightType !== 'deg90'))) {
    out.containment = 'open'
  }
  return out
}

/** Apply a product preset: fills density, repose and size; the user can edit all three. */
export function applyPreset(form: TdForm, presetId: string): TdForm {
  const p = findPreset(presetId)
  if (!p) return { ...form, productPreset: presetId }
  return {
    ...form,
    productPreset: presetId,
    density: fieldText(p.densityLbFt3, 'density', form.system),
    repose: fieldText(p.reposeDeg, 'repose', form.system),
    smallestDim: fieldText(p.smallestDimIn, 'smallestDim', form.system),
  }
}

/** Rebuild a form from saved canonical inputs. */
export function inputsToForm(inputs: TdInputs, system: UnitSystem, presetId = ''): TdForm {
  const t = (v: number | null, f: TypedField) => (v === null ? '' : fieldText(v, f, system))
  const fixed = FLIGHT_TYPES[inputs.flightType].heights !== null
  return {
    ...initialForm(),
    system,
    series: inputs.series,
    beltWidth: t(inputs.beltWidthIn, 'beltWidth'),
    incline: t(inputs.inclineDeg, 'incline'),
    inclineLength: t(inputs.inclineLengthFt, 'inclineLength'),
    target: t(inputs.targetLbPerHr, 'target'),
    speed: t(inputs.beltSpeedFpm, 'speed'),
    flightType: inputs.flightType,
    flightHeightText: fixed ? '' : t(inputs.flightHeightIn, 'flightHeightText'),
    flightHeightChoice: fixed ? inch(inputs.flightHeightIn) : '',
    flightThickness: inch(inputs.flightThicknessIn),
    flightSpacing: t(inputs.flightSpacingIn, 'flightSpacing'),
    containment: inputs.containment,
    indentLeft: t(inputs.indentLeftIn, 'indentLeft'),
    indentRight: t(inputs.indentRightIn, 'indentRight'),
    holdDownWidth: t(inputs.holdDownWidthIn, 'holdDownWidth'),
    rollerLimiters: inputs.rollerLimiters,
    guardClearance: t(inputs.guardClearanceIn, 'guardClearance'),
    notchCount: String(inputs.notchCount),
    notchWidth: t(inputs.notchWidthIn, 'notchWidth'),
    sidewallPitch: inputs.sidewallPitch,
    sidewallHeight: inputs.containment === 'sidewalls' ? inch(inputs.sidewallHeightIn) : '',
    sidewallIndent: t(inputs.sidewallIndentIn, 'sidewallIndent'),
    sidewallGap: t(inputs.sidewallGapIn, 'sidewallGap'),
    productPreset: presetId,
    density: t(inputs.densityLbFt3, 'density'),
    repose: t(inputs.reposeDeg, 'repose'),
    smallestDim: t(inputs.smallestDimIn, 'smallestDim'),
    fill: t(inputs.fillPct, 'fill'),
    derate: t(inputs.dynamicDerateDeg, 'derate'),
    maxSpeed: t(inputs.productMaxSpeedFpm, 'maxSpeed'),
    wallFriction: t(inputs.wallFrictionMu, 'wallFriction'),
    calcLabMode: inputs.calcLabMode,
    profileOverride: inputs.profileOverride ?? null,
  }
}

/**
 * Flight width as soon as the belt width is in -- the Edges step's live
 * readout shouldn't wait for the product step to be filled in.
 */
export function previewWidth(form: TdForm): WidthModel | null {
  const beltWidthIn = readField(form, 'beltWidth')
  if (beltWidthIn === null) return null
  const r = (f: TypedField, fallback: number) => readField(form, f) ?? fallback
  return buildWidthModel({
    containment: form.containment,
    beltWidthIn,
    indentLeftIn: r('indentLeft', 0),
    indentRightIn: r('indentRight', 0),
    sidewallIndentIn: r('sidewallIndent', 0),
    sidewallGapIn: r('sidewallGap', 0),
    sidewallPitch: form.sidewallPitch,
    notchCount: Math.max(0, Math.floor(r('notchCount', 0))),
    notchWidthIn: r('notchWidth', 0),
  })
}

/**
 * A stable identity for a set of inputs: key-sorted JSON. Inputs arrive from
 * the worker as structured clones and from saved records with a different key
 * order, so neither object identity nor plain JSON.stringify can say "same".
 */
export function inputsKey(i: TdInputs | null): string {
  if (!i) return ''
  return JSON.stringify(i, Object.keys(i).sort())
}
