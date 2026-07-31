import { describe, it, expect } from 'vitest'
import { resolveNav, TOOLS, ROUTES } from './navigation'

describe('resolveNav', () => {
  it('gives the dashboard no back target', () => {
    const nav = resolveNav('/')
    expect(nav.backHref).toBeNull()
    expect(nav.backLabel).toBeNull()
  })

  it('sends the spiral eval list back to the dashboard', () => {
    expect(resolveNav('/spiral-eval')).toEqual({
      title: 'Spiral Eval',
      backHref: '/',
      backLabel: 'Tools',
    })
  })

  it('sends an individual evaluation back to the list, not the dashboard', () => {
    const nav = resolveNav('/spiral-eval/8ac1f0e2-0000-4000-8000-000000000000')
    expect(nav.backHref).toBe('/spiral-eval')
    expect(nav.backLabel).toBe('Spiral Eval')
  })

  it('tolerates a trailing slash', () => {
    expect(resolveNav('/spiral-eval/').backHref).toBe('/')
  })

  it('sends the ROI calculator back to the dashboard', () => {
    expect(resolveNav('/aim-glide').backHref).toBe('/')
  })

  it('still offers a way home from an unknown route', () => {
    expect(resolveNav('/nope/nothing-here').backHref).toBe('/')
  })

  // Every tool must be reachable and must resolve to a real nav context --
  // this is what stops a dashboard card pointing at a route that no longer
  // exists.
  it('every dashboard tool resolves to a non-dashboard screen', () => {
    for (const tool of TOOLS) {
      const nav = resolveNav(tool.href)
      expect(nav.backHref, `${tool.id} should not be the dashboard`).not.toBeNull()
      expect(nav.title).not.toBe('Not found')
    }
  })

  it('exposes the routes the router actually registers', () => {
    // The optional :section? is what lets the hub, each section screen, and
    // the review screen share one route -- and therefore one form instance.
    expect(Object.values(ROUTES)).toContain('/spiral-eval/:id/:section?')
  })

  it('sends a section screen back to that evaluation\'s checklist, not the list', () => {
    const nav = resolveNav('/spiral-eval/abc-123/application')
    expect(nav.backHref).toBe('/spiral-eval/abc-123')
    expect(nav.backLabel).toBe('Checklist')
    expect(nav.title).toBe('The application')
  })

  it('titles the review screen', () => {
    expect(resolveNav('/spiral-eval/abc-123/review').title).toBe('Review & send')
  })

  it('falls back gracefully on an unknown section slug', () => {
    const nav = resolveNav('/spiral-eval/abc-123/not-a-section')
    expect(nav.title).toBe('Evaluation')
    expect(nav.backHref).toBe('/spiral-eval/abc-123')
  })
})
