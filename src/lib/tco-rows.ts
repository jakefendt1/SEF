// The TCO breakdown, as data.
//
// This list used to be authored twice: as JSX in ResultsTab and again as a
// `rows` array in pdf-export. They had already drifted -- the screen said "Spare
// Parts" where the PDF said "Maintenance Parts", the PDF hard-coded "$0" for AIM
// downtime and waste instead of reading the computed figures, and the PDF
// dropped every calc-trace string, which is the layer a plant manager actually
// interrogates. Both surfaces now render this one list.

import type { TCOResult } from './calculator';

export interface TcoRow {
  label: string;
  /** `null` means the row does not apply to that column and renders as a dash. */
  metal: number | null;
  aim: number | null;
  /** How the figure was arrived at, e.g. "1 hrs/week x 52 x $70/hr". */
  metalBreakdown?: string;
  aimBreakdown?: string;
  /** Short callout shown beneath the figure, e.g. the reallocation note. */
  metalNote?: string;
  aimNote?: string;
  /**
   * The AIM figure is a zero that AIM Glide *removed*, not a zero nobody
   * entered. Stated as a flag so renderers don't have to pattern-match the
   * breakdown copy to decide how to colour it.
   */
  aimEliminated?: boolean;
  isTotal?: boolean;
}

/**
 * The cost rows, in the order both surfaces present them.
 *
 * The trailing total row is included so the two renderers cannot disagree about
 * its label or placement either; callers that need only the line items can
 * filter on `isTotal`.
 */
export function buildTcoRows(tco: TCOResult): TcoRow[] {
  const reallocated = tco.reallocation.isReallocated;
  const hours = tco.reallocation.hoursPerYear;

  const rows: TcoRow[] = [
    {
      label: 'Maintenance Labor',
      metal: tco.metal.maintenanceLabor,
      aim: tco.aim.maintenanceLabor,
      metalBreakdown: tco.metal.maintenanceLaborBreakdown,
      aimBreakdown: tco.aim.maintenanceLaborBreakdown,
      metalNote: reallocated
        ? `${hours} hrs to be reallocated after AIM investment`
        : undefined,
      aimNote: reallocated ? `+${hours} hrs freed` : undefined,
    },
    {
      label: 'Maintenance Parts',
      metal: tco.metal.maintenanceParts,
      aim: tco.aim.spareparts,
      metalBreakdown: tco.metal.maintenancePartsBreakdown,
      aimBreakdown: 'Spare parts held for AIM Glide',
    },
    {
      label: 'Unscheduled Downtime',
      metal: tco.metal.downtimeCost,
      aim: 0,
      metalBreakdown: tco.metal.downtimeBreakdown,
      aimBreakdown: 'Eliminated with AIM Glide',
      aimEliminated: true,
    },
    {
      label: 'Product Waste',
      metal: tco.metal.wasteCost,
      aim: 0,
      metalBreakdown: tco.metal.wasteBreakdown,
      aimBreakdown: 'Eliminated with AIM Glide',
      aimEliminated: true,
    },
    {
      label: 'Rebuild Cost',
      metal: tco.metal.rebuildCost,
      aim: tco.aim.rebuildCost,
    },
    {
      label: 'Sanitation',
      metal: tco.metal.sanitationCost,
      aim: tco.aim.sanitationCost,
      metalBreakdown: tco.metal.sanitationBreakdown,
      aimBreakdown: tco.aim.sanitationBreakdown,
    },
  ];

  // Only surfaced when there is something to surface -- an empty "Other Costs"
  // row invites the question "other than what?" in front of a customer.
  if (tco.metal.otherCost > 0 || tco.aim.otherCost > 0) {
    rows.push({
      label: 'Other Costs',
      metal: tco.metal.otherCost > 0 ? tco.metal.otherCost : null,
      aim: tco.aim.otherCost > 0 ? tco.aim.otherCost : null,
      metalBreakdown: tco.metal.otherCost > 0 ? tco.metal.otherCostBreakdown : undefined,
      aimBreakdown: tco.aim.otherCost > 0 ? tco.aim.otherCostBreakdown : undefined,
    });
  }

  rows.push({
    label: 'Total Annual TCO',
    metal: tco.metal.total,
    aim: tco.aim.total,
    isTotal: true,
  });

  return rows;
}
