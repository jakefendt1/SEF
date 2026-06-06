import type { VercelRequest, VercelResponse } from '@vercel/node'
import { google } from 'googleapis'

// Column order for the Google Sheet (row index = column A, B, C …)
// The sheet needs a matching header row — see SHEET_SETUP.md.
function toSheetRow(id: string, data: Record<string, unknown>): (string | number)[] {
  const str = (v: unknown) => (v == null ? '' : String(v))
  const num = (v: unknown) => (v == null ? '' : Number(v))
  const arr = (v: unknown) => (Array.isArray(v) ? v.join(', ') : '')

  return [
    // Meta
    id,
    new Date().toISOString(),
    str(data.mode),
    // § 1 Personal Info
    str(data.name),
    str(data.title),
    str(data.email),
    str(data.phone),
    str(data.companyName),
    str(data.countryOrRegion),
    str(data.address),
    str(data.city),
    str(data.stateProvince),
    str(data.zipPostalCode),
    // § 2 Application
    str(data.installationType),
    str(data.applicationType),
    str(data.applicationTypeOther),
    str(data.productProcessed),
    str(data.howProductCarried),
    arr(data.heatSource),
    str(data.heatSourceSpecify),
    arr(data.productProperties),
    str(data.beltCleaning),
    str(data.chemicalsUsed),
    num(data.productLoad),
    str(data.productLoadUnit),
    num(data.weightPerPiece),
    str(data.weightPerPieceUnit),
    num(data.productDimL),
    num(data.productDimW),
    num(data.productDimH),
    num(data.productionRate),
    str(data.productionRateUnit),
    num(data.productionHoursPerDay),
    str(data.loadingPattern),
    num(data.productsAcrossWidth),
    str(data.leadingDimension),
    num(data.incomingProductTemp),
    num(data.operatingEnvTemp),
    num(data.minOperatingEnvTemp),
    num(data.maxOperatingEnvTemp),
    num(data.beltSpeed),
    str(data.beltType),
    str(data.technology),
    str(data.preferredBeltSeries),
    str(data.preferredBeltSeriesOther),
    arr(data.beltAccessories),
    str(data.beltAccessoriesOther),
    num(data.sprocketBoreSize),
    str(data.additionalComments),
    // § 3 System Information
    str(data.spiralManufacturer),
    str(data.travelDirection),
    str(data.rotationDirection),
    num(data.numTiersSpiral1),
    num(data.numTiersSpiral2),
    num(data.tierPitch),
    num(data.takeUpTravelLength),
    str(data.takeUpLoop),
    num(data.beltLength),
    num(data.minRollerDiameter),
    str(data.drumBasis),
    num(data.drumValue),
    num(data.beltWidth),
    num(data.infeedLength),
    num(data.dischargeLength),
    num(data.distanceBetweenDrums),
    str(data.configurationSpiral1),
    str(data.configurationSpiral2),
    str(data.returnTypeSpiral1),
    str(data.returnTypeSpiral2),
    // § 4 System Details
    str(data.numRails),
    num(data.railSpacing),
    num(data.overhang),
    str(data.beltSupportMaterial),
    str(data.carrywayWearstripMaterial),
    str(data.carrywayWearstripMaterialOther),
    str(data.drumType),
    num(data.cageBarDimA),
    num(data.cageBarDimB),
    num(data.cageBarDimC),
    str(data.cageBarCapMaterial),
    str(data.cageBarCapMaterialOther),
    str(data.capProfile),
    str(data.capProfileOther),
    str(data.tierSensorsEveryTier),
    arr(data.takeUpSensors),
    str(data.beltWasher),
    str(data.topTierHoldDown),
    str(data.returnPathHoldDown),
    str(data.productContainmentRail),
    str(data.numVFDs),
    // § 5 Project Information
    str(data.projectNumber),
    str(data.endUserName),
    str(data.endUserCity),
    str(data.endUserState),
    str(data.lineId),
  ]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id, data } = req.body as { id?: string; data?: Record<string, unknown> }
  if (!id || !data) return res.status(400).json({ error: 'Missing id or data' })

  const bom = /^﻿/
  const keyJson = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? '').replace(bom, '')
  const sheetId = (process.env.GOOGLE_SHEET_ID ?? '').replace(bom, '').trim()
  if (!keyJson || !sheetId) {
    return res.status(500).json({ error: 'Server not configured (missing env vars)' })
  }

  try {
    const credentials = JSON.parse(keyJson)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheets = google.sheets({ version: 'v4', auth })

    // Write header row on first use (if sheet is empty)
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Submissions!A1',
    }).catch(() => null)

    const hasHeader = (existing?.data?.values?.length ?? 0) > 0
    if (!hasHeader) {
      const headers = [
        'Assessment ID', 'Submitted At', 'Mode',
        'Name', 'Title', 'Email', 'Phone', 'Company Name', 'Country/Region',
        'Address', 'City', 'State/Province', 'Zip/Postal Code',
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
        'Spiral Manufacturer', 'Travel Direction', 'Rotation Direction',
        'Tiers Spiral 1', 'Tiers Spiral 2', 'Tier Pitch (in)',
        'Take Up Travel (in)', 'Take Up Loop', 'Belt Length (ft)',
        'Min Roller Dia (in)', 'Drum Basis', 'Drum Value (in)', 'Belt Width (in)',
        'Infeed Length A (ft)', 'Discharge Length B (ft)', 'Distance Btwn Drums (ft)',
        'Config Spiral 1', 'Config Spiral 2', 'Return Type S1', 'Return Type S2',
        'Num Rails', 'Rail Spacing (in)', 'Overhang (in)', 'Belt Support Material',
        'Carryway Material', 'Carryway Material (Other)', 'Drum Type',
        'Cage Bar A (in)', 'Cage Bar B (in)', 'Cage Bar C (in)',
        'Cap Material', 'Cap Material (Other)', 'Cap Profile', 'Cap Profile (Other)',
        'Tier Sensors/Tier', 'Take Up Sensors', 'Belt Washer',
        'Top Tier Hold Down', 'Return Path Hold Down', 'Product Containment Rail',
        'Num VFDs',
        'Project #', 'End User Name', 'End User City', 'End User State', 'Line ID',
      ]
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Submissions!A1',
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      })
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Submissions!A:A',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [toSheetRow(id, data)] },
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[/api/submit]', err)
    return res.status(500).json({ error: 'Failed to write to sheet' })
  }
}
