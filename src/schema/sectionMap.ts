// Which fields live in which section of the form.
//
// Single source of truth for: per-section progress, the jump navigation, the
// mapping from a validation error to the screen that owns it, and the
// section routes. A companion test asserts every schema field appears in
// exactly one section, which is what stops this drifting the way the old
// hand-maintained required-field list did.
import type { FormValues, SectionId } from './formSchema'

export interface FormSection {
  id: SectionId
  /** URL segment, e.g. /spiral-eval/:id/application */
  slug: string
  title: string
  /** One line telling the user what they'll need in hand for this section. */
  blurb: string
  fields: readonly (keyof FormValues)[]
}

export const FORM_SECTIONS: readonly FormSection[] = [
  {
    id: 'personal',
    slug: 'contact',
    title: 'Your details & the customer',
    blurb: 'Who you are and which company this is for.',
    fields: [
      'name',
      'title',
      'phone',
      'email',
      'companyName',
      'systemName',
      'countryOrRegion',
      'address',
      'city',
      'stateProvince',
      'zipPostalCode',
    ],
  },
  {
    id: 'application',
    slug: 'application',
    title: 'The application',
    blurb: 'What runs on the line, how hot or cold it is, and how fast it moves.',
    fields: [
      'installationType',
      'applicationType',
      'applicationTypeOther',
      'productProcessed',
      'howProductCarried',
      'heatSource',
      'heatSourceSpecify',
      'productProperties',
      'beltCleaning',
      'chemicalsUsed',
      'productLoad',
      'productLoadUnit',
      'weightPerPiece',
      'weightPerPieceUnit',
      'productDimL',
      'productDimW',
      'productDimH',
      'productionRate',
      'productionRateUnit',
      'productionHoursPerDay',
      'loadingPattern',
      'productsAcrossWidth',
      'leadingDimension',
      'incomingProductTemp',
      'operatingEnvTemp',
      'minOperatingEnvTemp',
      'maxOperatingEnvTemp',
      'beltSpeed',
      'beltType',
      'technology',
      'preferredBeltSeries',
      'preferredBeltSeriesOther',
      'beltAccessories',
      'beltAccessoriesOther',
      'sprocketBoreSize',
      'additionalComments',
    ],
  },
  {
    id: 'system-info',
    slug: 'system',
    title: 'The spiral itself',
    blurb: 'Manufacturer, direction, tiers, drum and belt measurements.',
    fields: [
      'spiralManufacturer',
      'travelDirection',
      'rotationDirection',
      'numTiersSpiral1',
      'numTiersSpiral2',
      'tierPitch',
      'takeUpTravelLength',
      'takeUpLoop',
      'beltLength',
      'minRollerDiameter',
      'drumBasis',
      'drumValue',
      'beltWidth',
      'infeedLength',
      'dischargeLength',
      'distanceBetweenDrums',
      'configurationSpiral1',
      'configurationSpiral2',
      'returnTypeSpiral1',
      'returnTypeSpiral2',
    ],
  },
  {
    id: 'system-details',
    slug: 'details',
    title: 'Rails, drum & hardware',
    blurb: 'Rail count and spacing, overhangs, cage bars, sensors and hold-downs.',
    fields: [
      'numRails',
      'railSpacing',
      'insideOverhang',
      'outsideOverhang',
      'beltSupportMaterial',
      'carrywayWearstripMaterial',
      'carrywayWearstripMaterialOther',
      'drumType',
      'cageBarDimA',
      'cageBarDimB',
      'cageBarDimC',
      'cageBarCapMaterial',
      'cageBarCapMaterialOther',
      'capProfile',
      'capProfileOther',
      'tierSensorsEveryTier',
      'takeUpSensors',
      'beltWasher',
      'topTierHoldDown',
      'returnPathHoldDown',
      'productContainmentRail',
      'numVFDs',
    ],
  },
  {
    id: 'project',
    slug: 'project',
    title: 'Project & end user',
    blurb: 'Project number and end-user details, if you have them.',
    fields: ['projectNumber', 'endUserName', 'endUserCity', 'endUserState', 'lineId'],
  },
]

export function getSection(id: SectionId): FormSection {
  const section = FORM_SECTIONS.find((s) => s.id === id)
  if (!section) throw new Error(`Unknown section: ${id}`)
  return section
}

export function getSectionBySlug(slug: string): FormSection | undefined {
  return FORM_SECTIONS.find((s) => s.slug === slug)
}

/** Which section owns a given field. */
const FIELD_TO_SECTION = new Map<string, SectionId>(
  FORM_SECTIONS.flatMap((s) => s.fields.map((f) => [f as string, s.id] as const)),
)

export function sectionForField(field: keyof FormValues): SectionId | undefined {
  return FIELD_TO_SECTION.get(field as string)
}
