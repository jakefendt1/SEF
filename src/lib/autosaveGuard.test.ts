import { describe, it, expect } from 'vitest'
import { shouldAutosave, countFilled } from './autosaveGuard'
import type { StoredAssessment } from './db'

function makeExisting(overrides: Partial<StoredAssessment> = {}): StoredAssessment {
  return {
    id: 'a1',
    data: {
      name: 'Jane Rep',
      companyName: 'Acme Foods',
      email: 'jane@acme.com',
      installationType: 'New',
    },
    status: 'complete',
    createdAt: 1000,
    updatedAt: 2000,
    completedAt: 2000,
    ...overrides,
  }
}

describe('countFilled', () => {
  it('counts real values', () => {
    expect(countFilled({ name: 'Jane', companyName: 'Acme' })).toBe(2)
  })

  it('ignores mode', () => {
    expect(countFilled({ mode: 'quick' })).toBe(0)
  })

  it('ignores empty strings, null, undefined, and empty arrays', () => {
    expect(countFilled({ name: '', email: undefined, phone: null, heatSource: [] } as never)).toBe(0)
  })

  it('treats undefined data as zero', () => {
    expect(countFilled(undefined)).toBe(0)
  })
})

describe('shouldAutosave', () => {
  it('blocks when not hydrated', () => {
    expect(shouldAutosave({ hydrated: false, isDirty: true, incoming: { name: 'x' } })).toBe(false)
  })

  it('blocks when not dirty (no user edit yet)', () => {
    expect(shouldAutosave({ hydrated: true, isDirty: false, incoming: { name: 'x' } })).toBe(false)
  })

  // This is the exact shape of the reopen-wipes-draft bug: the form has
  // mounted with only `{ mode: 'quick' }` (blank), isDirty happens to be
  // true, but the existing record has real data. Must be blocked.
  it('blocks a near-empty payload from overwriting a filled existing record', () => {
    const existing = makeExisting()
    const result = shouldAutosave({
      hydrated: true,
      isDirty: true,
      incoming: { mode: 'quick' },
      existing,
    })
    expect(result).toBe(false)
  })

  it('allows a genuine edit to an existing record', () => {
    const existing = makeExisting()
    const result = shouldAutosave({
      hydrated: true,
      isDirty: true,
      incoming: { ...existing.data, name: 'Jane Rep Updated' },
      existing,
    })
    expect(result).toBe(true)
  })

  it('allows the user genuinely clearing all fields back to empty', () => {
    // Not the bug case: this is an intentional clear via UI action, which
    // is out of scope for this guard (the guard only protects against a
    // blank *mount*, not a deliberate in-session clear). Once real product
    // behavior for "clear all" exists it should call the store directly,
    // bypassing this autosave path -- documented here as the boundary.
    const existing = makeExisting({ data: {} })
    const result = shouldAutosave({
      hydrated: true,
      isDirty: true,
      incoming: {},
      existing,
    })
    expect(result).toBe(true)
  })

  it('allows saving a brand new record with no existing data', () => {
    const result = shouldAutosave({
      hydrated: true,
      isDirty: true,
      incoming: { name: 'Brand New' },
      existing: undefined,
    })
    expect(result).toBe(true)
  })

  it('allows a blank payload for a brand new record (nothing to protect)', () => {
    const result = shouldAutosave({
      hydrated: true,
      isDirty: true,
      incoming: { mode: 'quick' },
      existing: undefined,
    })
    expect(result).toBe(true)
  })
})
