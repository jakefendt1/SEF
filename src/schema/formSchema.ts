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

  // § 1 — Personal Info
  name: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  companyName: z.string().optional(),
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

// ── Validation refinements ─────────────────────────────────────────────────

const DOUBLE_DRUM_DIRECTIONS: ReadonlyArray<z.infer<typeof TravelDirection>> = [
  'Two Drum, One Belt',
  'Two Drum, Two Belt',
]

export const formSchema = baseSchema.superRefine((data, ctx) => {
  const req = (path: keyof FormValues, label: string) =>
    ctx.addIssue({ code: 'custom', message: `${label} is required`, path: [path] })

  const isFullMode = data.mode === 'full'
  const isSpiral2 = data.travelDirection != null &&
    DOUBLE_DRUM_DIRECTIONS.includes(data.travelDirection)

  // § 1 — Customer essentials: required in both modes
  if (!data.name?.trim()) req('name', 'Name')
  if (!data.companyName?.trim()) req('companyName', 'Company Name')
  if (!data.email?.trim()) {
    req('email', 'Email')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid email address', path: ['email'] })
  }

  // Full-only Personal Info fields
  if (isFullMode) {
    if (!data.title?.trim()) req('title', 'Title')
    if (!data.phone?.trim()) req('phone', 'Phone')
    if (!data.countryOrRegion?.trim()) req('countryOrRegion', 'Country or Region')
    if (!data.address?.trim()) req('address', 'Address')
    if (!data.city?.trim()) req('city', 'City')
    if (!data.stateProvince?.trim()) req('stateProvince', 'State/Province')
    if (!data.zipPostalCode?.trim()) req('zipPostalCode', 'Zip/Postal code')
  }

  // § 2 — Application (Quick + Full share some required; Full adds more)
  if (!data.installationType) req('installationType', 'Installation type')
  if (!data.applicationType) req('applicationType', 'Application Type')
  if (data.applicationType === 'Other' && !data.applicationTypeOther?.trim())
    req('applicationTypeOther', 'Specify application type')
  if (!data.productProcessed?.trim()) req('productProcessed', 'Product Processed')
  if (data.incomingProductTemp == null) req('incomingProductTemp', 'Incoming Product Temperature')
  if (data.beltSpeed == null) req('beltSpeed', 'Belt Speed')

  // Full-only application fields
  if (isFullMode) {
    if (!data.howProductCarried) req('howProductCarried', 'How product is carried')
    if (!data.heatSource?.length) req('heatSource', 'Heat source')
    if (!data.productProperties?.length) req('productProperties', 'Product Properties')
    if (data.productLoad == null) req('productLoad', 'Product Load')
    if (!data.productLoadUnit) req('productLoadUnit', 'Product Load unit')
    if (data.productDimL == null) req('productDimL', 'Product Dimension L')
    if (data.productDimW == null) req('productDimW', 'Product Dimension W')
    if (data.productDimH == null) req('productDimH', 'Product Dimension H')
    if (data.operatingEnvTemp == null) req('operatingEnvTemp', 'Operating Environment Temperature')
    if (data.minOperatingEnvTemp == null) req('minOperatingEnvTemp', 'Minimum Operating Environment Temperature')
    if (data.maxOperatingEnvTemp == null) req('maxOperatingEnvTemp', 'Maximum Operating Environment Temperature')
  }

  // Heat source constraints (when provided)
  if (data.heatSource) {
    if (data.heatSource.includes('No Heat Source') && data.heatSource.length > 1)
      ctx.addIssue({
        code: 'custom',
        message: '"No Heat Source" cannot be combined with other selections',
        path: ['heatSource'],
      })
    if (data.heatSource.includes('Other Heat Source') && !data.heatSourceSpecify?.trim())
      req('heatSourceSpecify', 'Specify heat source')
  }

  // Product Properties: None is mutually exclusive
  if (data.productProperties?.includes('None') && data.productProperties.length > 1)
    ctx.addIssue({
      code: 'custom',
      message: '"None" cannot be combined with other product properties',
      path: ['productProperties'],
    })

  // Belt series / accessories other
  if (data.preferredBeltSeries === 'Other' && !data.preferredBeltSeriesOther?.trim())
    req('preferredBeltSeriesOther', 'Specify belt series')
  if (data.beltAccessories?.includes('Other') && !data.beltAccessoriesOther?.trim())
    req('beltAccessoriesOther', 'Specify belt accessories')

  // § 3 — System Information (required in both modes)
  if (!data.spiralManufacturer?.trim()) req('spiralManufacturer', 'Manufacturer of Spiral')
  if (!data.travelDirection) req('travelDirection', 'Travel Direction')
  if (!data.rotationDirection) req('rotationDirection', 'Rotation Direction')
  if (data.numTiersSpiral1 == null) req('numTiersSpiral1', 'Number of Tiers — Spiral 1')
  if (data.tierPitch == null) req('tierPitch', 'Tier Pitch')
  if (data.takeUpTravelLength == null) req('takeUpTravelLength', 'Take Up Travel Length')
  // Belt length is optional (sometimes unknown in the field)
  if (!data.drumBasis) req('drumBasis', 'Drum (measurement basis)')
  if (data.drumValue == null) req('drumValue', 'Drum value')
  if (data.beltWidth == null) req('beltWidth', 'Belt Width')
  if (data.infeedLength == null) req('infeedLength', 'Infeed Length (A)')
  if (data.dischargeLength == null) req('dischargeLength', 'Discharge Length (B)')
  if (!data.configurationSpiral1) req('configurationSpiral1', 'Configuration — Spiral 1')
  if (!data.returnTypeSpiral1) req('returnTypeSpiral1', 'Type of return — Spiral 1')

  // Spiral 2 fields (conditional on double-drum travel direction)
  if (isSpiral2) {
    if (data.numTiersSpiral2 == null) req('numTiersSpiral2', 'Number of Tiers — Spiral 2')
    if (data.distanceBetweenDrums == null) req('distanceBetweenDrums', 'Distance Between Drums')
    if (!data.configurationSpiral2) req('configurationSpiral2', 'Configuration — Spiral 2')
    if (!data.returnTypeSpiral2) req('returnTypeSpiral2', 'Type of return — Spiral 2')
  }

  // § 4 — System Details (required in both modes)
  if (data.numRails == null) req('numRails', 'Number of Rails')
  if (data.railSpacing == null) req('railSpacing', 'Rail Spacing')
  if (data.insideOverhang == null) req('insideOverhang', 'Inside Overhang')
  if (data.outsideOverhang == null) req('outsideOverhang', 'Outside Overhang')
  if (!data.carrywayWearstripMaterial) req('carrywayWearstripMaterial', 'Carryway Wearstrip Material')
  if (data.carrywayWearstripMaterial === 'Other' && !data.carrywayWearstripMaterialOther?.trim())
    req('carrywayWearstripMaterialOther', 'Specify carryway wearstrip material')
  if (!data.drumType) req('drumType', 'Type of Drum')
  if (data.drumType === 'Cage') {
    if (data.cageBarDimA == null) req('cageBarDimA', 'Cage Bar Dimension A')
    if (data.cageBarDimB == null) req('cageBarDimB', 'Cage Bar Dimension B')
    if (data.cageBarDimC == null) req('cageBarDimC', 'Cage Bar Dimension C')
  }
  if (!data.cageBarCapMaterial) req('cageBarCapMaterial', 'Cage Bar Cap Material')
  if (data.cageBarCapMaterial === 'Other' && !data.cageBarCapMaterialOther?.trim())
    req('cageBarCapMaterialOther', 'Specify cage bar cap material')
  if (data.capProfile === 'Other' && !data.capProfileOther?.trim())
    req('capProfileOther', 'Specify cap profile')
})
