// Wearstrip profiles: the 12 from the Word worksheet, "Other", and the three
// OneTrack radius items. The profile tile grid, the dimension inputs, the PDF
// and the email text all read from here.
//
// The "quote as" options (OneTrack families) live here too, and take their
// colors and frame sizes from the catalog rather than restating them.

import { WEARSTRIP_ITEMS, type FrameSize, type WearstripFamily } from './catalog'

/** Dimensions a profile can ask for. RW / RT are the Word form's FW / FT. */
export type DimKey = 'W' | 'H' | 'RW' | 'RT' | 'O'

export const DIM_LABELS: Record<DimKey, string> = {
  W: 'Overall width',
  H: 'Overall height',
  RW: 'Support rail width',
  RT: 'Support rail thickness',
  O: 'Opening between the retaining lips',
}

export type ProfileGroup = 'flat' | 'flanged' | 'angle' | 'clip' | 'radius' | 'other'

export interface WearstripProfile {
  id: string
  label: string
  /** Under public/. Null for "Other" (the UI asks for a photo instead). */
  image: string | null
  group: ProfileGroup
  /** Set when the installed profile is itself a OneTrack catalog item. */
  family: WearstripFamily | null
  dims: readonly DimKey[]
  /** Which row of the tile grid it sits in. */
  row: 'standard' | 'radius'
}

const FLAT: readonly DimKey[] = ['W', 'H']
const CLIP: readonly DimKey[] = ['W', 'H', 'RW', 'RT', 'O']
const p = (n: string) => `/onetrack/profiles/${n}.png`

export const PROFILES: readonly WearstripProfile[] = [
  { id: 'standard-flat', label: 'Standard flat', image: p('01-standard-flat'), group: 'flat', family: null, dims: FLAT, row: 'standard' },
  { id: 'finger-joint-flat', label: 'Finger-joint flat', image: p('02-finger-joint-flat'), group: 'flat', family: null, dims: FLAT, row: 'standard' },
  { id: 'onetrack-flat', label: 'OneTrack flat', image: p('03-onetrack-flat'), group: 'flat', family: 'onetrackFlat', dims: FLAT, row: 'standard' },
  { id: 'onetrack-flanged', label: 'OneTrack flanged', image: p('04-onetrack-flanged'), group: 'flanged', family: 'onetrackFlanged', dims: FLAT, row: 'standard' },
  { id: 'standard-angle', label: 'Standard angle', image: p('05-standard-angle'), group: 'angle', family: null, dims: FLAT, row: 'standard' },
  { id: 'clip-on', label: 'Clip-on', image: p('06-clip-on'), group: 'clip', family: null, dims: CLIP, row: 'standard' },
  { id: 'clip-on-with-leg', label: 'Clip-on with leg', image: p('07-clip-on-with-leg'), group: 'clip', family: null, dims: CLIP, row: 'standard' },
  { id: 'guide-rail-snap-on', label: 'Guide rail snap-on', image: p('08-guide-rail-snap-on'), group: 'clip', family: null, dims: CLIP, row: 'standard' },
  { id: 'barbed-clip-on', label: 'Barbed clip-on', image: p('09-barbed-clip-on'), group: 'clip', family: null, dims: CLIP, row: 'standard' },
  { id: 'barbed-clip-on-with-leg', label: 'Barbed clip-on with leg', image: p('10-barbed-clip-on-with-leg'), group: 'clip', family: null, dims: CLIP, row: 'standard' },
  { id: 'standard-bar-snap-on', label: 'Standard bar snap-on', image: p('11-standard-bar-snap-on'), group: 'clip', family: null, dims: CLIP, row: 'standard' },
  { id: 'full-round-snap-on', label: 'Full-round snap-on', image: p('12-full-round-snap-on'), group: 'clip', family: null, dims: CLIP, row: 'standard' },
  { id: 'other', label: 'Other', image: null, group: 'other', family: null, dims: CLIP, row: 'standard' },
  { id: 'radius-center-rail', label: 'Radius center rail hold-down', image: '/onetrack/parts/radius-center-rail-render.png', group: 'radius', family: 'radiusCenterRail', dims: [], row: 'radius' },
  { id: 'radius-angled', label: 'Radius angled hold-down', image: '/onetrack/parts/radius-angled-render.png', group: 'radius', family: 'radiusAngled', dims: [], row: 'radius' },
  { id: 'radius-snap-on', label: 'Radius snap-on', image: '/onetrack/parts/snapon-3-8-render.png', group: 'radius', family: 'radiusSnapOn', dims: [], row: 'radius' },
]

export function getProfile(id: string | null | undefined): WearstripProfile | undefined {
  return id ? PROFILES.find((x) => x.id === id) : undefined
}

export interface FamilyDef {
  family: WearstripFamily
  label: string
  /** Intralox drawings shown under the option, under public/. Snap-on has one per frame size. */
  drawings: readonly string[]
  /** Which choice picks the part: color (flat / flanged) or frame thickness (radius). */
  option: 'color' | 'frame'
}

const d = (n: string) => `/onetrack/parts/${n}-drawing.png`

export const FAMILIES: readonly FamilyDef[] = [
  { family: 'onetrackFlat', label: 'OneTrack flat', drawings: [d('flat')], option: 'color' },
  { family: 'onetrackFlanged', label: 'OneTrack flanged', drawings: [d('flanged')], option: 'color' },
  { family: 'radiusCenterRail', label: 'OneTrack radius center rail hold-down', drawings: [d('radius-center-rail')], option: 'frame' },
  { family: 'radiusAngled', label: 'OneTrack radius angled hold-down', drawings: [d('radius-angled')], option: 'frame' },
  { family: 'radiusSnapOn', label: 'OneTrack radius snap-on', drawings: [d('snapon-3-16'), d('snapon-1-4'), d('snapon-3-8')], option: 'frame' },
]

export function getFamily(family: WearstripFamily): FamilyDef {
  const f = FAMILIES.find((x) => x.family === family)
  if (!f) throw new Error(`Unknown wearstrip family: ${family}`)
  return f
}

const fracValue = (f: FrameSize) => {
  const [n, den] = f.split('/').map(Number)
  return n / den
}

/** Colors the catalog offers for a family, in catalog order. */
export function colorsFor(family: WearstripFamily): ('Natural' | 'Blue')[] {
  return [...new Set(WEARSTRIP_ITEMS.filter((w) => w.family === family && !w.frameIn).map((w) => w.color))]
}

/** Frame thicknesses the catalog offers for a family, thinnest first. */
export function framesFor(family: WearstripFamily): FrameSize[] {
  const frames = WEARSTRIP_ITEMS.filter((w) => w.family === family && w.frameIn).map((w) => w.frameIn!)
  return [...new Set(frames)].sort((a, b) => fracValue(a) - fracValue(b))
}

/** "Quote as" choice: a OneTrack family, or ask CS to match what's installed. */
export type QuoteAs = WearstripFamily | 'match'

/** The options offered under a profile. Radius tiles are OneTrack items already. */
export function quoteAsOptions(profile: WearstripProfile): QuoteAs[] {
  if (profile.row === 'radius' && profile.family) return [profile.family]
  return ['onetrackFlat', 'onetrackFlanged', 'match']
}

/** Default: quote the same OneTrack item if that's what's installed; otherwise match. */
export function defaultQuoteAs(profile: WearstripProfile): QuoteAs {
  return profile.family ?? 'match'
}
