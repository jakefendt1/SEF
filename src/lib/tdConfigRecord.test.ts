import { describe, expect, it } from 'vitest'
import { freshBelt, newVar } from './thermodrive/belt'
import { buildConfigRecord, configTitle, fromConfigRecord } from './tdConfigRecord'

describe('saved configurator belts', () => {
  it('C1: a record round-trips the belt, repair and sections', () => {
    const belt = { ...freshBelt('8140'), widthMm: 762, vars: [{ ...newVar(2.5), flightType: 'scoop' as const, heightMm: 101.6 }] }
    const rec = buildConfigRecord({ id: 'x', customer: ' Jacksons ', reference: 'Mez', notes: '', belt, repair: { rows: 24, flightsOn: true, startRow: 2.5 }, sectionMode: { kind: 'count', count: 3 }, system: 'metric', now: 5 })
    expect(rec.customer).toBe('Jacksons')
    expect(fromConfigRecord(JSON.parse(JSON.stringify(rec)))).toEqual({ belt, repair: rec.repair, sectionMode: rec.sectionMode, system: 'metric' })
    expect(configTitle(rec)).toBe('Jacksons · Mez')
  })

  it('C2: an older save missing newer fields opens with their defaults', () => {
    const old = { belt: { series: '8050', widthMm: 500, vars: [{ startRow: 2, heightMm: 50 }] } } as never
    const r = fromConfigRecord(old)
    expect(r.belt.joining).toBe('endless')
    expect(r.belt.vars[0].flightType).toBe('deg90')
    expect(r.belt.widthMm).toBe(500)
    expect(r.sectionMode).toEqual({ kind: 'count', count: 2 })
  })
})
