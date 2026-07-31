import { describe, it, expect } from 'vitest'
import {
  assessmentTitle,
  assessmentSubtitle,
  duplicateTitle,
  assessmentSearchText,
  UNTITLED,
} from './assessmentTitle'
import type { StoredAssessment } from './db'

function rec(over: Partial<StoredAssessment> = {}): StoredAssessment {
  return {
    id: 'a1',
    data: {},
    status: 'draft',
    createdAt: 1,
    updatedAt: 2,
    ...over,
  }
}

describe('assessmentTitle', () => {
  it('prefers the name the user chose', () => {
    expect(assessmentTitle(rec({ title: 'Freezer line 3', data: { companyName: 'Acme' } }))).toBe(
      'Freezer line 3',
    )
  })

  it('falls back to the company for records saved before rename existed', () => {
    expect(assessmentTitle(rec({ data: { companyName: 'Acme Foods' } }))).toBe('Acme Foods')
  })

  it('falls back to the contact when there is no company', () => {
    expect(assessmentTitle(rec({ data: { name: 'Jane Rep' } }))).toBe('Jane Rep')
  })

  it('ignores a whitespace-only title', () => {
    expect(assessmentTitle(rec({ title: '   ', data: { companyName: 'Acme' } }))).toBe('Acme')
  })

  it('has a plain-language fallback for an empty record', () => {
    expect(assessmentTitle(rec())).toBe(UNTITLED)
  })
})

describe('assessmentSubtitle', () => {
  it('does not repeat whatever the title already showed', () => {
    const r = rec({ data: { companyName: 'Acme', name: 'Jane' } })
    expect(assessmentTitle(r)).toBe('Acme')
    expect(assessmentSubtitle(r)).toBe('Jane')
  })

  it('shows both when the title is a custom name', () => {
    const r = rec({ title: 'Line 3', data: { companyName: 'Acme', name: 'Jane' } })
    expect(assessmentSubtitle(r)).toBe('Acme — Jane')
  })

  it('is empty when there is nothing extra to say', () => {
    expect(assessmentSubtitle(rec())).toBe('')
  })
})

describe('duplicateTitle', () => {
  it('marks the copy without touching customer data', () => {
    expect(duplicateTitle(rec({ data: { companyName: 'Acme Foods' } }))).toBe('Acme Foods (Copy)')
  })

  it('builds on a custom name when there is one', () => {
    expect(duplicateTitle(rec({ title: 'Line 3' }))).toBe('Line 3 (Copy)')
  })
})

describe('assessmentSearchText', () => {
  it('matches on company, contact and custom name, case-insensitively', () => {
    const text = assessmentSearchText(
      rec({ title: 'Line 3', data: { companyName: 'Acme Foods', name: 'Jane Rep' } }),
    )
    expect(text).toContain('acme foods')
    expect(text).toContain('jane rep')
    expect(text).toContain('line 3')
  })

  it('does not crash on numeric or array answers', () => {
    expect(() =>
      assessmentSearchText(rec({ data: { beltSpeed: 40, heatSource: ['Oven'] } })),
    ).not.toThrow()
  })
})
