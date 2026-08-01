import { describe, it, expect } from 'vitest'
import { normalizeAssessment } from './db'

/**
 * Records written before the Google Sheets delivery was removed still exist in
 * Firestore with the old four-state status and a `syncedAt` timestamp. They are
 * never rewritten -- a read must not trigger a write -- so this normaliser is
 * the only thing standing between those records and a broken UI.
 */
describe('normalizeAssessment', () => {
  const base = { id: 'a1', data: { name: 'Jane' }, createdAt: 1, updatedAt: 2 }

  it('leaves a draft as a draft', () => {
    expect(normalizeAssessment({ ...base, status: 'draft' }).status).toBe('draft')
  })

  it("treats an old 'synced' record as complete", () => {
    expect(normalizeAssessment({ ...base, status: 'synced' }).status).toBe('complete')
  })

  // 'queued' and 'failed' both meant "the rep pressed Submit and delivery
  // didn't happen". The rep considered it finished, and delivery no longer
  // exists, so both are complete rather than silently demoted to draft.
  it("treats old 'queued' and 'failed' records as complete, not as drafts", () => {
    expect(normalizeAssessment({ ...base, status: 'queued' }).status).toBe('complete')
    expect(normalizeAssessment({ ...base, status: 'failed' }).status).toBe('complete')
  })

  it('carries syncedAt forward as completedAt', () => {
    expect(normalizeAssessment({ ...base, status: 'synced', syncedAt: 999 }).completedAt).toBe(999)
  })

  it('prefers completedAt when both are present', () => {
    const r = normalizeAssessment({ ...base, status: 'complete', completedAt: 5, syncedAt: 999 })
    expect(r.completedAt).toBe(5)
  })

  it('omits completedAt entirely when neither is present', () => {
    const r = normalizeAssessment({ ...base, status: 'draft' })
    expect('completedAt' in r).toBe(false)
  })

  it('preserves the user-chosen title and omits it when absent', () => {
    expect(normalizeAssessment({ ...base, status: 'draft', title: 'Line 3' }).title).toBe('Line 3')
    expect('title' in normalizeAssessment({ ...base, status: 'draft' })).toBe(false)
  })

  it('does not mutate the record it was given', () => {
    const raw = { ...base, status: 'synced', syncedAt: 999 }
    normalizeAssessment(raw)
    expect(raw.status).toBe('synced')
    expect(raw.syncedAt).toBe(999)
  })

  it('never emits a status outside the current model', () => {
    for (const status of ['draft', 'queued', 'synced', 'failed', 'complete', 'nonsense']) {
      expect(['draft', 'complete']).toContain(normalizeAssessment({ ...base, status }).status)
    }
  })

  it('passes the answers through untouched', () => {
    const data = { name: 'Jane', heatSource: ['Oven' as const] }
    expect(normalizeAssessment({ ...base, data, status: 'synced' }).data).toEqual(data)
  })
})
