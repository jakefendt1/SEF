import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const putAssessment = vi.fn().mockResolvedValue(undefined)
const deleteAssessmentDoc = vi.fn().mockResolvedValue(undefined)
const subscribeAssessments = vi.fn().mockReturnValue(() => {})
const updateAssessmentFields = vi.fn().mockResolvedValue(undefined)

vi.mock('../lib/firestoreAssessments', () => ({
  putAssessment: (...args: unknown[]) => putAssessment(...args),
  deleteAssessmentDoc: (...args: unknown[]) => deleteAssessmentDoc(...args),
  subscribeAssessments: (...args: unknown[]) => subscribeAssessments(...args),
  updateAssessmentFields: (...args: unknown[]) => updateAssessmentFields(...args),
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
  updateAssessmentFields.mockClear()
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

describe('saveDraft and the user-chosen title', () => {
  // saveDraft writes the whole document, so anything it forgets to restate is
  // erased. The title is the easy one to forget.
  it('preserves a user-set title through an autosave', async () => {
    seed({
      uid: 'u1',
      loaded: true,
      assessments: [{
        id: 'a1',
        data: { name: 'Jane' },
        status: 'draft',
        createdAt: 1,
        updatedAt: 2,
        title: 'Freezer line 3',
      }],
    })

    await useAssessmentsStore.getState().saveDraft('a1', { name: 'Jane Updated' })

    const [, written] = putAssessment.mock.calls[0]
    expect(written.title).toBe('Freezer line 3')
  })

  it('does not invent a title for a record that never had one', async () => {
    seed({ uid: 'u1', loaded: true, assessments: [] })
    await useAssessmentsStore.getState().saveDraft('new-1', { name: 'New' })
    const [, written] = putAssessment.mock.calls[0]
    expect('title' in written).toBe(false)
  })
})

describe('renameAssessment', () => {
  it('patches only metadata, never the answers or the status', async () => {
    seed({
      uid: 'u1',
      loaded: true,
      assessments: [{
        id: 'a1',
        data: { name: 'Jane' },
        status: 'synced',
        createdAt: 1,
        updatedAt: 2,
        syncedAt: 2,
      }],
    })

    await useAssessmentsStore.getState().renameAssessment('a1', '  Freezer line 3  ')

    expect(putAssessment).not.toHaveBeenCalled()
    const [, , patch] = updateAssessmentFields.mock.calls[0]
    expect(patch.title).toBe('Freezer line 3')
    expect(patch).not.toHaveProperty('status')
    expect(patch).not.toHaveProperty('data')
  })
})

describe('duplicateAssessment', () => {
  const SOURCE = {
    id: 'a1',
    data: { name: 'Jane', companyName: 'Acme Foods', heatSource: ['Oven'] },
    status: 'synced' as const,
    createdAt: 1,
    updatedAt: 2,
    syncedAt: 2,
  }

  it('creates an unsent draft with a new id and fresh timestamps', async () => {
    seed({ uid: 'u1', loaded: true, assessments: [SOURCE] })

    const newId = await useAssessmentsStore.getState().duplicateAssessment('a1')

    expect(newId).toBeTruthy()
    expect(newId).not.toBe('a1')
    const [, written] = putAssessment.mock.calls[0]
    expect(written.id).toBe(newId)
    expect(written.status).toBe('draft')
    expect(written.createdAt).toBeGreaterThan(SOURCE.createdAt)
  })

  // A naive spread carries syncedAt, which would make a copy that was never
  // sent look sent -- and break the "changed since sending" derivation.
  it('drops syncedAt so the copy is not mistaken for a sent record', async () => {
    seed({ uid: 'u1', loaded: true, assessments: [SOURCE] })
    await useAssessmentsStore.getState().duplicateAssessment('a1')
    const [, written] = putAssessment.mock.calls[0]
    expect(written.syncedAt).toBeUndefined()
  })

  it('marks the copy in its title rather than mutating customer answers', async () => {
    seed({ uid: 'u1', loaded: true, assessments: [SOURCE] })
    await useAssessmentsStore.getState().duplicateAssessment('a1')
    const [, written] = putAssessment.mock.calls[0]
    expect(written.title).toBe('Acme Foods (Copy)')
    expect(written.data.companyName).toBe('Acme Foods')
  })

  it('deep-copies the answers so editing the copy cannot alter the original', async () => {
    seed({ uid: 'u1', loaded: true, assessments: [SOURCE] })
    await useAssessmentsStore.getState().duplicateAssessment('a1')
    const [, written] = putAssessment.mock.calls[0]
    written.data.heatSource.push('Fryer')
    expect(SOURCE.data.heatSource).toEqual(['Oven'])
  })

  it('returns null and writes nothing for an unknown id', async () => {
    seed({ uid: 'u1', loaded: true, assessments: [] })
    expect(await useAssessmentsStore.getState().duplicateAssessment('nope')).toBeNull()
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
