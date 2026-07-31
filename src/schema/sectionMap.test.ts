import { describe, it, expect } from 'vitest'
import { FORM_SECTIONS, sectionForField, getSectionBySlug } from './sectionMap'
import { QUESTION_FIELD_NAMES, REQUIRED_RULES, META_FIELD_NAMES } from './formSchema'

describe('FORM_SECTIONS', () => {
  // This is the test that stops the drift which broke the old completeness
  // module: add a field to the schema and forget the section map, and this
  // fails immediately instead of silently vanishing from the UI.
  it('covers every question field in the schema exactly once', () => {
    const mapped = FORM_SECTIONS.flatMap((s) => s.fields)
    const duplicates = mapped.filter((f, i) => mapped.indexOf(f) !== i)
    expect(duplicates, 'fields listed in more than one section').toEqual([])

    const missing = QUESTION_FIELD_NAMES.filter((f) => !mapped.includes(f))
    expect(missing, 'schema fields with no section').toEqual([])

    const unknown = mapped.filter((f) => !QUESTION_FIELD_NAMES.includes(f))
    expect(unknown, 'section fields that are not in the schema').toEqual([])
  })

  it('does not place meta fields on a screen', () => {
    const mapped = FORM_SECTIONS.flatMap((s) => s.fields) as string[]
    for (const meta of META_FIELD_NAMES) {
      expect(mapped).not.toContain(meta)
    }
  })

  it('has unique ids and slugs', () => {
    const ids = FORM_SECTIONS.map((s) => s.id)
    const slugs = FORM_SECTIONS.map((s) => s.slug)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('uses url-safe slugs', () => {
    for (const s of FORM_SECTIONS) {
      expect(s.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })

  // A required rule claiming a section the field doesn't actually live in
  // would send the "jump to this error" link to the wrong screen.
  it('every required rule agrees with the section map about where its field lives', () => {
    for (const rule of REQUIRED_RULES) {
      expect(sectionForField(rule.field), `${rule.field}`).toBe(rule.section)
    }
  })

  it('every section has at least one field and a blurb', () => {
    for (const s of FORM_SECTIONS) {
      expect(s.fields.length).toBeGreaterThan(0)
      expect(s.blurb.length).toBeGreaterThan(0)
      expect(s.title.length).toBeGreaterThan(0)
    }
  })

  it('resolves a section by slug', () => {
    expect(getSectionBySlug('application')?.id).toBe('application')
    expect(getSectionBySlug('nope')).toBeUndefined()
  })
})
