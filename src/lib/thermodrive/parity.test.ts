// The hub engine against Patrick's own page (v0.65): the belts in
// parity.cases.json, his answers in parity.patrick.json (regenerate with
// `node scripts/thermodrive-parity.mjs`).
import { describe, expect, it } from 'vitest'
import cases from './parity.cases.json'
import patrick from './parity.patrick.json'
import { effective, freshBelt, newVar, pitchMm, sidewallPitch, type FlightVar, type TdBelt } from './belt'
import { PITCH_MM, type BeltSeries } from './data'
import {
  computeSections,
  driveBands,
  finalSpacingInfo,
  flightSegments,
  lacePlacement,
  maxSectionInfo,
  vgPositions,
  type SectionMode,
} from './geometry'
import { validateBelt } from './validate'

type Case = (typeof cases.cases)[number]
type PVar = Case['vars'][number] & {
  notchOn?: boolean
  even?: boolean
  notchCount?: number
  notchW?: number
  flightWidths?: number[]
  notchWidths?: number[]
  flightHeights?: number[]
}

function toVar(v: PVar): FlightVar {
  return {
    ...newVar(v.startRow),
    indentLMm: v.indentL,
    indentRMm: v.indentR,
    heightMm: v.height,
    notchOn: !!v.notchOn,
    notchMode: v.even === false ? 'manual' : 'even',
    notchCount: v.notchCount ?? 5,
    notchWMm: v.notchW ?? 25,
    flightWidthsMm: v.flightWidths ?? [],
    notchWidthsMm: v.notchWidths ?? [],
    flightHeightsMm: v.flightHeights ?? [],
  }
}

function toBelt(c: Case): TdBelt {
  const series = c.series as BeltSeries
  const p = PITCH_MM[series]
  const x = c as Case & Partial<{ vgIndentL: number; vgIndentR: number; vgChannels: number[]; vgOuterSp: number; vgInnerSp: number }>
  const base = freshBelt(series)
  return effective({
    ...base,
    style: c.style,
    material: c.material,
    color: c.color,
    widthMm: c.width,
    lengthMm: c.rows * p,
    flightsOn: c.flightOn,
    flightSpacingMm: c.flightRows * p,
    vars: (c.var2 ? c.vars : c.vars.slice(0, 1)).map((v) => toVar(v as PVar)),
    sidewallsOn: c.sswOn,
    sidewallHeightIn: c.sswHin,
    sidewallInsetMm: c.sswInset,
    sidewallsBoth: c.sswBoth,
    vgOn: c.vgOn,
    vgCount: c.vgCount,
    vgMode: c.vgMode as TdBelt['vgMode'],
    vgIndentLMm: x.vgIndentL ?? base.vgIndentLMm,
    vgIndentRMm: x.vgIndentR ?? base.vgIndentRMm,
    vgChannelsMm: x.vgChannels ?? base.vgChannelsMm,
    vgOuterSpMm: x.vgOuterSp ?? base.vgOuterSpMm,
    vgInnerSpMm: x.vgInnerSp ?? base.vgInnerSpMm,
  })
}

function toMode(m: Case['sections'][number]): SectionMode {
  const x = m as { mode: string; count?: number; std?: number; last?: boolean; text?: string }
  if (x.mode === 'count') return { kind: 'count', count: x.count ?? 1 }
  if (x.mode === 'standard') return { kind: 'standard', rows: x.std ?? 60, remainderOnLast: !!x.last }
  return { kind: 'manual', text: x.text ?? '' }
}

describe("ThermoDrive engine matches Patrick's configurator (v0.65)", () => {
  it('every case has his answer', () => {
    expect(patrick.results.map((r) => r.name)).toEqual(cases.cases.map((c) => c.name))
  })

  cases.cases.forEach((c, k) => {
    const his = patrick.results[k]
    it(c.name, () => {
      const b = toBelt(c)
      if (his.sswPitch !== null) expect(sidewallPitch(b)).toBe(his.sswPitch)
      const vars = b.flightsOn ? b.vars : []
      expect(
        vars.map((v) => {
          const f = finalSpacingInfo(b, v)
          return { nF: f.count, spliceFlag: !!f.removed, removedRow: f.removed?.row ?? null, finalGap: f.finalGapMm ?? null }
        }),
      ).toEqual(his.finals.map((f) => ({ ...f, finalGap: f.finalGap === null ? null : expect.closeTo(f.finalGap, 6) })))
      vars.forEach((v, i) => {
        const g = flightSegments(b, v)
        expect(g.over).toBe(his.segs[i].over)
        g.segs.forEach((s, j) => {
          expect(s[0]).toBeCloseTo(his.segs[i].segs[j][0], 6)
          expect(s[1]).toBeCloseTo(his.segs[i].segs[j][1], 6)
        })
      })
      expect(maxSectionInfo(b).ft).toBe(his.msi.ft)
      const vg = b.vgOn ? vgPositions(b) : []
      expect(vg.length).toBe(his.vgPos.length)
      vg.forEach((p, i) => expect(p).toBeCloseTo(his.vgPos[i], 6))
      driveBands(b).forEach((d, i) => {
        expect(d[0]).toBeCloseTo(his.drive[i][0], 6)
        expect(d[1]).toBeCloseTo(his.drive[i][1], 6)
      })
      const lace = lacePlacement(b, c.repairLength)
      expect({ mode: lace.mode, rows: lace.rows }).toEqual({ mode: his.lace.mode, rows: his.lace.rows })
      expect(lace.laceMm).toBeCloseTo(his.lace.laceMM, 6)
      const total = Math.round(b.lengthMm / pitchMm(b))
      c.sections.forEach((m, i) => {
        const r = computeSections(total, toMode(m))
        expect({ rows: r.rows, err: !!r.error }).toEqual(his.sections[i])
      })

      // His flags, as our warnings.
      const w = validateBelt(b).map((x) => x.id)
      expect(w.some((id) => id.startsWith('vg-') && id !== 'vg-pairs') || (his.vgWarn && w.includes('vg-pairs'))).toBe(his.vgWarn)
      vars.forEach((_, i) => {
        expect(w.includes(`notch-over-${i}`) || w.includes(`sidewall-gap-${i}`)).toBe(his.varWarn[i])
        expect(w.includes(`splice-${i}`)).toBe(his.finals[i].spliceFlag)
      })
    })
  })
})
