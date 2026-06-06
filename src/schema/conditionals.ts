import type { FormValues } from './formSchema'

// ── Spiral 2 trigger ───────────────────────────────────────────────────────
// Proposed interpretation: Spiral 2 fields appear when travel direction
// indicates a two-drum / double-belt layout. Confirm with spiral SME.

export const DOUBLE_DRUM_DIRECTIONS = ['Two Drum, One Belt', 'Two Drum, Two Belt'] as const

export function isSpiral2Applicable(travelDirection: string | undefined): boolean {
  return travelDirection != null &&
    (DOUBLE_DRUM_DIRECTIONS as readonly string[]).includes(travelDirection)
}

// ── Field visibility resolver ──────────────────────────────────────────────
// Returns true when the field should be shown / validated given current form values.
// Always returns true for fields without conditional logic (not listed here).

export function isFieldVisible(
  field: keyof FormValues,
  values: Partial<FormValues>,
): boolean {
  switch (field) {
    // § 2 — Application conditionals
    case 'applicationTypeOther':
      return values.applicationType === 'Other'
    case 'heatSourceSpecify':
      return Array.isArray(values.heatSource) &&
        values.heatSource.includes('Other Heat Source')
    case 'preferredBeltSeriesOther':
      return values.preferredBeltSeries === 'Other'
    case 'beltAccessoriesOther':
      return Array.isArray(values.beltAccessories) &&
        values.beltAccessories.includes('Other')

    // § 3 — System Information conditionals
    case 'distanceBetweenDrums':
      return isSpiral2Applicable(values.travelDirection)
    case 'numTiersSpiral2':
    case 'configurationSpiral2':
    case 'returnTypeSpiral2':
      return isSpiral2Applicable(values.travelDirection)

    // § 4 — System Details conditionals
    case 'carrywayWearstripMaterialOther':
      return values.carrywayWearstripMaterial === 'Other'
    case 'cageBarDimA':
    case 'cageBarDimB':
    case 'cageBarDimC':
      return values.drumType === 'Cage'
    case 'cageBarCapMaterialOther':
      return values.cageBarCapMaterial === 'Other'
    case 'capProfileOther':
      return values.capProfile === 'Other'

    default:
      return true
  }
}

// ── Quick-mode field partition ─────────────────────────────────────────────
// Fields visible in Quick mode (the lean rep-collected subset).
// All fields not listed here are Full-mode only.
// Proposed interpretation: Quick = System Info + System Details + Application essentials.
// Conditional fields in this set are still conditional (visibility still applies).
// Confirm Quick-mode required set with Jeremy/BDA before finalising.

export const QUICK_MODE_FIELDS = new Set<keyof FormValues>([
  // § 1 — Customer essentials (confirmed: customer fields belong in Quick mode)
  'name',
  'companyName',
  'email',
  'phone',

  // § 2 — Application essentials
  'installationType',
  'applicationType',
  'applicationTypeOther',
  'productProcessed',
  'incomingProductTemp',
  'beltSpeed',

  // § 3 — System Information (all)
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

  // § 4 — System Details (all)
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
])

export function isQuickModeField(field: keyof FormValues): boolean {
  return QUICK_MODE_FIELDS.has(field)
}

// Returns fields that are Full-mode only (not shown in Quick).
// mode field and Project Info are included in Full only.
export function getFullOnlyFields(): ReadonlyArray<keyof FormValues> {
  const all: Array<keyof FormValues> = [
    // § 1 — Personal Info (full-only portion; name/companyName/email/phone are Quick)
    'title', 'countryOrRegion', 'address', 'city', 'stateProvince', 'zipPostalCode',

    // § 2 — Full application fields
    'howProductCarried', 'heatSource', 'heatSourceSpecify', 'productProperties',
    'beltCleaning', 'chemicalsUsed', 'productLoad', 'productLoadUnit',
    'weightPerPiece', 'weightPerPieceUnit', 'productDimL', 'productDimW', 'productDimH',
    'productionRate', 'productionRateUnit', 'productionHoursPerDay', 'loadingPattern',
    'productsAcrossWidth', 'leadingDimension', 'operatingEnvTemp', 'minOperatingEnvTemp',
    'maxOperatingEnvTemp', 'beltType', 'technology', 'preferredBeltSeries',
    'preferredBeltSeriesOther', 'beltAccessories', 'beltAccessoriesOther',
    'sprocketBoreSize', 'additionalComments',
    // § 5 — Project Information
    'projectNumber', 'endUserName', 'endUserCity', 'endUserState', 'lineId',
  ]
  return all.filter((f) => !QUICK_MODE_FIELDS.has(f))
}
