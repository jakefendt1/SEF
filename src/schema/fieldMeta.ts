// Per-field presentation metadata: plain-language hints, and which fields a
// rep is allowed to defer.
//
// Kept in the schema layer rather than sprinkled through the section files so
// there is one place to answer "what does this field mean" and one place to
// answer "can this be left for later".
import type { FormValues } from './formSchema'

/**
 * Fields a rep may mark "I don't know / measure later".
 *
 * The test for inclusion is: can this be physically impossible to obtain
 * during a walkthrough (guarding in the way, line running, needs a tape on a
 * moving belt)? Identity and application fields are excluded -- those are
 * always knowable, and letting them be skipped would gut the form's value.
 */
export const DEFERRABLE_FIELDS: readonly (keyof FormValues)[] = [
  'takeUpTravelLength',
  'tierPitch',
  'minRollerDiameter',
  'drumBasis',
  'drumValue',
  'railSpacing',
  'insideOverhang',
  'outsideOverhang',
  'cageBarDimA',
  'cageBarDimB',
  'cageBarDimC',
  'capProfile',
  'carrywayWearstripMaterial',
  'numVFDs',
]

export function isDeferrable(field: keyof FormValues): boolean {
  return DEFERRABLE_FIELDS.includes(field)
}

/**
 * Plain-language explanations for the jargon. Written for someone standing at
 * the machine, not someone reading a spec sheet.
 */
export const FIELD_HINTS: Partial<Record<keyof FormValues, string>> = {
  // § 1
  systemName: 'Whatever the plant calls this spiral, e.g. "Freezer 2" or "North line".',
  countryOrRegion: 'Where the spiral is installed, not where the customer is headquartered.',

  // § 2
  installationType: 'New = a spiral being bought now. Retrofit = an existing spiral being re-belted.',
  productProcessed: 'What actually rides the belt, e.g. "chicken nuggets", "sandwich bread".',
  howProductCarried: 'Is product touching the belt, in a bag, or sitting in a tray?',
  heatSource: 'What heats the product before it reaches the spiral. Pick "No Heat Source" if it comes in cold.',
  productProperties: 'Anything on the product that ends up on the belt — sugar glaze, oil, marinade, breading.',
  beltCleaning: 'How often the belt itself gets washed down.',
  chemicalsUsed: 'Cleaning chemicals used on the belt, if you know them.',
  productLoad: 'How much weight sits on the belt. Measure per foot of belt length, or per square foot.',
  weightPerPiece: 'Weight of one single piece of product.',
  productionRate: 'How much comes off the line, at the units you choose.',
  loadingPattern: 'How pieces sit across the belt: spread evenly, down the middle, or scattered.',
  productsAcrossWidth: 'How many pieces sit side by side across the belt.',
  leadingDimension: 'Which way pieces face going in — long side first, or short side first.',
  incomingProductTemp: 'Product temperature entering the spiral, in °F. Can be below zero.',
  operatingEnvTemp: 'Air temperature inside the spiral enclosure, in °F.',
  beltSpeed: 'Belt speed in feet per minute. The drive panel usually shows it.',
  beltType: 'What the current belt is made of.',
  technology: 'Friction Drive = the drum drags the belt. DirectDrive = the drum has teeth that engage the belt.',
  sprocketBoreSize: 'The shaft opening in the sprocket, across the flats.',

  // § 3
  spiralManufacturer: 'Who built the spiral, e.g. Ashworth, JBT, Marel. Check the nameplate.',
  travelDirection: 'Upgo = product rides up. Downgo = product rides down. Two Drum = two stacked spirals.',
  rotationDirection: 'Which way the drum turns, looking down from above.',
  numTiersSpiral1: 'How many complete wraps of belt go around the drum.',
  tierPitch: 'Vertical gap from one tier to the next, in inches — top of one belt to top of the next.',
  takeUpTravelLength: 'How far the take-up carriage can travel end to end. Measure the track, not where it sits now.',
  takeUpLoop: 'Single = one loop of belt at the take-up. Double = the belt wraps back on itself.',
  beltLength: 'Total belt length, in feet. Leave blank if unknown — it can be calculated later.',
  minRollerDiameter: 'The smallest roller or sprocket the belt has to bend around anywhere on the system.',
  drumBasis: 'Tell us which measurement you took, so we know how to read the number.',
  drumValue: 'The drum measurement itself, in inches, matching the basis you picked above.',
  beltWidth: 'Belt width in inches, edge to edge.',
  infeedLength: 'Straight run of belt before it enters the spiral (dimension A).',
  dischargeLength: 'Straight run of belt after it leaves the spiral (dimension B).',
  distanceBetweenDrums: 'Center to center between the two drums, in inches.',
  configurationSpiral1: 'How far around the drum the belt goes before it exits — a quarter turn, half, three-quarters or full.',
  returnTypeSpiral1: 'How the belt gets back to the start after discharge.',

  // § 4
  numRails: 'How many rails support the belt across its width. Count them on the carryway.',
  railSpacing: 'Center to center between neighbouring rails, in inches.',
  insideOverhang: 'How far the belt sticks past the innermost rail, toward the drum.',
  outsideOverhang: 'How far the belt sticks past the outermost rail, away from the drum.',
  beltSupportMaterial: 'What the rails themselves are made of.',
  carrywayWearstripMaterial: 'The plastic strip the belt slides on. UHMW is the usual white plastic.',
  drumType: 'Cage = open drum built from vertical bars. Solid = a closed cylinder.',
  cageBarCapMaterial: 'The cap that snaps over each cage bar, where the belt makes contact.',
  capProfile: 'The shape of that cap in cross-section, looking down the bar.',
  tierSensorsEveryTier: 'Is there a sensor at every tier, or only at some?',
  takeUpSensors: 'Where the take-up limit sensors are mounted.',
  beltWasher: 'Is there an automatic belt washer on this system?',
  topTierHoldDown: 'A device keeping the belt down on the top tier.',
  returnPathHoldDown: 'A device keeping the belt down on the return run.',
  productContainmentRail: 'A rail that stops product sliding off the belt edge.',
  numVFDs: 'How many variable frequency drives run this spiral. Check the control panel.',

  // § 5
  projectNumber: 'The Intralox project number, if one exists yet.',
  lineId: "The customer's own name or number for this production line.",
}

export function fieldHint(field: keyof FormValues): string | undefined {
  return FIELD_HINTS[field]
}
