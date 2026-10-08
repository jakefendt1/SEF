// Repair section (ThermoLace) and sectioning state for the configurator.
import { effective, pitchMm, type TdBelt } from './belt'
import { REPAIR_FIXED_ROWS } from './data'
import { computeSections, lacePlacement, repairFlights, totalRows, type SectionMode, type Sections } from './geometry'

export interface RepairState {
  /** Repair section length in whole rows. */
  rows: number
  flightsOn: boolean
  startRow: number
}

export const defaultRepair = (b: TdBelt): RepairState => ({
  rows: REPAIR_FIXED_ROWS[b.series],
  flightsOn: true,
  startRow: b.vars[0]?.startRow ?? 2,
})

export function repairResult(belt: TdBelt, repair: RepairState) {
  const b = effective(belt)
  const L = repair.rows * pitchMm(b)
  const v = { ...b.vars[0], startRow: repair.startRow }
  return { L, lace: lacePlacement(b, L), flights: repair.flightsOn && b.flightsOn ? repairFlights(b, L, b.flightSpacingMm, v) : null, v }
}

export function defaultSectionMode(): SectionMode {
  return { kind: 'count', count: 2 }
}

export function sectionsFor(belt: TdBelt, mode: SectionMode): Sections {
  return computeSections(totalRows(belt), mode)
}
