import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  getFormLayout,
  setFormLayout,
  evaluationHref,
  isFormLayout,
  DEFAULT_LAYOUT,
} from './formLayout'

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getFormLayout', () => {
  it('defaults to the section-by-section checklist', () => {
    expect(getFormLayout()).toBe('sections')
    expect(DEFAULT_LAYOUT).toBe('sections')
  })

  it('round-trips a saved preference', () => {
    setFormLayout('long')
    expect(getFormLayout()).toBe('long')
    setFormLayout('sections')
    expect(getFormLayout()).toBe('sections')
  })

  it('ignores a corrupt stored value rather than breaking the form', () => {
    localStorage.setItem('spiralEval.formLayout', 'nonsense')
    expect(getFormLayout()).toBe('sections')
  })

  // Private browsing and locked-down enterprise browsers can make localStorage
  // throw on access. A preference is never worth a blank screen.
  it('falls back to the default when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    })
    expect(getFormLayout()).toBe('sections')
    expect(() => setFormLayout('long')).not.toThrow()
  })
})

describe('evaluationHref', () => {
  it('sends the checklist preference to the hub', () => {
    expect(evaluationHref('abc', 'sections')).toBe('/spiral-eval/abc')
  })

  it('sends the long-page preference straight to the full form', () => {
    expect(evaluationHref('abc', 'long')).toBe('/spiral-eval/abc/all')
  })

  it('reads the saved preference when none is passed', () => {
    setFormLayout('long')
    expect(evaluationHref('abc')).toBe('/spiral-eval/abc/all')
  })
})

describe('isFormLayout', () => {
  it('accepts only the two known layouts', () => {
    expect(isFormLayout('sections')).toBe(true)
    expect(isFormLayout('long')).toBe(true)
    expect(isFormLayout('all')).toBe(false)
    expect(isFormLayout(null)).toBe(false)
    expect(isFormLayout(undefined)).toBe(false)
  })
})
