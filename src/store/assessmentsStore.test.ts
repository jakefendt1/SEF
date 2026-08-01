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

const { useAssessmentsStore } = await import('./assessmentsStore')

function seed(state: { uid: string; loaded: boolean; assessments: unknown[] }) {
  useAssessmentsStore.setState(state as never)
}

beforeEach(() => {
  putAssessment.mockClear()
  deleteAssessmentDoc.mockClear()
  updateAssessmentFields.mockClear()
  useAssessmentsStore.setState({ uid: 'u1', assessments: [], loaded: true } as never)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('saveDraft', () => {
  it('preserves status on a completed record (does not revert it to a draft)', async () => {
    seed({
      uid: 'u1',
      loaded: true,
      assessments: [{
        id: 'a1',
        data: { name: 'Jane', companyName: 'Acme' },
        status: 'complete',
        createdAt: 1,
        updatedAt: 2,
        completedAt: 2,
      }],
    })

    await useAssessmentsStore.getState().saveDraft('a1', { name: 'Jane', companyName: 'Acme Updated' })

    expect(putAssessment).toHaveBeenCalledTimes(1)
    const [, written] = putAssessment.mock.calls[0]
    expect(written.status).toBe('complete')
    expect(written.completedAt).toBe(2)
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
        status: 'complete',
        createdAt: 1,
        updatedAt: 2,
        completedAt: 2,
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
        status: 'complete',
        createdAt: 1,
        updatedAt: 2,
        completedAt: 2,
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
    status: 'complete' as const,
    createdAt: 1,
    updatedAt: 2,
    completedAt: 2,
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
  it('drops completedAt so the copy is not mistaken for a finished one', async () => {
    seed({ uid: 'u1', loaded: true, assessments: [SOURCE] })
    await useAssessmentsStore.getState().duplicateAssessment('a1')
    const [, written] = putAssessment.mock.calls[0]
    expect(written.completedAt).toBeUndefined()
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

describe('markComplete', () => {
  it('marks the record complete and stamps completedAt', async () => {
    seed({ uid: 'u1', loaded: true, assessments: [] })

    await useAssessmentsStore.getState().markComplete('a1', { name: 'Jane' } as never)

    const [, written] = putAssessment.mock.calls.at(-1)!
    expect(written.status).toBe('complete')
    expect(written.completedAt).toBeGreaterThan(0)
    expect(written.completedAt).toBe(written.updatedAt)
  })

  // The old implementation branched on navigator.onLine because finishing also
  // pushed a row to a Google Sheet. That is gone: this is a local Firestore
  // write, which its offline cache accepts either way. Being offline must not
  // change the outcome.
  it('behaves identically offline -- there is no delivery left to fail', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    seed({ uid: 'u1', loaded: true, assessments: [] })

    await useAssessmentsStore.getState().markComplete('a1', { name: 'Jane' } as never)

    const [, written] = putAssessment.mock.calls.at(-1)!
    expect(written.status).toBe('complete')
  })

  it('keeps the original createdAt and the user-chosen title', async () => {
    seed({
      uid: 'u1',
      loaded: true,
      assessments: [{
        id: 'a1',
        data: { name: 'Jane' },
        status: 'draft',
        createdAt: 111,
        updatedAt: 222,
        title: 'Freezer line 3',
      }],
    })

    await useAssessmentsStore.getState().markComplete('a1', { name: 'Jane' } as never)

    const [, written] = putAssessment.mock.calls.at(-1)!
    expect(written.createdAt).toBe(111)
    expect(written.title).toBe('Freezer line 3')
  })
})

describe('reopenAssessment', () => {
  // Marking complete must never be a one-way door.
  it('puts a completed record back to draft without touching the answers', async () => {
    seed({
      uid: 'u1',
      loaded: true,
      assessments: [{
        id: 'a1',
        data: { name: 'Jane', companyName: 'Acme' },
        status: 'complete',
        createdAt: 1,
        updatedAt: 2,
        completedAt: 2,
      }],
    })

    await useAssessmentsStore.getState().reopenAssessment('a1')

    const [, written] = putAssessment.mock.calls.at(-1)!
    expect(written.status).toBe('draft')
    expect(written.data).toEqual({ name: 'Jane', companyName: 'Acme' })
    expect(written.completedAt).toBeUndefined()
  })

  it('does nothing to a record that is already a draft', async () => {
    seed({
      uid: 'u1',
      loaded: true,
      assessments: [{ id: 'a1', data: {}, status: 'draft', createdAt: 1, updatedAt: 2 }],
    })
    await useAssessmentsStore.getState().reopenAssessment('a1')
    expect(putAssessment).not.toHaveBeenCalled()
  })
})
