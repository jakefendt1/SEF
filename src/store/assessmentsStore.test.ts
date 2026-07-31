import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const putAssessment = vi.fn().mockResolvedValue(undefined)
const deleteAssessmentDoc = vi.fn().mockResolvedValue(undefined)
const subscribeAssessments = vi.fn().mockReturnValue(() => {})

vi.mock('../lib/firestoreAssessments', () => ({
  putAssessment: (...args: unknown[]) => putAssessment(...args),
  deleteAssessmentDoc: (...args: unknown[]) => deleteAssessmentDoc(...args),
  subscribeAssessments: (...args: unknown[]) => subscribeAssessments(...args),
}))

const submitToSheets = vi.fn()
vi.mock('../lib/api', () => ({
  submitToSheets: (...args: unknown[]) => submitToSheets(...args),
}))

const { useAssessmentsStore } = await import('./assessmentsStore')

function seed(state: { uid: string; loaded: boolean; assessments: unknown[] }) {
  useAssessmentsStore.setState(state as never)
}

beforeEach(() => {
  putAssessment.mockClear()
  deleteAssessmentDoc.mockClear()
  submitToSheets.mockReset()
  useAssessmentsStore.setState({ uid: 'u1', assessments: [], loaded: true } as never)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('saveDraft', () => {
  it('preserves status on a synced record (does not revert Saved -> Draft)', async () => {
    seed({
      uid: 'u1',
      loaded: true,
      assessments: [{
        id: 'a1',
        data: { name: 'Jane', companyName: 'Acme' },
        status: 'synced',
        createdAt: 1,
        updatedAt: 2,
        syncedAt: 2,
      }],
    })

    await useAssessmentsStore.getState().saveDraft('a1', { name: 'Jane', companyName: 'Acme Updated' })

    expect(putAssessment).toHaveBeenCalledTimes(1)
    const [, written] = putAssessment.mock.calls[0]
    expect(written.status).toBe('synced')
    expect(written.syncedAt).toBe(2)
  })

  it('does not reset a failed record back to draft', async () => {
    seed({
      uid: 'u1',
      loaded: true,
      assessments: [{
        id: 'a1',
        data: { name: 'Jane' },
        status: 'failed',
        createdAt: 1,
        updatedAt: 2,
      }],
    })

    await useAssessmentsStore.getState().saveDraft('a1', { name: 'Jane updated' })

    const [, written] = putAssessment.mock.calls[0]
    expect(written.status).toBe('failed')
  })

  it('defaults a genuinely new record to draft', async () => {
    seed({ uid: 'u1', loaded: true, assessments: [] })
    await useAssessmentsStore.getState().saveDraft('new-1', { name: 'New' })
    const [, written] = putAssessment.mock.calls[0]
    expect(written.status).toBe('draft')
  })

  it('refuses to overwrite a filled record with an empty payload (store-level backstop)', async () => {
    seed({
      uid: 'u1',
      loaded: true,
      assessments: [{
        id: 'a1',
        data: { name: 'Jane', companyName: 'Acme', email: 'jane@acme.com' },
        status: 'synced',
        createdAt: 1,
        updatedAt: 2,
        syncedAt: 2,
      }],
    })

    await useAssessmentsStore.getState().saveDraft('a1', {})

    expect(putAssessment).not.toHaveBeenCalled()
  })
})

describe('submitAssessment', () => {
  it('returns ok:true and marks the record synced when online and the request succeeds', async () => {
    vi.stubGlobal('navigator', { onLine: true })
    submitToSheets.mockResolvedValueOnce(undefined)
    seed({ uid: 'u1', loaded: true, assessments: [] })

    const result = await useAssessmentsStore.getState().submitAssessment('a1', { name: 'Jane' } as never)

    expect(result).toEqual({ ok: true })
    const [, written] = putAssessment.mock.calls.at(-1)!
    expect(written.status).toBe('synced')
  })

  it('returns a distinguishable offline result and queues the record (does not claim success)', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    seed({ uid: 'u1', loaded: true, assessments: [] })

    const result = await useAssessmentsStore.getState().submitAssessment('a1', { name: 'Jane' } as never)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('offline')
    expect(submitToSheets).not.toHaveBeenCalled()
    const [, written] = putAssessment.mock.calls.at(-1)!
    expect(written.status).toBe('queued')
  })

  it('returns a distinguishable error result and marks the record failed when the network request throws', async () => {
    vi.stubGlobal('navigator', { onLine: true })
    submitToSheets.mockRejectedValueOnce(new Error('network down'))
    seed({ uid: 'u1', loaded: true, assessments: [] })

    const result = await useAssessmentsStore.getState().submitAssessment('a1', { name: 'Jane' } as never)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('error')
    const [, written] = putAssessment.mock.calls.at(-1)!
    expect(written.status).toBe('failed')
  })

  it('offline and error are never confused with each other', async () => {
    vi.stubGlobal('navigator', { onLine: true })
    submitToSheets.mockRejectedValueOnce(new Error('boom'))
    seed({ uid: 'u1', loaded: true, assessments: [] })
    const errorResult = await useAssessmentsStore.getState().submitAssessment('a1', { name: 'Jane' } as never)

    vi.stubGlobal('navigator', { onLine: false })
    seed({ uid: 'u1', loaded: true, assessments: [] })
    const offlineResult = await useAssessmentsStore.getState().submitAssessment('a2', { name: 'Jane' } as never)

    expect(errorResult.ok).toBe(false)
    expect(offlineResult.ok).toBe(false)
    if (!errorResult.ok && !offlineResult.ok) {
      expect(errorResult.reason).not.toBe(offlineResult.reason)
    }
  })
})
