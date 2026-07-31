import { z } from 'zod'

// ── Enums ──────────────────────────────────────────────────────────────────

export const FormMode = z.enum(['quick', 'full'])

// Section 1
export const CountryOrRegion = z.string()  // free text; option list lives in UI config

// Section 2 — Application
export const InstallationType = z.enum(['New', 'Retrofit'])
export const ApplicationType = z.enum([
  'Freezer',
  'Ambient Cooler',
  'Refrigerated Cooler',
  'Proofer',
  'Elevator/Lowerator',
  'Other',
])
export const HowProductCarried = z.enum([
  'Direct on Belt',
  'Fully Packaged',
  'Open Container',
])
export const HeatSourceOption = z.enum([
  'Oven',
  'Microwave/Convection',
  'Broiler',
  'Fryer',
  'Open Flame',
  'Other Heat Source',
  'No Heat Source',
])
export const ProductProperty = z.enum([
  'Glazing',
  'Oils',
  'Marinate',
  'Abrasive Ingredients',
  'None',
])
export const BeltCleaningFrequency = z.enum([
  'Once a Day',
  'Twice daily',
  'Weekly',
  'Twice weekly',
  'Monthly',
  'Yearly',
  'Never',
])
export const ProductLoadUnit = z.enum(['lbs/linear ft', 'lbs/sq ft'])
export const WeightPerPieceUnit = z.enum(['lbs', 'oz'])
export const ProductionRateUnit = z.enum(['units/hr', 'units/min', 'lbs/hr'])
export const LoadingPattern = z.enum(['Uniform Across Width', 'Center', 'Random'])
export const LeadingDimension = z.enum(['Short Side Leading', 'Long Side Leading'])
export const BeltType = z.enum(['Metal', 'Plastic'])
export const Technology = z.enum(['Friction Drive', 'DirectDrive'])
export const BeltSeries = z.enum([
  '2200', '2400', '2600', '2700', '2800', '2850',
  '2900', '2950', '22150', 'Other',
])
export const BeltAccessory = z.enum(['Lane Dividers', 'Friction', 'Edge Guards', 'Other'])

// Section 3 — System Information
export const TravelDirection = z.enum([
  'Upgo',
  'Downgo',
  'Two Drum, One Belt',
  'Two Drum, Two Belt',
])
export const RotationDirection = z.enum(['Clockwise', 'Counter Clockwise'])
export const TakeUpLoop = z.enum(['Single', 'Double'])
export const DrumBasis = z.enum([
  'Diameter',
  'Radius',
  'Overall System Diameter (including belt)',
])
export const Configuration = z.enum(['90°', '180°', '270°', '360°'])
export const ReturnType = z.enum(['Straight Through', 'Drum', 'Freewheel', 'Slide Rail'])

// Section 4 — System Details
// numRails is now a free number (sometimes > 5)
// NumRails kept as alias for backwards-compat; actual field uses z.number()
export const BeltSupportMaterial = z.enum([
  'Stainless Steel',
  'Aluminum',
  'Galvanized',
  'Painted Steel',
])
export const CarrywayWearstripMaterial = z.enum(['UHMW', 'Other'])
export const DrumType = z.enum(['Cage', 'Solid'])
export const CageBarCapMaterial = z.enum(['UHMW', 'Nylon', 'Stainless Steel Cage', 'Other'])
export const CapProfile = z.enum(['Trapezoidal', 'Flat', 'Ribbed', 'Winged', 'Other'])
export const YesNo = z.enum(['Yes', 'No'])
export const ReturnPathHoldDown = z.enum(['Yes', 'No', 'Does Not Apply'])
export const TakeUpSensor = z.enum(['Upper', 'Lower'])
export const NumVFDs = z.enum(['0', '1', '2', '3'])

// ── Base schema — all optional; required-set enforced in superRefine ───────

const baseSchema = z.object({
  mode: FormMode,

  // Fields the user marked "I don't know / measure later". Stored as field
  // names so the required-set itself never changes -- a deferred field is
  // treated as satisfied, and the office sees exactly what still needs a
  // measurement.
  unknownFields: z.array(z.string()).optional(),

  // § 1 — Personal Info
  name: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  companyName: z.string().optional(),
  systemName: z.string().optional(),
  countryOrRegion: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  zipPostalCode: z.string().optional(),

  // § 2 — Application
  installationType: InstallationType.optional(),
  applicationType: ApplicationType.optional(),
  applicationTypeOther: z.string().optional(),
  productProcessed: z.string().optional(),
  howProductCarried: HowProductCarried.optional(),
  heatSource: z.array(HeatSourceOption).optional(),
  heatSourceSpecify: z.string().optional(),
  productProperties: z.array(ProductProperty).optional(),
  beltCleaning: BeltCleaningFrequency.optional(),
  chemicalsUsed: z.string().optional(),
  productLoad: z.number().optional(),
  productLoadUnit: ProductLoadUnit.optional(),
  weightPerPiece: z.number().optional(),
  weightPerPieceUnit: WeightPerPieceUnit.optional(),
  productDimL: z.number().optional(),
  productDimW: z.number().optional(),
  productDimH: z.number().optional(),
  productionRate: z.number().optional(),
  productionRateUnit: ProductionRateUnit.optional(),
  productionHoursPerDay: z.number().optional(),
  loadingPattern: LoadingPattern.optional(),
  productsAcrossWidth: z.number().optional(),
  leadingDimension: LeadingDimension.optional(),
  incomingProductTemp: z.number().optional(),       // °F — can be negative
  operatingEnvTemp: z.number().optional(),           // °F — can be negative
  minOperatingEnvTemp: z.number().optional(),        // °F — can be negative
  maxOperatingEnvTemp: z.number().optional(),        // °F — can be negative
  beltSpeed: z.number().optional(),
  beltType: BeltType.optional(),
  technology: Technology.optional(),
  preferredBeltSeries: BeltSeries.optional(),
  preferredBeltSeriesOther: z.string().optional(),
  beltAccessories: z.array(BeltAccessory).optional(),
  beltAccessoriesOther: z.string().optional(),
  sprocketBoreSize: z.number().optional(),
  additionalComments: z.string().optional(),

  // § 3 — System Information
  spiralManufacturer: z.string().optional(),
  travelDirection: TravelDirection.optional(),
  rotationDirection: RotationDirection.optional(),
  numTiersSpiral1: z.number().positive().optional(),
  numTiersSpiral2: z.number().positive().optional(),
  tierPitch: z.number().positive().optional(),
  takeUpTravelLength: z.number().positive().optional(),
  takeUpLoop: TakeUpLoop.optional(),
  beltLength: z.number().positive().optional(),
  minRollerDiameter: z.number().optional(),
  drumBasis: DrumBasis.optional(),
  drumValue: z.number().positive().optional(),
  beltWidth: z.number().positive().optional(),
  infeedLength: z.number().optional(),
  dischargeLength: z.number().optional(),
  distanceBetweenDrums: z.number().optional(),
  configurationSpiral1: Configuration.optional(),
  configurationSpiral2: Configuration.optional(),
  returnTypeSpiral1: ReturnType.optional(),
  returnTypeSpiral2: ReturnType.optional(),

  // § 4 — System Details
  numRails: z.number().int().positive().optional(),
  railSpacing: z.number().positive().optional(),
  insideOverhang: z.number().optional(),
  outsideOverhang: z.number().optional(),
  beltSupportMaterial: BeltSupportMaterial.optional(),
  carrywayWearstripMaterial: CarrywayWearstripMaterial.optional(),
  carrywayWearstripMaterialOther: z.string().optional(),
  drumType: DrumType.optional(),
  cageBarDimA: z.number().positive().optional(),
  cageBarDimB: z.number().positive().optional(),
  cageBarDimC: z.number().positive().optional(),
  cageBarCapMaterial: CageBarCapMaterial.optional(),
  cageBarCapMaterialOther: z.string().optional(),
  capProfile: CapProfile.optional(),
  capProfileOther: z.string().optional(),
  tierSensorsEveryTier: YesNo.optional(),
  takeUpSensors: z.array(TakeUpSensor).optional(),
  beltWasher: YesNo.optional(),
  topTierHoldDown: YesNo.optional(),
  returnPathHoldDown: ReturnPathHoldDown.optional(),
  productContainmentRail: YesNo.optional(),
  numVFDs: NumVFDs.optional(),

  // § 5 — Project Information
  projectNumber: z.string().optional(),
  endUserName: z.string().optional(),
  endUserCity: z.string().optional(),
  endUserState: z.string().optional(),
  lineId: z.string().optional(),
})

export type FormValues = z.infer<typeof baseSchema>

/** Every key in the form, including the meta ones. */
export const ALL_FIELD_NAMES = Object.keys(baseSchema.shape) as (keyof FormValues)[]

/** Keys that are app bookkeeping rather than questions the user answers. */
export const META_FIELD_NAMES: readonly (keyof FormValues)[] = ['mode', 'unknownFields']

/** Every field that represents an actual question on the form. */
export const QUESTION_FIELD_NAMES = ALL_FIELD_NAMES.filter(
  (f) => !META_FIELD_NAMES.includes(f),
)

// ── Validation refinements ─────────────────────────────────────────────────

const DOUBLE_DRUM_DIRECTIONS: ReadonlyArray<z.infer<typeof TravelDirection>> = [
  'Two Drum, One Belt',
  'Two Drum, Two Belt',
]

export function isSpiral2Required(data: Partial<FormValues>): boolean {
  return data.travelDirection != null && DOUBLE_DRUM_DIRECTIONS.includes(data.travelDirection)
}

/**
 * Is a value present? One definition, shared by validation and by the progress
 * indicator, so the two can never disagree about what "answered" means.
 *
 * Note numbers: 0 and negatives are real answers (an incoming product temp of
 * 0 °F is data, not a blank), so they count as filled.
 */
export function isFilled(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'number') return true
  return Boolean(value)
}

export interface RequiredRule {
  field: keyof FormValues
  /** Human label, used in both the error message and the missing-fields list. */
  label: string
  /** Which section this field lives in; see sectionMap.ts. */
  section: SectionId
  /** When absent, the field is always required. */
  when?: (data: Partial<FormValues>) => boolean
}

export type SectionId = 'personal' | 'application' | 'system-info' | 'system-details' | 'project'

const isFull = (d: Partial<FormValues>) => d.mode === 'full'

/**
 * The single source of truth for which fields are required, and when.
 *
 * Both `formSchema`'s superRefine and `getCompleteness` are derived from this
 * list. Previously they were maintained separately and had drifted: the
 * progress bar could read 100% while submit still failed.
 */
export const REQUIRED_RULES: readonly RequiredRule[] = [
  // § 1 — Personal Info
  { field: 'name', label: 'Name', section: 'personal' },
  { field: 'companyName', label: 'Company Name', section: 'personal' },
  { field: 'email', label: 'Email', section: 'personal' },
  { field: 'title', label: 'Title', section: 'personal', when: isFull },
  { field: 'phone', label: 'Phone', section: 'personal', when: isFull },
  { field: 'countryOrRegion', label: 'Country or Region', section: 'personal', when: isFull },
  { field: 'address', label: 'Address', section: 'personal', when: isFull },
  { field: 'city', label: 'City', section: 'personal', when: isFull },
  { field: 'stateProvince', label: 'State/Province', section: 'personal', when: isFull },
  { field: 'zipPostalCode', label: 'Zip/Postal code', section: 'personal', when: isFull },

  // § 2 — Application
  { field: 'installationType', label: 'Installation type', section: 'application' },
  { field: 'applicationType', label: 'Application Type', section: 'application' },
  {
    field: 'applicationTypeOther',
    label: 'Specify application type',
    section: 'application',
    when: (d) => d.applicationType === 'Other',
  },
  { field: 'productProcessed', label: 'Product Processed', section: 'application' },
  { field: 'incomingProductTemp', label: 'Incoming Product Temperature', section: 'application' },
  { field: 'beltSpeed', label: 'Belt Speed', section: 'application' },
  { field: 'howProductCarried', label: 'How product is carried', section: 'application', when: isFull },
  { field: 'heatSource', label: 'Heat source', section: 'application', when: isFull },
  { field: 'productProperties', label: 'Product Properties', section: 'application', when: isFull },
  { field: 'productLoad', label: 'Product Load', section: 'application', when: isFull },
  { field: 'productLoadUnit', label: 'Product Load unit', section: 'application', when: isFull },
  { field: 'productDimL', label: 'Product Dimension L', section: 'application', when: isFull },
  { field: 'productDimW', label: 'Product Dimension W', section: 'application', when: isFull },
  { field: 'productDimH', label: 'Product Dimension H', section: 'application', when: isFull },
  {
    field: 'operatingEnvTemp',
    label: 'Operating Environment Temperature',
    section: 'application',
    when: isFull,
  },
  {
    field: 'minOperatingEnvTemp',
    label: 'Minimum Operating Environment Temperature',
    section: 'application',
    when: isFull,
  },
  {
    field: 'maxOperatingEnvTemp',
    label: 'Maximum Operating Environment Temperature',
    section: 'application',
    when: isFull,
  },
  {
    field: 'heatSourceSpecify',
    label: 'Specify heat source',
    section: 'application',
    when: (d) => !!d.heatSource?.includes('Other Heat Source'),
  },
  {
    field: 'preferredBeltSeriesOther',
    label: 'Specify belt series',
    section: 'application',
    when: (d) => d.preferredBeltSeries === 'Other',
  },
  {
    field: 'beltAccessoriesOther',
    label: 'Specify belt accessories',
    section: 'application',
    when: (d) => !!d.beltAccessories?.includes('Other'),
  },

  // § 3 — System Information
  { field: 'spiralManufacturer', label: 'Manufacturer of Spiral', section: 'system-info' },
  { field: 'travelDirection', label: 'Travel Direction', section: 'system-info' },
  { field: 'rotationDirection', label: 'Rotation Direction', section: 'system-info' },
  { field: 'numTiersSpiral1', label: 'Number of Tiers — Spiral 1', section: 'system-info' },
  { field: 'tierPitch', label: 'Tier Pitch', section: 'system-info' },
  { field: 'takeUpTravelLength', label: 'Take Up Travel Length', section: 'system-info' },
  // Belt length is deliberately optional -- often unknown in the field.
  { field: 'drumBasis', label: 'Drum (measurement basis)', section: 'system-info' },
  { field: 'drumValue', label: 'Drum value', section: 'system-info' },
  { field: 'beltWidth', label: 'Belt Width', section: 'system-info' },
  { field: 'infeedLength', label: 'Infeed Length (A)', section: 'system-info' },
  { field: 'dischargeLength', label: 'Discharge Length (B)', section: 'system-info' },
  { field: 'configurationSpiral1', label: 'Configuration — Spiral 1', section: 'system-info' },
  { field: 'returnTypeSpiral1', label: 'Type of return — Spiral 1', section: 'system-info' },
  {
    field: 'numTiersSpiral2',
    label: 'Number of Tiers — Spiral 2',
    section: 'system-info',
    when: isSpiral2Required,
  },
  {
    field: 'distanceBetweenDrums',
    label: 'Distance Between Drums',
    section: 'system-info',
    when: isSpiral2Required,
  },
  {
    field: 'configurationSpiral2',
    label: 'Configuration — Spiral 2',
    section: 'system-info',
    when: isSpiral2Required,
  },
  {
    field: 'returnTypeSpiral2',
    label: 'Type of return — Spiral 2',
    section: 'system-info',
    when: isSpiral2Required,
  },

  // § 4 — System Details
  { field: 'numRails', label: 'Number of Rails', section: 'system-details' },
  { field: 'railSpacing', label: 'Rail Spacing', section: 'system-details' },
  { field: 'insideOverhang', label: 'Inside Overhang', section: 'system-details' },
  { field: 'outsideOverhang', label: 'Outside Overhang', section: 'system-details' },
  {
    field: 'carrywayWearstripMaterial',
    label: 'Carryway Wearstrip Material',
    section: 'system-details',
  },
  {
    field: 'carrywayWearstripMaterialOther',
    label: 'Specify carryway wearstrip material',
    section: 'system-details',
    when: (d) => d.carrywayWearstripMaterial === 'Other',
  },
  { field: 'drumType', label: 'Type of Drum', section: 'system-details' },
  {
    field: 'cageBarDimA',
    label: 'Cage Bar Dimension A',
    section: 'system-details',
    when: (d) => d.drumType === 'Cage',
  },
  {
    field: 'cageBarDimB',
    label: 'Cage Bar Dimension B',
    section: 'system-details',
    when: (d) => d.drumType === 'Cage',
  },
  {
    field: 'cageBarDimC',
    label: 'Cage Bar Dimension C',
    section: 'system-details',
    when: (d) => d.drumType === 'Cage',
  },
  { field: 'cageBarCapMaterial', label: 'Cage Bar Cap Material', section: 'system-details' },
  {
    field: 'cageBarCapMaterialOther',
    label: 'Specify cage bar cap material',
    section: 'system-details',
    when: (d) => d.cageBarCapMaterial === 'Other',
  },
  {
    field: 'capProfileOther',
    label: 'Specify cap profile',
    section: 'system-details',
    when: (d) => d.capProfile === 'Other',
  },
]

/** The rules that apply to a given set of answers, after conditions. */
export function activeRequiredRules(data: Partial<FormValues>): RequiredRule[] {
  return REQUIRED_RULES.filter((rule) => !rule.when || rule.when(data))
}

/**
 * Fields the user has explicitly marked "I don't know / measure later".
 * These satisfy their requirement so the rep is never hard-blocked by a
 * number they physically cannot read today.
 */
export function isDeferred(data: Partial<FormValues>, field: keyof FormValues): boolean {
  return Array.isArray(data.unknownFields) && data.unknownFields.includes(field as string)
}

/** Required rules that are neither answered nor explicitly deferred. */
export function missingRequiredRules(data: Partial<FormValues>): RequiredRule[] {
  return activeRequiredRules(data).filter(
    (rule) => !isFilled(data[rule.field]) && !isDeferred(data, rule.field),
  )
}

export const formSchema = baseSchema.superRefine((data, ctx) => {
  const req = (path: keyof FormValues, label: string) =>
    ctx.addIssue({ code: 'custom', message: `${label} is required`, path: [path] })

  // Required-field checks, derived from the table above.
  for (const rule of missingRequiredRules(data)) {
    req(rule.field, rule.label)
  }

  // Bespoke checks that aren't "is this filled in" questions.

  if (data.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid email address', path: ['email'] })
  }

  if (data.heatSource?.includes('No Heat Source') && data.heatSource.length > 1) {
    ctx.addIssue({
      code: 'custom',
      message: '"No Heat Source" cannot be combined with other selections',
      path: ['heatSource'],
    })
  }

  if (data.productProperties?.includes('None') && data.productProperties.length > 1) {
    ctx.addIssue({
      code: 'custom',
      message: '"None" cannot be combined with other product properties',
      path: ['productProperties'],
    })
  }
})
