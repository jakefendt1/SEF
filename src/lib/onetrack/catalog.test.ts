import { describe, it, expect } from 'vitest'
import { CATALOG, WEARSTRIP_ITEMS, findWearstrip, getItem, itemsIn } from './catalog'
import { CATEGORIES } from './categories'
import { FAMILIES, PROFILES, colorsFor, framesFor, materialsFor, quoteAsOptions, defaultQuoteAs, getProfile } from './profiles'

// Every file under public/onetrack, as "/onetrack/..." (the path the app uses).
const PUBLIC_FILES = new Set(
  Object.keys(import.meta.glob('/public/onetrack/**/*.{png,jpg}')).map((k) => k.replace(/^\/public/, '')),
)

describe('catalog', () => {
  it('C1: every part number is well-formed and unique', () => {
    const pns = CATALOG.map((i) => i.partNumber).filter((p): p is string => p !== null)
    // The manual prints the eight clip-on / angle numbers (p.472) without a -00
    // suffix; they're kept as printed. Everything else carries one.
    for (const pn of pns) expect(pn).toMatch(/^[A-Z0-9]{12}(-\d{2})?$/)
    expect(pns.filter((pn) => !pn.includes('-')).sort()).toEqual(
      ['B6XX21IXXWMV', 'B6XX23IXXWMV', 'B6XX24IXXWMV', 'B6XX25IXXWMV', 'B6XX26IXXWMV', 'B6XX27IXXWMV', 'B6XX28IXXWMV', 'B6XX29IXXWMV'],
    )
    expect(new Set(pns).size).toBe(pns.length)
  })

  it("C3: carries the menu (95) and the manual's wearstrip pages (25 more), plus 4 CS-quoted items", () => {
    // 95 = Onetrack/data/onetrack-catalog.json. 25 = engineering manual
    // pp.470-475 less the four radius parts the menu already lists:
    // 8 clip-on/angle + 2 stainless-backed + 1 clip & nut + 8 standard/tabbed
    // edge + 4 oil-filled angled/center rail + 2 S2400.
    expect(CATALOG.filter((i) => i.partNumber !== null)).toHaveLength(120)
    expect(CATALOG.filter((i) => i.source === 'manual' && i.partNumber)).toHaveLength(25)
    expect(itemsIn('quoteOnly')).toHaveLength(4)
    expect(new Set(CATALOG.map((i) => i.id)).size).toBe(CATALOG.length)
  })

  it('C3: spot-checks part numbers against the printed menu', () => {
    expect(getItem('s3f8m2che7ng-00')?.description).toContain('S1600, 12 teeth')
    expect(getItem('c3sf125xxxxx-00')?.series).toContain('1600')
    expect(getItem('a3exxx1d5imt-10')?.attrs).toEqual({ shaft: 'Square', size: '1-1/2 in', type: 'Heavy-duty split' })
    // p.11 codes as printed (Jake, 2026-10-05: trust each page).
    expect(getItem('d6xxb1ewe7jt-00')?.attrs.shaft).toBe('1 in')
    expect(getItem('d6xxb1ewl6jt-00')?.attrs.shaft).toBe('1.5 in')
  })

  it('C5: every item sits in a real category, and every category has items', () => {
    const ids = CATEGORIES.map((c) => c.id)
    for (const item of CATALOG) expect(ids).toContain(item.category)
    for (const c of CATEGORIES) expect(itemsIn(c.id).length, c.id).toBeGreaterThan(0)
  })

  it('C5: every filter chip key exists on every item in its category', () => {
    for (const c of CATEGORIES) {
      for (const f of c.filters) {
        for (const item of itemsIn(c.id)) expect(item.attrs[f.key], `${item.id}.${f.key}`).toBeTruthy()
      }
    }
  })

  it('D1: every item has a description and a unit; rings and spacers sell singly', () => {
    for (const item of CATALOG) {
      expect(item.description.trim(), item.id).not.toBe('')
      expect(item.uom.trim(), item.id).not.toBe('')
    }
    for (const item of [...itemsIn('retainerRings'), ...itemsIn('sprocketSpacers')]) expect(item.uom).toBe('each')
    for (const item of itemsIn('beltPullers')) expect(item.uom).toBe('set')
  })

  it('D1: builds descriptions from the menu tables', () => {
    expect(getItem('s3f8m2che7ng-00')?.description).toBe(
      'CleanLock sprocket, S1600, 12 teeth, 3.9 in (99 mm) PD, 1.5 in square bore',
    )
    expect(getItem('d6xxa9eym5jq-00')?.description).toBe(
      'Flanged roller, 4 in OD × 1.75 in wide, 0.5 in flange, 1 in round shaft, UHMW-PE, blue',
    )
    expect(getItem('saxxaaxxe7zv-00')?.description).toBe(
      'Sprocket spacer, 1.5 in square bore, 1.5 in wide, XRD AC',
    )
  })

  it('quote-only items have no part number and tell the rep what CS needs', () => {
    for (const item of itemsIn('quoteOnly')) {
      expect(item.partNumber).toBeNull()
      expect(item.notePrompt?.trim()).toBeTruthy()
    }
  })

  it('snap-on is sold in 500 ft lengths; everything else in 10 ft sections', () => {
    for (const w of WEARSTRIP_ITEMS) {
      if (w.family === 'radiusSnapOn') {
        expect(w.stockLengthIn).toBe(6000)
        expect(w.uom).toBe('500 ft length')
      } else {
        expect(w.stockLengthIn).toBe(120)
        expect(w.uom).toBe('10 ft section')
      }
    }
  })
})

describe('wearstrip part lookup', () => {
  it('B9: flat by color', () => {
    expect(findWearstrip('onetrackFlat', { color: 'Natural' })?.partNumber).toBe('B6XX86IXXWMV-00')
    expect(findWearstrip('onetrackFlat', { color: 'Blue' })?.partNumber).toBe('B6XX86IXXWJQ-00')
  })

  it('B10: flanged blue', () => {
    expect(findWearstrip('onetrackFlanged', { color: 'Blue' })?.partNumber).toBe('B6XX87IXXWJQ-00')
  })

  it('B11: radius parts by frame thickness and material', () => {
    const uhmw = 'UHMW-PE' as const
    const oil = 'Oil-filled UHMW-PE' as const
    expect(findWearstrip('radiusCenterRail', { frameIn: '3/16', material: uhmw })?.partNumber).toBe('B6XX40IXXWMV-00')
    expect(findWearstrip('radiusCenterRail', { frameIn: '3/16', material: oil })?.partNumber).toBe('B6XX40IXXWMW-00')
    expect(findWearstrip('radiusAngled', { frameIn: '1/8', material: uhmw })?.partNumber).toBe('B6XX37IXXWMV-00')
    expect(findWearstrip('radiusSnapOn', { frameIn: '1/4' })?.partNumber).toBe('B6XX53IXXZMV-00')
    // Without a material, a family that has two can't pick a part.
    expect(findWearstrip('radiusAngled', { frameIn: '1/8' })).toBeNull()
  })

  it("B14: the manual's wearstrips", () => {
    expect(findWearstrip('clipOn', {})?.partNumber).toBe('B6XX25IXXWMV')
    expect(findWearstrip('fullRoundSnapOn', {})?.partNumber).toBe('B6XX29IXXWMV')
    expect(findWearstrip('ssBackedL', {})?.partNumber).toBe('B6XX43IXXWMV-00')
    expect(findWearstrip('radiusTabbedEdge', { frameIn: '1/8', material: 'UHMW-PE' })?.partNumber).toBe('B6XX39IXXWMV-20')
    expect(findWearstrip('radiusStandardEdge', { frameIn: '3/16', material: 'Oil-filled UHMW-PE' })?.partNumber).toBe('B6XX32IXXWMW-00')
    expect(findWearstrip('s2400HoldDown', { frameIn: '3/16' })?.partNumber).toBe('B6F547IXXWMV-00')
    expect(getItem('mf-clip-on')).toMatchObject({ source: 'manual', page: 472, uom: '10 ft section' })
  })

  it('no part number appears twice, menu and manual together', () => {
    const pns = CATALOG.map((i) => i.partNumber).filter(Boolean)
    expect(new Set(pns).size).toBe(pns.length)
  })

  it('returns null for a combination the menu does not list', () => {
    expect(findWearstrip('radiusSnapOn', { frameIn: '1/8' })).toBeNull()
    expect(findWearstrip('onetrackFlat', { color: null })).toBeNull()
  })

  it('offers the options the catalog actually has', () => {
    expect(colorsFor('onetrackFlat')).toEqual(['Natural', 'Blue'])
    expect(framesFor('radiusCenterRail')).toEqual(['1/8', '3/16'])
    expect(framesFor('radiusSnapOn')).toEqual(['3/16', '1/4', '3/8'])
    expect(materialsFor('radiusCenterRail')).toEqual(['UHMW-PE', 'Oil-filled UHMW-PE'])
    expect(materialsFor('s2400HoldDown')).toEqual(['UHMW-PE'])
    expect(colorsFor('radiusCenterRail', 'Oil-filled UHMW-PE')).toEqual(['Grey'])
    expect(framesFor('clipOn')).toEqual([])
  })
})

describe('profiles', () => {
  it('C2: every picture the tool shows exists under public/', () => {
    const paths = [
      ...PROFILES.map((p) => p.image).filter((x): x is string => x !== null),
      ...FAMILIES.flatMap((f) => f.drawings),
      ...CATEGORIES.map((c) => c.image).filter((x): x is string => x !== null),
      ...CATALOG.map((i) => i.image).filter((x): x is string => !!x),
    ]
    expect(PUBLIC_FILES.size).toBeGreaterThan(0)
    for (const path of paths) expect(PUBLIC_FILES.has(path), path).toBe(true)
  })

  it('every part outside wearstrip has a picture from the menu', () => {
    // The tape is the one part the manual doesn't picture.
    for (const item of CATALOG.filter((i) => i.category !== 'wearstrip' && i.id !== 'quote-uhmw-tape')) {
      expect(item.image, item.id).toBeTruthy()
    }
    expect(getItem('a3dxxx001imt-00')?.image).toBe('/onetrack/menu/ring-snap.jpg')
    expect(getItem('a3exxx002imt-00')?.image).toBe('/onetrack/menu/ring-split.jpg')
  })

  it('C2: 12 worksheet profiles + Other, 6 radius, 2 stainless-backed, each with a dimension list', () => {
    expect(PROFILES.filter((p) => p.row === 'standard')).toHaveLength(13)
    expect(PROFILES.filter((p) => p.row === 'radius')).toHaveLength(6)
    expect(PROFILES.filter((p) => p.row === 'ssBacked')).toHaveLength(2)
    for (const p of PROFILES) {
      expect(Array.isArray(p.dims)).toBe(true)
      if (p.row !== 'standard') expect(p.dims).toEqual([])
      else expect(p.dims.slice(0, 2)).toEqual(['W', 'H'])
    }
    // Every Word-form profile Intralox makes now points at its part.
    for (const id of ['standard-angle', 'clip-on', 'clip-on-with-leg', 'guide-rail-snap-on', 'barbed-clip-on', 'barbed-clip-on-with-leg', 'standard-bar-snap-on', 'full-round-snap-on']) {
      expect(getProfile(id)?.family, id).toBeTruthy()
    }
  })

  it('defaults "quote as" to the installed OneTrack item, else to match', () => {
    expect(defaultQuoteAs(getProfile('onetrack-flat')!)).toBe('onetrackFlat')
    expect(defaultQuoteAs(getProfile('clip-on')!)).toBe('clipOn')
    expect(defaultQuoteAs(getProfile('standard-flat')!)).toBe('match')
    expect(quoteAsOptions(getProfile('radius-snap-on')!)).toEqual(['radiusSnapOn'])
    expect(quoteAsOptions(getProfile('clip-on')!)).toEqual(['clipOn', 'onetrackFlat', 'onetrackFlanged', 'match'])
    expect(quoteAsOptions(getProfile('standard-flat')!)).toEqual(['onetrackFlat', 'onetrackFlanged', 'match'])
  })
})
