import type { StoredAssessment } from './db'

const HEADERS = [
  'Assessment ID', 'Created At', 'Status', 'Mode',
  // § 1 Personal Info
  'Name', 'Title', 'Email', 'Phone', 'Company Name', 'Country/Region',
  'Address', 'City', 'State/Province', 'Zip/Postal Code',
  // § 2 Application
  'Installation Type', 'Application Type', 'App Type (Other)',
  'Product Processed', 'How Product Carried',
  'Heat Source', 'Heat Source (Specify)', 'Product Properties',
  'Belt Cleaning', 'Chemicals Used',
  'Product Load', 'Product Load Unit', 'Weight/Piece', 'Weight/Piece Unit',
  'Product Dim L', 'Product Dim W', 'Product Dim H',
  'Production Rate', 'Production Rate Unit', 'Production Hrs/Day',
  'Loading Pattern', 'Products Across Width', 'Leading Dimension',
  'Incoming Temp (°F)', 'Env Temp (°F)', 'Min Env Temp (°F)', 'Max Env Temp (°F)',
  'Belt Speed (fpm)', 'Belt Type', 'Technology',
  'Belt Series', 'Belt Series (Other)', 'Belt Accessories', 'Belt Acc (Other)',
  'Sprocket Bore (in)', 'Additional Comments',
  // § 3 System Information
  'Spiral Manufacturer', 'Travel Direction', 'Rotation Direction',
  'Tiers Spiral 1', 'Tiers Spiral 2', 'Tier Pitch (in)',
  'Take Up Travel (in)', 'Take Up Loop', 'Belt Length (ft)',
  'Min Roller Dia (in)', 'Drum Basis', 'Drum Value (in)', 'Belt Width (in)',
  'Infeed Length A (ft)', 'Discharge Length B (ft)', 'Distance Btwn Drums (ft)',
  'Config Spiral 1', 'Config Spiral 2', 'Return Type S1', 'Return Type S2',
  // § 4 System Details
  'Num Rails', 'Rail Spacing (in)', 'Inside Overhang (in)', 'Outside Overhang (in)',
  'Belt Support Material', 'Carryway Material', 'Carryway Material (Other)', 'Drum Type',
  'Cage Bar A (in)', 'Cage Bar B (in)', 'Cage Bar C (in)',
  'Cap Material', 'Cap Material (Other)', 'Cap Profile', 'Cap Profile (Other)',
  'Tier Sensors/Tier', 'Take Up Sensors', 'Belt Washer',
  'Top Tier Hold Down', 'Return Path Hold Down', 'Product Containment Rail', 'Num VFDs',
  // § 5 Project Information
  'Project #', 'End User Name', 'End User City', 'End User State', 'Line ID',
]

function cell(v: unknown): string {
  if (v == null) return ''
  const s = Array.isArray(v) ? v.join(', ') : String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toRow(a: StoredAssessment): string[] {
  const d = (a.data ?? {}) as Record<string, unknown>
  const str = (k: string) => d[k] == null ? '' : String(d[k])
  const num = (k: string) => d[k] == null ? '' : String(d[k])
  const arr = (k: string) => Array.isArray(d[k]) ? (d[k] as unknown[]).join(', ') : ''

  return [
    a.id,
    new Date(a.createdAt).toISOString(),
    a.status,
    str('mode'),
    str('name'), str('title'), str('email'), str('phone'), str('companyName'), str('countryOrRegion'),
    str('address'), str('city'), str('stateProvince'), str('zipPostalCode'),
    str('installationType'), str('applicationType'), str('applicationTypeOther'),
    str('productProcessed'), str('howProductCarried'),
    arr('heatSource'), str('heatSourceSpecify'), arr('productProperties'),
    str('beltCleaning'), str('chemicalsUsed'),
    num('productLoad'), str('productLoadUnit'), num('weightPerPiece'), str('weightPerPieceUnit'),
    num('productDimL'), num('productDimW'), num('productDimH'),
    num('productionRate'), str('productionRateUnit'), num('productionHoursPerDay'),
    str('loadingPattern'), num('productsAcrossWidth'), str('leadingDimension'),
    num('incomingProductTemp'), num('operatingEnvTemp'), num('minOperatingEnvTemp'), num('maxOperatingEnvTemp'),
    num('beltSpeed'), str('beltType'), str('technology'),
    str('preferredBeltSeries'), str('preferredBeltSeriesOther'), arr('beltAccessories'), str('beltAccessoriesOther'),
    num('sprocketBoreSize'), str('additionalComments'),
    str('spiralManufacturer'), str('travelDirection'), str('rotationDirection'),
    num('numTiersSpiral1'), num('numTiersSpiral2'), num('tierPitch'),
    num('takeUpTravelLength'), str('takeUpLoop'), num('beltLength'),
    num('minRollerDiameter'), str('drumBasis'), num('drumValue'), num('beltWidth'),
    num('infeedLength'), num('dischargeLength'), num('distanceBetweenDrums'),
    str('configurationSpiral1'), str('configurationSpiral2'), str('returnTypeSpiral1'), str('returnTypeSpiral2'),
    num('numRails'), num('railSpacing'), num('insideOverhang'), num('outsideOverhang'),
    str('beltSupportMaterial'), str('carrywayWearstripMaterial'), str('carrywayWearstripMaterialOther'), str('drumType'),
    num('cageBarDimA'), num('cageBarDimB'), num('cageBarDimC'),
    str('cageBarCapMaterial'), str('cageBarCapMaterialOther'), str('capProfile'), str('capProfileOther'),
    str('tierSensorsEveryTier'), arr('takeUpSensors'), str('beltWasher'),
    str('topTierHoldDown'), str('returnPathHoldDown'), str('productContainmentRail'), str('numVFDs'),
    str('projectNumber'), str('endUserName'), str('endUserCity'), str('endUserState'), str('lineId'),
  ]
}

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadAllCSV(assessments: StoredAssessment[]) {
  const rows = [HEADERS, ...assessments.map(toRow)]
  const csv = rows.map((r) => r.map(cell).join(',')).join('\r\n')
  triggerDownload(csv, `spiral-assessments-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function downloadSingleCSV(a: StoredAssessment) {
  const company = ((a.data?.companyName as string | undefined) ?? 'assessment')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const csv = [HEADERS, toRow(a)].map((r) => r.map(cell).join(',')).join('\r\n')
  triggerDownload(csv, `${company}-${a.id.slice(0, 8)}.csv`)
}
