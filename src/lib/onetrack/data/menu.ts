// The OneTrack menu (Intralox "OneTrack Tools and Components", 5018341),
// transcribed from Onetrack/data/onetrack-catalog.json, plus the wearstrip
// pages of the 2026 Engineering Manual, Modular Plastic Belts, pp. 470-475
// (Onetrack/full wearstrip catagog.pdf). Part numbers are verbatim; `page` is
// the printed page number, in the menu unless `source` says 'manual'.
//
// Raw rows only. `../catalog.ts` turns them into the one CatalogItem shape the
// app uses. Change a part number here and nowhere else.

export type WearstripFamily =
  | 'onetrackFlat'
  | 'onetrackFlanged'
  | 'radiusCenterRail'
  | 'radiusAngled'
  | 'radiusSnapOn'
  // Engineering manual p.472: the Word worksheet's clip-on and snap-on profiles.
  | 'standardAngle'
  | 'clipOn'
  | 'clipOnLeg'
  | 'guideRailSnapOn'
  | 'barbedClipOn'
  | 'barbedClipOnLeg'
  | 'standardBarSnapOn'
  | 'fullRoundSnapOn'
  // p.473
  | 'ssBackedT'
  | 'ssBackedL'
  // pp.474-475
  | 'radiusStandardEdge'
  | 'radiusTabbedEdge'
  | 's2400HoldDown'

export type FrameSize = '1/8' | '3/16' | '1/4' | '3/8'
export type WearstripMaterial = 'UHMW-PE' | 'Oil-filled UHMW-PE'
export type Source = 'menu' | 'manual'

export interface RawWearstrip {
  id: string
  family: WearstripFamily
  description: string
  color: 'Natural' | 'Blue' | 'Grey'
  /** Absent = UHMW-PE. Oil-filled is the self-lubricating grey grade. */
  material?: WearstripMaterial
  lengthFt: number
  uom: string
  dims?: { widthIn: number; heightIn: number; flangeWidthIn?: number; flangeHeightIn?: number }
  frameIn?: FrameSize
  partNumber: string
  page: number
  source?: Source
}

export interface RawDescribed {
  description: string
  partNumber: string
  page: number
  source?: Source
}

export interface RawPuller extends RawDescribed {
  series: readonly string[]
}

export interface RawSprocket {
  series: string
  teeth: number
  pd: string
  bore: string
  partNumber: string
  page: number
}

export interface RawCleanLockRoller {
  od: string
  width: string
  squareShaft: string
  material: string
  color: string
  partNumber: string
  page: number
}

export interface RawStraightRoller {
  od: string
  width: string
  roundShaft: string
  material: string
  color: string
  partNumber: string
  page: number
}

export interface RawFlangedRoller extends RawStraightRoller {
  flangeHeight: string
}

export interface RawRetainerRing extends RawDescribed {
  type: 'Heavy-duty split' | 'Snap ring'
  shaft: 'Round' | 'Square'
  size: string
}

export interface RawSpacer {
  squareBore: string
  width: string
  material: string
  partNumber: string
  page: number
}

export interface RawQuoteOnly {
  id: string
  description: string
  /** What the menu says about it. */
  note: string
  /** What CS needs from the rep, shown as the prompt for the line's note. */
  prompt: string
  page: number
  source?: Source
}


export const WEARSTRIPS: readonly RawWearstrip[] = [
  { id: 'ot-flat-natural', family: 'onetrackFlat', description: 'OneTrack UHMW-PE flat wearstrip, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', dims: { widthIn: 1, heightIn: 1.5 }, partNumber: 'B6XX86IXXWMV-00', page: 15 },
  { id: 'ot-flat-blue', family: 'onetrackFlat', description: 'OneTrack UHMW-PE flat wearstrip, blue', color: 'Blue', lengthFt: 10, uom: '10 ft section', dims: { widthIn: 1, heightIn: 1.5 }, partNumber: 'B6XX86IXXWJQ-00', page: 15 },
  { id: 'ot-flanged-natural', family: 'onetrackFlanged', description: 'OneTrack UHMW-PE flanged wearstrip, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', dims: { widthIn: 1, heightIn: 1.5, flangeWidthIn: 0.25, flangeHeightIn: 0.5 }, partNumber: 'B6XX87IXXWMV-00', page: 15 },
  { id: 'ot-flanged-blue', family: 'onetrackFlanged', description: 'OneTrack UHMW-PE flanged wearstrip, blue', color: 'Blue', lengthFt: 10, uom: '10 ft section', dims: { widthIn: 1, heightIn: 1.5, flangeWidthIn: 0.25, flangeHeightIn: 0.5 }, partNumber: 'B6XX87IXXWJQ-00', page: 15 },
  { id: 'ot-radius-center-1-8', family: 'radiusCenterRail', description: 'OneTrack radius center rail hold-down wearstrip, 1/8 in frame, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', frameIn: '1/8', partNumber: 'B6XX41IXXWMV-00', page: 16 },
  { id: 'ot-radius-center-3-16', family: 'radiusCenterRail', description: 'OneTrack radius center rail hold-down wearstrip, 3/16 in frame, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', frameIn: '3/16', partNumber: 'B6XX40IXXWMV-00', page: 16 },
  { id: 'ot-radius-angled-1-8', family: 'radiusAngled', description: 'OneTrack radius angled hold-down wearstrip, 1/8 in frame, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', frameIn: '1/8', partNumber: 'B6XX37IXXWMV-00', page: 16 },
  { id: 'ot-radius-angled-3-16', family: 'radiusAngled', description: 'OneTrack radius angled hold-down wearstrip, 3/16 in frame, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', frameIn: '3/16', partNumber: 'B6XX36IXXWMV-00', page: 16 },
  { id: 'ot-snapon-3-16', family: 'radiusSnapOn', description: 'OneTrack radius snap-on wearstrip, 3/16 in frame, natural', color: 'Natural', lengthFt: 500, uom: '500 ft length', frameIn: '3/16', partNumber: 'B6XX51IXXZMV-00', page: 17 },
  { id: 'ot-snapon-3-8', family: 'radiusSnapOn', description: 'OneTrack radius snap-on wearstrip, 3/8 in frame, natural', color: 'Natural', lengthFt: 500, uom: '500 ft length', frameIn: '3/8', partNumber: 'B6XX52IXXZMV-00', page: 17 },
  { id: 'ot-snapon-1-4', family: 'radiusSnapOn', description: 'OneTrack radius snap-on wearstrip, 1/4 in frame, natural', color: 'Natural', lengthFt: 500, uom: '500 ft length', frameIn: '1/4', partNumber: 'B6XX53IXXZMV-00', page: 17 },

  // ---- Engineering manual, pp.472-475 -----------------------------------
  // Clip-on and angle styles are sold in 120 in lengths (p.471). The manual
  // prints these eight part numbers without a -00 suffix; kept as printed.
  { id: 'mf-standard-angle', family: 'standardAngle', description: 'Standard angle UHMW-PE wearstrip, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', partNumber: 'B6XX21IXXWMV', page: 472, source: 'manual' },
  { id: 'mf-clip-on', family: 'clipOn', description: 'Clip-on UHMW-PE wearstrip, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', partNumber: 'B6XX25IXXWMV', page: 472, source: 'manual' },
  { id: 'mf-clip-on-leg', family: 'clipOnLeg', description: 'Clip-on with leg UHMW-PE wearstrip, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', partNumber: 'B6XX26IXXWMV', page: 472, source: 'manual' },
  { id: 'mf-guide-rail-snap-on', family: 'guideRailSnapOn', description: 'Guide rail snap-on UHMW-PE wearstrip, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', partNumber: 'B6XX27IXXWMV', page: 472, source: 'manual' },
  { id: 'mf-barbed-clip-on', family: 'barbedClipOn', description: 'Barbed clip-on UHMW-PE wearstrip, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', partNumber: 'B6XX23IXXWMV', page: 472, source: 'manual' },
  { id: 'mf-barbed-clip-on-leg', family: 'barbedClipOnLeg', description: 'Barbed clip-on with leg UHMW-PE wearstrip, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', partNumber: 'B6XX24IXXWMV', page: 472, source: 'manual' },
  { id: 'mf-standard-bar-snap-on', family: 'standardBarSnapOn', description: 'Standard bar snap-on UHMW-PE wearstrip, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', partNumber: 'B6XX28IXXWMV', page: 472, source: 'manual' },
  { id: 'mf-full-round-snap-on', family: 'fullRoundSnapOn', description: 'Full round snap-on UHMW-PE wearstrip, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', partNumber: 'B6XX29IXXWMV', page: 472, source: 'manual' },
  { id: 'mf-ss-backed-t', family: 'ssBackedT', description: 'Stainless steel-backed T clip-on UHMW-PE wearstrip (flat), 120 in', color: 'Natural', lengthFt: 10, uom: '10 ft section', partNumber: 'B6XX42IXXWMV-00', page: 473, source: 'manual' },
  { id: 'mf-ss-backed-l', family: 'ssBackedL', description: 'Stainless steel-backed L clip-on with leg UHMW-PE wearstrip (flanged), 120 in', color: 'Natural', lengthFt: 10, uom: '10 ft section', partNumber: 'B6XX43IXXWMV-00', page: 473, source: 'manual' },
  // Radius belt wearstrips. The manual gives no length for these; 10 ft is
  // assumed to match the OneTrack radius hold-downs above. Confirm with CS.
  { id: 'mf-radius-standardedge-1-8', family: 'radiusStandardEdge', description: 'Radius standard edge hold-down wearstrip, 1/8 in frame, UHMW-PE, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', frameIn: '1/8', partNumber: 'B6XX33IXXWMV-00', page: 474, source: 'manual' },
  { id: 'mf-radius-standardedge-3-16', family: 'radiusStandardEdge', description: 'Radius standard edge hold-down wearstrip, 3/16 in frame, UHMW-PE, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', frameIn: '3/16', partNumber: 'B6XX32IXXWMV-00', page: 474, source: 'manual' },
  { id: 'mf-radius-standardedge-1-8-oil', family: 'radiusStandardEdge', description: 'Radius standard edge hold-down wearstrip, 1/8 in frame, oil-filled UHMW-PE, grey', color: 'Grey', material: 'Oil-filled UHMW-PE', lengthFt: 10, uom: '10 ft section', frameIn: '1/8', partNumber: 'B6XX33IXXWMW-00', page: 474, source: 'manual' },
  { id: 'mf-radius-standardedge-3-16-oil', family: 'radiusStandardEdge', description: 'Radius standard edge hold-down wearstrip, 3/16 in frame, oil-filled UHMW-PE, grey', color: 'Grey', material: 'Oil-filled UHMW-PE', lengthFt: 10, uom: '10 ft section', frameIn: '3/16', partNumber: 'B6XX32IXXWMW-00', page: 474, source: 'manual' },
  { id: 'mf-radius-tabbededge-1-8', family: 'radiusTabbedEdge', description: 'Radius tabbed edge hold-down wearstrip, 1/8 in frame, UHMW-PE, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', frameIn: '1/8', partNumber: 'B6XX39IXXWMV-20', page: 474, source: 'manual' },
  { id: 'mf-radius-tabbededge-3-16', family: 'radiusTabbedEdge', description: 'Radius tabbed edge hold-down wearstrip, 3/16 in frame, UHMW-PE, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', frameIn: '3/16', partNumber: 'B6XX38IXXWMV-10', page: 474, source: 'manual' },
  { id: 'mf-radius-tabbededge-1-8-oil', family: 'radiusTabbedEdge', description: 'Radius tabbed edge hold-down wearstrip, 1/8 in frame, oil-filled UHMW-PE, grey', color: 'Grey', material: 'Oil-filled UHMW-PE', lengthFt: 10, uom: '10 ft section', frameIn: '1/8', partNumber: 'B6XX39IXXWMW-00', page: 474, source: 'manual' },
  { id: 'mf-radius-tabbededge-3-16-oil', family: 'radiusTabbedEdge', description: 'Radius tabbed edge hold-down wearstrip, 3/16 in frame, oil-filled UHMW-PE, grey', color: 'Grey', material: 'Oil-filled UHMW-PE', lengthFt: 10, uom: '10 ft section', frameIn: '3/16', partNumber: 'B6XX38IXXWMW-00', page: 474, source: 'manual' },
  // The natural UHMW-PE angled and center rail parts are the menu's rows above
  // (same part numbers on manual pp.474-475); only the oil-filled ones are new.
  { id: 'mf-radiusangled-1-8-oil', family: 'radiusAngled', description: 'OneTrack radius angled hold-down wearstrip, 1/8 in frame, oil-filled UHMW-PE, grey', color: 'Grey', material: 'Oil-filled UHMW-PE', lengthFt: 10, uom: '10 ft section', frameIn: '1/8', partNumber: 'B6XX37IXXWMW-00', page: 474, source: 'manual' },
  { id: 'mf-radiusangled-3-16-oil', family: 'radiusAngled', description: 'OneTrack radius angled hold-down wearstrip, 3/16 in frame, oil-filled UHMW-PE, grey', color: 'Grey', material: 'Oil-filled UHMW-PE', lengthFt: 10, uom: '10 ft section', frameIn: '3/16', partNumber: 'B6XX36IXXWMW-00', page: 474, source: 'manual' },
  { id: 'mf-radiuscenterrail-1-8-oil', family: 'radiusCenterRail', description: 'OneTrack radius center rail hold-down wearstrip, 1/8 in frame, oil-filled UHMW-PE, grey', color: 'Grey', material: 'Oil-filled UHMW-PE', lengthFt: 10, uom: '10 ft section', frameIn: '1/8', partNumber: 'B6XX41IXXWMW-00', page: 475, source: 'manual' },
  { id: 'mf-radiuscenterrail-3-16-oil', family: 'radiusCenterRail', description: 'OneTrack radius center rail hold-down wearstrip, 3/16 in frame, oil-filled UHMW-PE, grey', color: 'Grey', material: 'Oil-filled UHMW-PE', lengthFt: 10, uom: '10 ft section', frameIn: '3/16', partNumber: 'B6XX40IXXWMW-00', page: 475, source: 'manual' },
  { id: 'mf-s2400-1-8', family: 's2400HoldDown', description: 'Series 2400 hold-down guide wearstrip, 1/8 in frame, UHMW-PE, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', frameIn: '1/8', partNumber: 'B6F546IXXWMV-00', page: 475, source: 'manual' },
  { id: 'mf-s2400-3-16', family: 's2400HoldDown', description: 'Series 2400 hold-down guide wearstrip, 3/16 in frame, UHMW-PE, natural', color: 'Natural', lengthFt: 10, uom: '10 ft section', frameIn: '3/16', partNumber: 'B6F547IXXWMV-00', page: 475, source: 'manual' },
]

export const BELT_PULLERS: readonly RawPuller[] = [
  { description: '3-link belt puller set (MPB): 2 puller plates, 2 bent SS rods, 1 ratchet strap set', series: ['800','850','888','1800'], partNumber: 'C3SF087XXXXX-00', page: 6 },
  { description: '5-link belt puller set (MPB): 2 puller plates, 2 bent SS rods, 1 ratchet strap set', series: ['400','900','1000','1100','1400','1600','2400','9000','9050'], partNumber: 'C3SF125XXXXX-00', page: 6 },
  { description: 'ThermoDrive belt puller', series: ['8026','8050','8126','8140'], partNumber: 'C3SF101XXXHB-00', page: 6 },
]

export const ROD_REMOVERS: readonly RawDescribed[] = [
  { description: 'Rod remover tool (MPB): S800 FT / OHFT / OHFT HDE / PFT, S1600 OHFT HDE, S1800 FT HDE', partNumber: 'C3J7XXXXXXXX-00', page: 7 },
  { description: 'ThermoDrive mini needle nose pliers (ThermoLace)', partNumber: 'H2A5BJIXXXXX-00', page: 7 },
  { description: 'ThermoDrive slip joint pliers with rubber tips (ThermoLace)', partNumber: 'H2A4BHIXXXXX-00', page: 7 },
]

export const RULERS: readonly RawDescribed[] = [
  { description: 'Belt replacement ruler, green plastic (all belts except S2100)', partNumber: 'C3K8XXXXXXHN-00', page: 8 },
  { description: 'Belt replacement ruler, stainless steel (all belts except S2100)', partNumber: 'C3K8XXXXXXNM-00', page: 8 },
]

export const CLEANLOCK_SPROCKETS: readonly RawSprocket[] = [
  { series: '800', teeth: 8, pd: '5.2 in (132 mm)', bore: '1.5 in', partNumber: 'S3D8M2CPE7NG-00', page: 9 },
  { series: '800', teeth: 8, pd: '5.2 in (132 mm)', bore: '40 mm', partNumber: 'S3D8M2CPK1NG-00', page: 9 },
  { series: '800', teeth: 10, pd: '6.5 in (165 mm)', bore: '1.5 in', partNumber: 'S3D8M2CZE7NG-00', page: 9 },
  { series: '800', teeth: 10, pd: '6.5 in (165 mm)', bore: '40 mm', partNumber: 'S3D8M2CZK1NG-00', page: 9 },
  { series: '1600', teeth: 12, pd: '3.9 in (99 mm)', bore: '1.5 in', partNumber: 'S3F8M2CHE7NG-00', page: 9 },
  { series: '1600', teeth: 12, pd: '3.9 in (99 mm)', bore: '40 mm', partNumber: 'S3F8M2CHK1NG-00', page: 9 },
  { series: '1600', teeth: 20, pd: '6.4 in (163 mm)', bore: '1.5 in', partNumber: 'S3F8M2CYE7NG-00', page: 9 },
  { series: '1600', teeth: 20, pd: '6.4 in (163 mm)', bore: '40 mm', partNumber: 'S3F8M2CYK1NG-00', page: 9 },
  { series: '1800', teeth: 8, pd: '6.5 in (165 mm)', bore: '1.5 in', partNumber: 'S3E0M2CZE7LW-00', page: 9 },
  { series: '1800', teeth: 8, pd: '6.5 in (165 mm)', bore: '40 mm', partNumber: 'S3E0M2CZK1LW-00', page: 9 },
  { series: '1800', teeth: 10, pd: '8.1 in (206 mm)', bore: '1.5 in', partNumber: 'S3E0M2DEE7LW-00', page: 9 },
  { series: '1800', teeth: 10, pd: '8.1 in (206 mm)', bore: '40 mm', partNumber: 'S3E0M2DEK1LW-00', page: 9 },
  { series: '1800', teeth: 13, pd: '10.5 in (267 mm)', bore: '2.5 in', partNumber: 'S3E0M2DML4LW-00', page: 9 },
  { series: '1800', teeth: 13, pd: '10.5 in (267 mm)', bore: '60 mm', partNumber: 'S3E0M2DML2LW-00', page: 9 },
  { series: '2400', teeth: 12, pd: '3.9 in (99 mm)', bore: '1.5 in', partNumber: 'S3F5M2CHE7NG-00', page: 9 },
  { series: '2400', teeth: 12, pd: '3.9 in (99 mm)', bore: '40 mm', partNumber: 'S3F5M2CHK1NG-00', page: 9 },
  { series: '2400', teeth: 16, pd: '5.1 in (130 mm)', bore: '1.5 in', partNumber: 'S3F5M2CNE7NG-00', page: 9 },
  { series: '2400', teeth: 16, pd: '5.1 in (130 mm)', bore: '40 mm', partNumber: 'S3F5M2CNK1NG-00', page: 9 },
  { series: '2400', teeth: 20, pd: '6.4 in (163 mm)', bore: '1.5 in', partNumber: 'S3F5M2CYE7NG-00', page: 9 },
  { series: '2400', teeth: 20, pd: '6.4 in (163 mm)', bore: '40 mm', partNumber: 'S3F5M2CYK1NG-00', page: 9 },
  { series: '8050', teeth: 10, pd: '6.5 in (165 mm)', bore: '1.5 in', partNumber: 'S3H2M2CZE7TE-00', page: 9 },
  { series: '8050', teeth: 10, pd: '6.5 in (165 mm)', bore: '40 mm', partNumber: 'S3H2M2CZK1TE-00', page: 9 },
]

/** Codes as printed on p.11. E7 / L6 here pair the other way round from the sprockets and spacers; Jake confirmed (2026-10-05) to trust each page as printed. */
export const CLEANLOCK_ROLLERS: readonly RawCleanLockRoller[] = [
  { od: '4 in', width: '1 in', squareShaft: '1 in', material: 'Abrasion-Resistant A28', color: 'Blue', partNumber: 'D6XXB1EWE7JT-00', page: 11 },
  { od: '4 in', width: '1 in', squareShaft: '1.5 in', material: 'Abrasion-Resistant A28', color: 'Blue', partNumber: 'D6XXB1EWL6JT-00', page: 11 },
  { od: '6 in', width: '1 in', squareShaft: '1 in', material: 'Abrasion-Resistant A28', color: 'Blue', partNumber: 'D6XXB1EZE7JT-00', page: 11 },
  { od: '6 in', width: '1 in', squareShaft: '1.5 in', material: 'Abrasion-Resistant A28', color: 'Blue', partNumber: 'D6XXB1EZL6JT-00', page: 11 },
]

export const CLEANLOCK_ACCESSORIES: readonly RawDescribed[] = [
  { description: 'CleanLock returnway shaft mount, 5/8 in journal, UHMW-PE, natural', partNumber: 'C3SK127A02MV-00', page: 12 },
  { description: 'CleanLock roller tool set (2 tools, stainless steel), 1 in and 1.5 in shafts', partNumber: 'C3SS129XXXXX-00', page: 12 },
]

export const STRAIGHT_ROLLERS: readonly RawStraightRoller[] = [
  { od: '4 in', width: '1 in', roundShaft: '1 in', material: 'UHMW-PE', color: 'Natural', partNumber: 'D6XXA4EWM5MV-00', page: 13 },
  { od: '4 in', width: '1 in', roundShaft: '1 in', material: 'UHMW-PE', color: 'Blue', partNumber: 'D6XXA4EWM5JQ-00', page: 13 },
  { od: '4 in', width: '1 in', roundShaft: '1 in', material: 'Abrasion-Resistant A28', color: 'Blue', partNumber: 'D6XXA4EWM5JT-00', page: 13 },
  { od: '4 in', width: '1 in', roundShaft: '1.25 in', material: 'UHMW-PE', color: 'Natural', partNumber: 'D6XXA4EWM1MV-00', page: 13 },
  { od: '4 in', width: '1 in', roundShaft: '1.25 in', material: 'UHMW-PE', color: 'Blue', partNumber: 'D6XXA4EWM1JQ-00', page: 13 },
  { od: '4 in', width: '1 in', roundShaft: '1.25 in', material: 'Abrasion-Resistant A28', color: 'Blue', partNumber: 'D6XXA4EWM1JT-00', page: 13 },
  { od: '6 in', width: '1 in', roundShaft: '1 in', material: 'UHMW-PE', color: 'Natural', partNumber: 'D6XXA4EZM5MV-00', page: 13 },
  { od: '6 in', width: '1 in', roundShaft: '1 in', material: 'UHMW-PE', color: 'Blue', partNumber: 'D6XXA4EZM5JQ-00', page: 13 },
  { od: '6 in', width: '1 in', roundShaft: '1 in', material: 'Abrasion-Resistant A28', color: 'Blue', partNumber: 'D6XXA4EZM5JT-00', page: 13 },
  { od: '6 in', width: '1 in', roundShaft: '1.25 in', material: 'UHMW-PE', color: 'Natural', partNumber: 'D6XXA4EZM1MV-00', page: 13 },
  { od: '6 in', width: '1 in', roundShaft: '1.25 in', material: 'UHMW-PE', color: 'Blue', partNumber: 'D6XXA4EZM1JQ-00', page: 13 },
  { od: '6 in', width: '1 in', roundShaft: '1.25 in', material: 'Abrasion-Resistant A28', color: 'Blue', partNumber: 'D6XXA4EZM1JT-00', page: 13 },
]

export const FLANGED_ROLLERS: readonly RawFlangedRoller[] = [
  { od: '4 in', width: '1.75 in', flangeHeight: '0.5 in', roundShaft: '1 in', material: 'UHMW-PE', color: 'Natural', partNumber: 'D6XXA9EYM5MV-00', page: 14 },
  { od: '4 in', width: '1.75 in', flangeHeight: '0.5 in', roundShaft: '1 in', material: 'UHMW-PE', color: 'Blue', partNumber: 'D6XXA9EYM5JQ-00', page: 14 },
  { od: '4 in', width: '1.75 in', flangeHeight: '0.5 in', roundShaft: '1.25 in', material: 'UHMW-PE', color: 'Natural', partNumber: 'D6XXA9EYM1MV-00', page: 14 },
  { od: '4 in', width: '1.75 in', flangeHeight: '0.5 in', roundShaft: '1.25 in', material: 'UHMW-PE', color: 'Blue', partNumber: 'D6XXA9EYM1JQ-00', page: 14 },
  { od: '6 in', width: '1.75 in', flangeHeight: '0.5 in', roundShaft: '1 in', material: 'UHMW-PE', color: 'Natural', partNumber: 'D6XXA9FAM5MV-00', page: 14 },
  { od: '6 in', width: '1.75 in', flangeHeight: '0.5 in', roundShaft: '1 in', material: 'UHMW-PE', color: 'Blue', partNumber: 'D6XXA9FAM5JQ-00', page: 14 },
  { od: '6 in', width: '1.75 in', flangeHeight: '0.5 in', roundShaft: '1.25 in', material: 'UHMW-PE', color: 'Natural', partNumber: 'D6XXA9FAM1MV-00', page: 14 },
  { od: '6 in', width: '1.75 in', flangeHeight: '0.5 in', roundShaft: '1.25 in', material: 'UHMW-PE', color: 'Blue', partNumber: 'D6XXA9FAM1JQ-00', page: 14 },
]

export const RETAINER_RINGS: readonly RawRetainerRing[] = [
  { type: 'Heavy-duty split', shaft: 'Round', size: '3/4 in', description: 'SS heavy-duty split retainer ring, round shaft, 3/4 in', partNumber: 'A3EXXX3F4IMT-00', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Round', size: '1 in', description: 'SS heavy-duty split retainer ring, round shaft, 1 in', partNumber: 'A3EXXX002IMT-00', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Round', size: '1-3/16 in', description: 'SS heavy-duty split retainer ring, round shaft, 1-3/16 in', partNumber: 'A3EXXX003IMT-00', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Round', size: '1-1/4 in', description: 'SS heavy-duty split retainer ring, round shaft, 1-1/4 in', partNumber: 'A3EXXX004IMT-00', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Round', size: '1-3/8 in', description: 'SS heavy-duty split retainer ring, round shaft, 1-3/8 in', partNumber: 'A3EXXX005IMT-00', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Round', size: '1-7/16 in', description: 'SS heavy-duty split retainer ring, round shaft, 1-7/16 in', partNumber: 'A3EXXX006IMT-00', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Round', size: '1-1/2 in', description: 'SS heavy-duty split retainer ring, round shaft, 1-1/2 in', partNumber: 'A3EXXX007IMT-00', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Round', size: '2 in', description: 'SS heavy-duty split retainer ring, round shaft, 2 in', partNumber: 'A3EXXX008IMT-00', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Square', size: '1-1/2 in', description: 'SS heavy-duty split retainer ring, square shaft, 1-1/2 in', partNumber: 'A3EXXX1D5IMT-10', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Square', size: '40 mm', description: 'SS heavy-duty split retainer ring, square shaft, 40 mm', partNumber: 'A3EXXX040MMT-10', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Square', size: '2-1/2 in', description: 'SS heavy-duty split retainer ring, square shaft, 2-1/2 in', partNumber: 'A3EXXX2D5IMT-10', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Square', size: '60 mm', description: 'SS heavy-duty split retainer ring, square shaft, 60 mm', partNumber: 'A3EXXX060MMT-10', page: 18 },
  { type: 'Heavy-duty split', shaft: 'Square', size: '3-1/2 in', description: 'SS heavy-duty split retainer ring, square shaft, 3-1/2 in', partNumber: 'A3EXXX3D5IMT-00', page: 18 },
  { type: 'Snap ring', shaft: 'Square', size: '5/8 in', description: 'SS retainer ring (snap ring), square shaft, 5/8 in', partNumber: 'A3DXXX5F8IMT-00', page: 18 },
  { type: 'Snap ring', shaft: 'Square', size: '1 in', description: 'SS retainer ring (snap ring), square shaft, 1 in', partNumber: 'A3DXXX001IMT-00', page: 18 },
  { type: 'Snap ring', shaft: 'Square', size: '1-1/2 in', description: 'SS retainer ring (snap ring), square shaft, 1-1/2 in', partNumber: 'A3DXXX1D5IMT-00', page: 18 },
  { type: 'Snap ring', shaft: 'Square', size: '2-1/2 in', description: 'SS retainer ring (snap ring), square shaft, 2-1/2 in', partNumber: 'A3AXXX2D5IMT-00', page: 18 },
  { type: 'Snap ring', shaft: 'Square', size: '3-1/2 in', description: 'SS retainer ring (snap ring), square shaft, 3-1/2 in', partNumber: 'A3AXXX3D5IMT-00', page: 18 },
]

export const SPROCKET_SPACERS: readonly RawSpacer[] = [
  { squareBore: '1.5 in', width: '1.0 in', material: 'Det AC', partNumber: 'SAXXACXXE7QW-00', page: 19 },
  { squareBore: '1.5 in', width: '1.5 in', material: 'Det AC', partNumber: 'SAXXAAXXE7QW-00', page: 19 },
  { squareBore: '1.5 in', width: '1.5 in', material: 'XRD AC', partNumber: 'SAXXAAXXE7ZV-00', page: 19 },
  { squareBore: '1.5 in', width: '2.0 in', material: 'Det AC', partNumber: 'SAXXABXXE7QW-00', page: 19 },
  { squareBore: '1.5 in', width: '2.0 in', material: 'XRD AC', partNumber: 'SAXXABXXE7ZV-00', page: 19 },
  { squareBore: '1.5 in', width: '3.0 in', material: 'A25 MX AC', partNumber: 'SAXXAEXXE7NW-00', page: 19 },
  { squareBore: '1.5 in', width: '3.5 in', material: 'A25 MX AC', partNumber: 'SAXXAFXXE7NW-00', page: 19 },
  { squareBore: '1.5 in', width: '4.0 in', material: 'A25 MX AC', partNumber: 'SAXXADXXE7NW-00', page: 19 },
  { squareBore: '1.5 in', width: '5.0 in', material: 'A25 MX AC', partNumber: 'SAXXAGXXE7NW-00', page: 19 },
]

export const SCRAPERS: readonly RawDescribed[] = [
  { description: 'EZ Mount scraper, blue PVC base, white polyurethane flex tip, 72 in long, 2.75 in high (wet environments only)', partNumber: 'H1F8ANXXXXWW-00', page: 20 },
]

/** No part number: CS quotes these from what the rep writes in the line note. */
/** Engineering manual p.473: sold separately for the stainless steel-backed wearstrips. */
export const WEARSTRIP_ACCESSORIES: readonly RawDescribed[] = [
  { description: 'Stainless steel self-tightening wearstrip clip and nut, 5/16-18 UNC (for stainless steel-backed wearstrip)', partNumber: 'C9AX1XXXXXXX-01', page: 473, source: 'manual' },
]

export const QUOTE_ONLY: readonly RawQuoteOnly[] = [
  { id: 'quote-cleanlock-shaft', description: 'CleanLock stainless steel square shaft (1.5 in / 40 mm: S800, 1600, 1800, 2400, 8050; 2.5 in / 60 mm: S1800)', note: 'Machined to spec. No part number: CS quotes from dimensions.', prompt: 'Shaft size (1.5 in / 40 mm or 2.5 in / 60 mm), length, and journal details', page: 10 },
  { id: 'quote-ss-shaft', description: 'Stainless steel square shaft, machined to customer spec (1.0, 1.5/40 mm, 2.5/60 mm, 3.5 in)', note: 'No part number: CS quotes from dimensions.', prompt: 'Shaft size, length, and journal details', page: 10 },
  { id: 'quote-cip', description: 'Intralox EZ Clean-in-Place (CIP) system', note: 'Custom made to order. Contact TSG.', prompt: 'Conveyor and belt details for TSG', page: 21 },
  { id: 'quote-uhmw-tape', description: 'UHMW-PE pressure sensitive wearstrip tape, 54 ft roll', note: 'Light-duty and temporary use only. No part number in the manual.', prompt: 'Width (1 or 2 in), thickness (0.010 or 0.030 in), and how many rolls', page: 473, source: 'manual' },
]
