import { describe, expect, it } from 'vitest'
import { computeTdBulkDensity } from './tdBulkDensity/compute'
import { makeInputs } from './tdBulkDensity/defaults'
import { ENGINE_VERSION } from './tdBulkDensity/version'
import {
  buildRun,
  fromStoredInputs,
  recheckRun,
  runTitle,
  toStoredInputs,
  validateRunMeta,
} from './tdBulkDensityRecord'
import { raceWrite } from './writeOutcome'

const inputs = makeInputs({ beltSpeedFpm: 60, targetLbPerHr: 1000 })

function run() {
  return buildRun({
    id: 'r1',
    customer: '  Jacksons ',
    reference: 'Line 3 incline',
    notes: '',
    inputs,
    system: 'imperial',
    productPreset: 'kettle-chips',
    result: computeTdBulkDensity(inputs, 'fine'),
    createdAt: 1,
    now: 2,
  })
}

describe('saved runs', () => {
  it('stores inputs, engine version and a results snapshot', () => {
    const r = run()
    expect(r.customer).toBe('Jacksons')
    expect(r.engineVersion).toBe(ENGINE_VERSION)
    expect(r.results?.throughputLbPerHr).toBeGreaterThan(0)
    expect(runTitle(r)).toBe('Jacksons · Line 3 incline')
  })

  it('stores a CAD face without nested arrays (Firestore rejects them)', () => {
    const s = toStoredInputs({ ...inputs, profileOverride: [[0, 0], [0, 5]] })
    expect(s.profileOverride).toEqual([{ u: 0, v: 0 }, { u: 0, v: 5 }])
    expect(JSON.stringify(s)).not.toMatch(/\[\[/)
    expect(fromStoredInputs(s).profileOverride).toEqual([[0, 0], [0, 5]])
  })

  it('fills fields an older record lacks from the defaults, without writing', () => {
    const { wallFrictionMu: _w, ...old } = toStoredInputs(inputs)
    void _w
    expect(fromStoredInputs(old).wallFrictionMu).toBe(0.3)
  })

  it('reopening with the same engine reports no change', () => {
    const r = recheckRun(run())
    expect(r.changed).toBe(false)
    expect(r.engineChanged).toBe(false)
    expect(r.inputs).toEqual(inputs)
  })

  it('says so when the current engine gives a different answer', () => {
    const r = run()
    r.results = { ...r.results!, massPerFlightLb: r.results!.massPerFlightLb * 1.1 }
    r.engineVersion = '0.9.0'
    const re = recheckRun(r)
    expect(re.changed).toBe(true)
    expect(re.engineChanged).toBe(true)
  })

  it('requires Customer and Reference', () => {
    expect(validateRunMeta(' ', 'x')).toEqual(['Customer'])
    expect(validateRunMeta('a', '')).toEqual(['Reference'])
  })
})

describe('write outcomes', () => {
  it('saved only when the server confirms', async () => {
    expect((await raceWrite(Promise.resolve(), 50)).outcome).toEqual({ kind: 'saved' })
  })
  it('queued when the write is still pending (offline)', async () => {
    let resolve!: () => void
    const pending = new Promise<void>((r) => (resolve = r))
    const { outcome, settled } = await raceWrite(pending, 10)
    expect(outcome).toEqual({ kind: 'queued' })
    resolve()
    expect(await settled).toEqual({ kind: 'saved' })
  })
  it('failed, in plain words, when the server refuses', async () => {
    const err = Object.assign(new Error('x'), { code: 'permission-denied' })
    const { outcome } = await raceWrite(Promise.reject(err), 50)
    expect(outcome.kind).toBe('failed')
    expect(outcome.kind === 'failed' && outcome.message).toContain('Nothing was saved')
  })
})
