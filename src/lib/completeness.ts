import type { FormValues } from '../schema/formSchema'
import { isSpiral2Applicable } from '../schema/conditionals'

// Core required fields that apply in both Quick and Full modes
const ALWAYS_REQUIRED: ReadonlyArray<keyof FormValues> = [
  'name', 'companyName', 'email',
  'installationType', 'applicationType', 'productProcessed',
  'incomingProductTemp', 'beltSpeed',
  'spiralManufacturer', 'travelDirection', 'rotationDirection',
  'numTiersSpiral1', 'tierPitch', 'takeUpTravelLength',
  'drumBasis', 'drumValue', 'beltWidth', 'infeedLength', 'dischargeLength',
  'configurationSpiral1', 'returnTypeSpiral1',
  'numRails', 'railSpacing', 'insideOverhang', 'outsideOverhang',
  'carrywayWearstripMaterial', 'drumType', 'cageBarCapMaterial',
]

const FULL_ONLY_REQUIRED: ReadonlyArray<keyof FormValues> = [
  'title', 'phone', 'countryOrRegion', 'address', 'city', 'stateProvince', 'zipPostalCode',
  'howProductCarried', 'heatSource', 'productProperties',
  'productLoad', 'productDimL', 'productDimW', 'productDimH',
  'operatingEnvTemp', 'minOperatingEnvTemp', 'maxOperatingEnvTemp',
]

function isFilled(val: unknown): boolean {
  if (val == null) return false
  if (typeof val === 'string') return val.trim().length > 0
  if (Array.isArray(val)) return val.length > 0
  if (typeof val === 'number') return true
  return Boolean(val)
}

export function getCompleteness(
  values: Partial<FormValues>,
  mode: 'quick' | 'full',
): { filled: number; total: number; pct: number } {
  const required = [...ALWAYS_REQUIRED]

  if (mode === 'full') {
    required.push(...FULL_ONLY_REQUIRED)
  }

  // Add spiral 2 fields if applicable
  if (isSpiral2Applicable(values.travelDirection)) {
    required.push('numTiersSpiral2', 'distanceBetweenDrums', 'configurationSpiral2', 'returnTypeSpiral2')
  }

  // Add cage bar fields if drum = Cage
  if (values.drumType === 'Cage') {
    required.push('cageBarDimA', 'cageBarDimB', 'cageBarDimC')
  }

  const total = required.length
  const filled = required.filter((f) => isFilled(values[f])).length
  return { filled, total, pct: total > 0 ? Math.round((filled / total) * 100) : 0 }
}
