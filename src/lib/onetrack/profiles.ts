// Wearstrip profiles: the 12 from the Word worksheet, "Other", the radius
// hold-downs, and the stainless steel-backed strips. Pictures come from the
// documents the parts are sold from -- the engineering manual (pp.470-475)
// or the OneTrack menu -- not the Word worksheet's renders, whose shapes
// differ from what Intralox makes. Standard flat has no drawing in either,
// so it keeps the worksheet's picture. The profile tile grid,
// the dimension inputs, the PDF and the email text all read from here.
//
// The "quote as" options (wearstrip families) live here too, and take their
// colors, materials and frame sizes from the catalog rather than restating them.

import { WEARSTRIP_ITEMS, type FrameSize, type WearstripFamily, type WearstripMaterial } from './catalog'

/** Dimensions a profile can ask for. RW / RT are the Word form's FW / FT. */
export type DimKey = 'W' | 'H' | 'RW' | 'RT' | 'O'

export const DIM_LABELS: Record<DimKey, string> = {
  W: 'Overall width',
  H: 'Overall height',
  RW: 'Support rail width',
  RT: 'Support rail thickness',
  O: 'Opening between the retaining lips',
}

/** 'fixed' = a catalog part with one size: nothing to measure. */
export type ProfileGroup = 'flat' | 'flanged' | 'angle' | 'clip' | 'radius' | 'fixed' | 'other'

export interface WearstripProfile {
  id: string
  label: string
  /** Under public/. Null for "Other" (the UI asks for a photo instead). */
  image: string | null
  group: ProfileGroup
  /** Set when the installed profile is itself a catalog part (OneTrack or Intralox). */
  family: WearstripFamily | null
  dims: readonly DimKey[]
  /** Where a dimension means something more specific than DIM_LABELS says. */
  dimLabels?: Partial<Record<DimKey, string>>
  /** Which row of the tile grid it sits in. */
  row: 'standard' | 'radius' | 'ssBacked'
}

export function dimLabel(profile: WearstripProfile | undefined, k: DimKey): string {
  return profile?.dimLabels?.[k] ?? DIM_LABELS[k]
}

const FLAT: readonly DimKey[] = ['W', 'H']
const CLIP: readonly DimKey[] = ['W', 'H', 'RW', 'RT', 'O']
const p = (n: string) => `/onetrack/profiles/${n}.png`
const m = (n: string) => `/onetrack/manual/${n}.png`

export const PROFILES: readonly WearstripProfile[] = [
  { id: 'standard-flat', label: 'Standard flat', image: p('01-standard-flat'), group: 'flat', family: null, dims: FLAT, row: 'standard' },
  { id: 'finger-joint-flat', label: 'Finger-joint flat', image: m('finger-joint-flat'), group: 'flat', family: null, dims: FLAT, row: 'standard' },
  { id: 'onetrack-flat', label: 'OneTrack flat', image: '/onetrack/parts/flat-render.png', group: 'flat', family: 'onetrackFlat', dims: FLAT, row: 'standard' },
  {
    id: 'onetrack-flanged',
    label: 'OneTrack flanged',
    image: '/onetrack/parts/flanged-render.png',
    group: 'flanged',
    family: 'onetrackFlanged',
    dims: FLAT,
    dimLabels: { W: 'Overall width, flange included', H: 'Height to the wear surface (not the flange top)' },
    row: 'standard',
  },
  { id: 'standard-angle', label: 'Standard angle', image: m('standard-angle'), group: 'angle', family: 'standardAngle', dims: FLAT, row: 'standard' },
  { id: 'clip-on', label: 'Clip-on', image: m('clip-on'), group: 'clip', family: 'clipOn', dims: CLIP, row: 'standard' },
  { id: 'clip-on-with-leg', label: 'Clip-on with leg', image: m('clip-on-with-leg'), group: 'clip', family: 'clipOnLeg', dims: CLIP, row: 'standard' },
  { id: 'guide-rail-snap-on', label: 'Guide rail snap-on', image: m('guide-rail-snap-on'), group: 'clip', family: 'guideRailSnapOn', dims: CLIP, row: 'standard' },
  { id: 'barbed-clip-on', label: 'Barbed clip-on', image: m('barbed-clip-on'), group: 'clip', family: 'barbedClipOn', dims: CLIP, row: 'standard' },
  { id: 'barbed-clip-on-with-leg', label: 'Barbed clip-on with leg', image: m('barbed-clip-on-with-leg'), group: 'clip', family: 'barbedClipOnLeg', dims: CLIP, row: 'standard' },
  { id: 'standard-bar-snap-on', label: 'Standard bar snap-on', image: m('standard-bar-snap-on'), group: 'clip', family: 'standardBarSnapOn', dims: CLIP, row: 'standard' },
  { id: 'full-round-snap-on', label: 'Full-round snap-on', image: m('full-round-snap-on'), group: 'clip', family: 'fullRoundSnapOn', dims: CLIP, row: 'standard' },
  { id: 'other', label: 'Other', image: null, group: 'other', family: null, dims: CLIP, row: 'standard' },
  { id: 'radius-center-rail', label: 'Radius center rail hold-down', image: '/onetrack/parts/radius-center-rail-render.png', group: 'radius', family: 'radiusCenterRail', dims: [], row: 'radius' },
  { id: 'radius-angled', label: 'Radius angled hold-down', image: '/onetrack/parts/radius-angled-render.png', group: 'radius', family: 'radiusAngled', dims: [], row: 'radius' },
  { id: 'radius-snap-on', label: 'Radius snap-on', image: '/onetrack/parts/snapon-3-8-render.png', group: 'radius', family: 'radiusSnapOn', dims: [], row: 'radius' },
  { id: 'radius-standard-edge', label: 'Radius standard edge hold-down', image: m('radius-standard-edge'), group: 'radius', family: 'radiusStandardEdge', dims: [], row: 'radius' },
  { id: 'radius-tabbed-edge', label: 'Radius tabbed edge hold-down', image: m('radius-tabbed-edge'), group: 'radius', family: 'radiusTabbedEdge', dims: [], row: 'radius' },
  { id: 's2400-hold-down', label: 'Series 2400 hold-down guide', image: m('s2400-hold-down'), group: 'radius', family: 's2400HoldDown', dims: [], row: 'radius' },
  { id: 'ss-backed-t', label: 'Stainless-backed T (flat)', image: m('ss-backed'), group: 'fixed', family: 'ssBackedT', dims: [], row: 'ssBacked' },
  { id: 'ss-backed-l', label: 'Stainless-backed L (with leg)', image: m('ss-backed'), group: 'fixed', family: 'ssBackedL', dims: [], row: 'ssBacked' },
]

export function getProfile(id: string | null | undefined): WearstripProfile | undefined {
  return id ? PROFILES.find((x) => x.id === id) : undefined
}

export interface FamilyDef {
  family: WearstripFamily
  label: string
  /** Intralox drawings shown under the option, under public/. Snap-on has one per frame size. */
  drawings: readonly string[]
  /** OneTrack-branded, or a standard Intralox wearstrip from the engineering manual. */
  brand: 'OneTrack' | 'Intralox'
}

const d = (n: string) => `/onetrack/parts/${n}-drawing.png`

export const FAMILIES: readonly FamilyDef[] = [
  { family: 'onetrackFlat', label: 'OneTrack flat', drawings: [d('flat')], brand: 'OneTrack' },
  { family: 'onetrackFlanged', label: 'OneTrack flanged', drawings: [d('flanged')], brand: 'OneTrack' },
  { family: 'radiusCenterRail', label: 'OneTrack radius center rail hold-down', drawings: [d('radius-center-rail')], brand: 'OneTrack' },
  { family: 'radiusAngled', label: 'OneTrack radius angled hold-down', drawings: [d('radius-angled')], brand: 'OneTrack' },
  { family: 'radiusSnapOn', label: 'OneTrack radius snap-on', drawings: [d('snapon-3-16'), d('snapon-1-4'), d('snapon-3-8')], brand: 'OneTrack' },
  { family: 'standardAngle', label: 'Intralox standard angle', drawings: [m('standard-angle')], brand: 'Intralox' },
  { family: 'clipOn', label: 'Intralox clip-on', drawings: [m('clip-on')], brand: 'Intralox' },
  { family: 'clipOnLeg', label: 'Intralox clip-on with leg', drawings: [m('clip-on-with-leg')], brand: 'Intralox' },
  { family: 'guideRailSnapOn', label: 'Intralox guide rail snap-on', drawings: [m('guide-rail-snap-on')], brand: 'Intralox' },
  { family: 'barbedClipOn', label: 'Intralox barbed clip-on', drawings: [m('barbed-clip-on')], brand: 'Intralox' },
  { family: 'barbedClipOnLeg', label: 'Intralox barbed clip-on with leg', drawings: [m('barbed-clip-on-with-leg')], brand: 'Intralox' },
  { family: 'standardBarSnapOn', label: 'Intralox standard bar snap-on', drawings: [m('standard-bar-snap-on')], brand: 'Intralox' },
  { family: 'fullRoundSnapOn', label: 'Intralox full round snap-on', drawings: [m('full-round-snap-on')], brand: 'Intralox' },
  { family: 'ssBackedT', label: 'Intralox stainless steel-backed T (flat)', drawings: [m('ss-backed'), m('ss-clip-nut')], brand: 'Intralox' },
  { family: 'ssBackedL', label: 'Intralox stainless steel-backed L (with leg)', drawings: [m('ss-backed'), m('ss-clip-nut')], brand: 'Intralox' },
  { family: 'radiusStandardEdge', label: 'Radius standard edge hold-down', drawings: [m('radius-standard-edge')], brand: 'Intralox' },
  { family: 'radiusTabbedEdge', label: 'Radius tabbed edge hold-down', drawings: [m('radius-tabbed-edge')], brand: 'Intralox' },
  { family: 's2400HoldDown', label: 'Series 2400 hold-down guide', drawings: [m('s2400-hold-down')], brand: 'Intralox' },
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

const itemsOf = (family: WearstripFamily) => WEARSTRIP_ITEMS.filter((w) => w.family === family)

/** Frame thicknesses the catalog offers for a family, thinnest first. Empty = not a choice. */
export function framesFor(family: WearstripFamily): FrameSize[] {
  const frames = itemsOf(family).flatMap((w) => (w.frameIn ? [w.frameIn] : []))
  return [...new Set(frames)].sort((a, b) => fracValue(a) - fracValue(b))
}

/** Materials the catalog offers for a family (UHMW-PE first). One entry = not a choice. */
export function materialsFor(family: WearstripFamily): WearstripMaterial[] {
  return [...new Set(itemsOf(family).map((w) => w.material))].sort((a) => (a === 'UHMW-PE' ? -1 : 1))
}

/**
 * Colors left to choose between once the material is known. Oil-filled is
 * always grey, so radius parts never ask; OneTrack flat / flanged ask
 * natural or blue.
 */
export function colorsFor(family: WearstripFamily, material?: WearstripMaterial | null): string[] {
  const twoMaterials = materialsFor(family).length > 1
  // The material decides the color there; nothing to ask until it's picked.
  if (twoMaterials && !material) return []
  const list = itemsOf(family).filter((w) => !twoMaterials || w.material === material)
  return [...new Set(list.map((w) => w.color))]
}

/** "Quote as" choice: a catalog family, or ask CS to match what's installed. */
export type QuoteAs = WearstripFamily | 'match'

const ONETRACK_STRAIGHT: QuoteAs[] = ['onetrackFlat', 'onetrackFlanged']

/**
 * The options offered under a profile. Radius and stainless-backed tiles are
 * catalog parts already. A Word-form profile that Intralox makes offers that
 * same part first, then OneTrack, then a match.
 */
export function quoteAsOptions(profile: WearstripProfile): QuoteAs[] {
  if ((profile.row === 'radius' || profile.row === 'ssBacked') && profile.family) return [profile.family]
  if (profile.family && !ONETRACK_STRAIGHT.includes(profile.family)) return [profile.family, ...ONETRACK_STRAIGHT, 'match']
  return [...ONETRACK_STRAIGHT, 'match']
}

/** Default: quote the same part if that's what's installed; otherwise match. */
export function defaultQuoteAs(profile: WearstripProfile): QuoteAs {
  return profile.family ?? 'match'
}
