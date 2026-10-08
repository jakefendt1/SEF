// Two-way hand-off between the Bulk Density calculator and the Belt
// Configurator: the belt travels in the URL (?belt=...), nothing is stored.
// Only the belt crosses over -- series, width, flights, indents, notches,
// sidewalls -- never the product, incline or speeds. Whatever one tool can't
// represent is carried through untouched or named in a note.
import type { TdForm } from '../tdBulkDensity/form'
import { fieldText, flightHeightIn, readField } from '../tdBulkDensity/form'
import type { FlightType, Series, SidewallPitch } from '../tdBulkDensity/types'
import { accessories, freshBelt, newVar, sidewallFootprint, sidewallPitch, withProduct, type TdBelt } from './belt'
import { IN, PITCH_MM, SSW_HEIGHTS_IN, START_ROW, fromCalculatorSeries, type BeltSeries } from './data'
import { PRODUCTS, findProduct } from './products'

export const HANDOFF_PARAM = 'belt'

export interface HandoffBelt {
  v: 1
  series: BeltSeries
  widthIn: number
  lengthIn?: number
  /** Bulk Density only; the configurator carries them through. */
  flightType?: FlightType
  flightThicknessIn?: number
  flightHeightIn: number
  flightSpacingIn: number
  indentLeftIn: number
  indentRightIn: number
  notchCount: number
  notchWidthIn: number
  sidewall: { heightIn: number; indentIn: number; gapIn: number; pitch: SidewallPitch } | null
  /** Configurator only; Bulk Density carries them through. */
  style?: string
  material?: string
  color?: string
  startRow?: number
}

const r4 = (v: number) => Math.round(v * 1e4) / 1e4

// ---- URL ----

export function encodeHandoff(h: HandoffBelt): string {
  const json = JSON.stringify(h, (_k, v) => (typeof v === 'number' ? r4(v) : v))
  const bytes = new TextEncoder().encode(json)
  const b64 = btoa(Array.from(bytes, (c) => String.fromCharCode(c)).join(''))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeHandoff(text: string | null | undefined): HandoffBelt | null {
  if (!text) return null
  try {
    const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
    const h = JSON.parse(json) as HandoffBelt
    if (h?.v !== 1 || !(h.series in PITCH_MM) || !(h.widthIn > 0)) return null
    return h
  } catch {
    return null
  }
}

export function handoffFromSearch(search: string): HandoffBelt | null {
  return decodeHandoff(new URLSearchParams(search).get(HANDOFF_PARAM))
}

// ---- Bulk Density side ----

/** The belt in the calculator's form, once width, flight height and spacing are in. */
export function handoffFromForm(form: TdForm, carry?: Pick<HandoffBelt, 'style' | 'material' | 'color' | 'startRow' | 'lengthIn'>): HandoffBelt | null {
  const width = readField(form, 'beltWidth')
  const height = flightHeightIn(form)
  const spacing = readField(form, 'flightSpacing')
  if (!(width && width > 0) || !(height && height > 0) || !(spacing && spacing > 0)) return null
  const walls = form.containment === 'sidewalls' || form.containment === 'sealed'
  return {
    v: 1,
    series: fromCalculatorSeries(form.series),
    widthIn: width,
    flightType: form.flightType,
    flightThicknessIn: Number(form.flightThickness) || 0.16,
    flightHeightIn: height,
    flightSpacingIn: spacing,
    indentLeftIn: readField(form, 'indentLeft') ?? 0,
    indentRightIn: readField(form, 'indentRight') ?? 0,
    notchCount: Math.max(0, Math.round(readField(form, 'notchCount') ?? 0)),
    notchWidthIn: readField(form, 'notchWidth') ?? 0,
    sidewall:
      walls && Number(form.sidewallHeight) > 0
        ? {
            heightIn: Number(form.sidewallHeight),
            indentIn: readField(form, 'sidewallIndent') ?? 0,
            gapIn: readField(form, 'sidewallGap') ?? 0.2,
            pitch: form.sidewallPitch,
          }
        : null,
    // Only the configurator-only fields carry through; the belt is the form's.
    style: carry?.style,
    material: carry?.material,
    color: carry?.color,
    startRow: carry?.startRow,
    lengthIn: carry?.lengthIn,
  }
}

/** Why a configurator belt can't open in Bulk Density, or null when it can. */
export function bulkDensityBlocker(series: BeltSeries): string | null {
  return series === '8126' ? "The Bulk Density calculator doesn't have Series 8126 yet." : null
}

/** Put a handed-off belt into the calculator's form, keeping everything that isn't the belt. */
export function applyHandoffToForm(form: TdForm, h: HandoffBelt): TdForm {
  const sys = form.system
  const len = (v: number, f: Parameters<typeof fieldText>[1]) => fieldText(v, f, sys)
  const series = `S${h.series}` as Series
  const flightType = h.flightType ?? form.flightType
  const out: TdForm = {
    ...form,
    series,
    beltWidth: len(h.widthIn, 'beltWidth'),
    flightType,
    flightThickness: h.flightThicknessIn !== undefined ? String(h.flightThicknessIn) : form.flightThickness,
    flightHeightText: flightType === 'deg90' ? len(h.flightHeightIn, 'flightHeightText') : '',
    flightHeightChoice: flightType === 'deg90' ? '' : String(h.flightHeightIn),
    flightSpacing: len(h.flightSpacingIn, 'flightSpacing'),
    indentLeft: len(h.indentLeftIn, 'indentLeft'),
    indentRight: len(h.indentRightIn, 'indentRight'),
    notchCount: String(h.notchCount),
    notchWidth: h.notchCount > 0 ? len(h.notchWidthIn, 'notchWidth') : form.notchWidth,
  }
  if (h.sidewall) {
    out.containment = form.containment === 'sealed' ? 'sealed' : 'sidewalls'
    out.sidewallPitch = h.sidewall.pitch
    out.sidewallHeight = String(h.sidewall.heightIn)
    out.sidewallIndent = len(h.sidewall.indentIn, 'sidewallIndent')
    out.sidewallGap = len(h.sidewall.gapIn, 'sidewallGap')
  } else if (form.containment === 'sidewalls' || form.containment === 'sealed') {
    out.containment = 'open'
  }
  return out
}

// ---- Configurator side ----

export interface ConfigFromHandoff {
  belt: TdBelt
  notes: string[]
}

export function beltFromHandoff(h: HandoffBelt): ConfigFromHandoff {
  const notes: string[] = []
  // The belt's data sheet: the one it left with, else the first that takes sidewalls if it has them.
  const fresh = freshBelt(h.series)
  const sent = h.style && h.material ? findProduct({ series: h.series, style: h.style, material: h.material }) : null
  const wantWalls = !!h.sidewall
  const fallback = PRODUCTS.find((x) => x.series === h.series && x.flights && (!wantWalls || x.sidewalls))
  const base = sent
    ? { ...fresh, style: h.style!, material: h.material!, color: sent.colors.includes(h.color ?? '') ? h.color! : sent.colors[0] }
    : fallback
      ? withProduct(fresh, { drive: fallback.drive, surface: fallback.surface, material: fallback.material })
      : fresh
  let material = base.material
  const style = base.style
  const color = base.color
  const heights = SSW_HEIGHTS_IN[h.series] ?? []
  let sidewallHeightIn = base.sidewallHeightIn
  let sidewallsOn = false
  let inset = base.sidewallInsetMm
  if (h.sidewall) {
    if (!heights.length || !accessories(base).sidewalls) notes.push(`This ${h.series} belt doesn't take sidewalls.`)
    else {
      sidewallsOn = true
      inset = h.sidewall.indentIn * IN
      if (heights.includes(h.sidewall.heightIn)) sidewallHeightIn = h.sidewall.heightIn
      else {
        sidewallHeightIn = heights.reduce((a, c) => (Math.abs(c - h.sidewall!.heightIn) < Math.abs(a - h.sidewall!.heightIn) ? c : a))
        notes.push(`${h.sidewall.heightIn} in sidewalls aren't in the configurator's list; showing ${sidewallHeightIn} in.`)
      }
      // The configurator picks the sidewall pitch from the material: 25 mm is 1 in polyurethane on 8050.
      if (h.sidewall.pitch === '25mm' && h.series === '8050' && sidewallHeightIn === 1) material = 'Polyurethane'
      const pitch = sidewallPitch({ series: h.series, sidewallHeightIn, material })
      if (`${pitch}mm` !== h.sidewall.pitch) notes.push(`Sidewall pitch is ${pitch} mm here (Bulk Density had ${h.sidewall.pitch}).`)
    }
  }
  const fp = sidewallsOn ? sidewallFootprint({ series: h.series, sidewallHeightIn, material }).fp : 0
  const flightIndent = (fallbackIn: number) => (sidewallsOn && h.sidewall ? inset + fp + h.sidewall.gapIn * IN : fallbackIn * IN)
  const v = {
    ...newVar(h.startRow ?? START_ROW[h.series]),
    flightType: h.flightType ?? 'deg90',
    thicknessMm: (h.flightThicknessIn ?? 0.16) * IN,
    heightMm: h.flightHeightIn * IN,
    indentLMm: flightIndent(h.indentLeftIn),
    indentRMm: flightIndent(h.indentRightIn),
    notchOn: h.notchCount > 0,
    // One notch in Bulk Density is a center notch.
    notchMode: h.notchCount === 1 ? ('center' as const) : ('even' as const),
    notchCount: h.notchCount > 0 ? h.notchCount : 5,
    notchWMm: h.notchWidthIn * IN || 25,
  }
  return {
    belt: {
      ...base,
      style,
      material,
      color,
      widthMm: h.widthIn * IN,
      lengthMm: h.lengthIn ? h.lengthIn * IN : 0,
      flightsOn: true,
      flightSpacingMm: h.flightSpacingIn * IN,
      vars: [v],
      sidewallsOn,
      sidewallHeightIn,
      sidewallInsetMm: inset,
      sidewallsBoth: true,
    },
    notes,
  }
}

/** The configurator's belt, for Bulk Density. */
export function handoffFromBelt(b: TdBelt): { handoff: HandoffBelt; notes: string[] } {
  const notes: string[] = []
  const v = b.vars[0]
  if (b.vars.length > 1) notes.push('Only flight variation 1 goes to Bulk Density.')
  const fp = b.sidewallsOn ? sidewallFootprint(b).fp : 0
  let notchCount = 0
  let notchWidthIn = 0
  if (v.notchOn && v.notchMode === 'center') {
    notchCount = 1
    notchWidthIn = v.notchWMm / IN
  } else if (v.notchOn && v.notchMode === 'lugs') {
    notchCount = /dual[- ]lug/i.test(b.style) ? 2 : 1
    notchWidthIn = v.notchWMm / IN
    if (notchCount === 2) notes.push('Bulk Density spaces notches evenly, so the two lug notches move slightly.')
  } else if (v.notchOn && v.notchCount > 0) {
    notchCount = v.notchCount
    if (v.notchMode === 'even') notchWidthIn = v.notchWMm / IN
    else {
      const w = v.notchWidthsMm.slice(0, v.notchCount)
      notchWidthIn = (w.reduce((a, c) => a + c, 0) / Math.max(1, w.length)) / IN
      notes.push('Bulk Density spaces notches evenly; it uses their average width.')
    }
  }
  return {
    handoff: {
      v: 1,
      series: b.series,
      widthIn: b.widthMm / IN,
      lengthIn: b.lengthMm > 0 ? b.lengthMm / IN : undefined,
      flightType: v.flightType,
      flightThicknessIn: v.thicknessMm / IN,
      flightHeightIn: v.heightMm / IN,
      flightSpacingIn: b.flightSpacingMm / IN,
      indentLeftIn: v.indentLMm / IN,
      indentRightIn: v.indentRMm / IN,
      notchCount,
      notchWidthIn,
      sidewall: b.sidewallsOn
        ? {
            heightIn: b.sidewallHeightIn,
            indentIn: b.sidewallInsetMm / IN,
            gapIn: Math.max(0, (v.indentLMm - b.sidewallInsetMm - fp) / IN),
            pitch: `${sidewallPitch(b)}mm` as SidewallPitch,
          }
        : null,
      style: b.style,
      material: b.material,
      color: b.color,
      startRow: v.startRow,
    },
    notes,
  }
}
