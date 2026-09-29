// AIM Glide ROI Calculator — Types and Calculation Logic
// Design: Executive Dashboard — Dieter Rams-inspired Functionalism

export interface CalculatorInputs {
  customerName: string;
  projectName: string;
  plantLocation: string;
  preparedBy: string;
  outputValue: number;
  outputUnit: string;
  outputProduct: string;
  maintenanceHours: number;
  maintenanceTimeUnit: string;
  maintenanceCost: number;
  maintenanceCostUnit: string;
  unscheduledDowntime: number;
  downtimeUnit: string;
  productWaste: number;
  wasteUnit: string;
  rebuildCost: number;
  sanitationTime: number;
  sanitationTimeUnit: string;
  aimGlideInvestment: number;
  laborRate: number;
  productValue: number;
  laborReallocated: boolean;
  aimMaintenanceHours: number;
  aimSparePartsCost: number;
  aimRebuildCost: number;
  aimSanitationHours: number;
  metalOtherCost: number;
  metalOtherCostUnit: string;
  metalOtherCostDesc: string;
  aimOtherCost: number;
  aimOtherCostUnit: string;
  aimOtherCostDesc: string;
  notes: string[];
}

export interface TCOResult {
  metal: {
    maintenanceLabor: number;
    maintenanceLaborBreakdown: string;
    maintenanceParts: number;
    maintenancePartsBreakdown: string;
    downtimeCost: number;
    downtimeBreakdown: string;
    wasteCost: number;
    wasteBreakdown: string;
    rebuildCost: number;
    sanitationCost: number;
    sanitationBreakdown: string;
    otherCost: number;
    otherCostBreakdown: string;
    total: number;
  };
  aim: {
    maintenanceLabor: number;
    maintenanceLaborBreakdown: string;
    spareparts: number;
    rebuildCost: number;
    sanitationCost: number;
    sanitationBreakdown: string;
    otherCost: number;
    otherCostBreakdown: string;
    total: number;
  };
  savings: {
    yearly: number;
    multiYear: number;
    benefitYears: number;
    paybackYears: string;
    paybackMonths: number;
    roi: string;
  };
  reallocation: {
    hoursPerYear: number;
    isReallocated: boolean;
  };
  investment: number;
}

export interface SavedCalculation {
  name: string;
  data: CalculatorInputs;
  savedAt: string;
}

export const PERIODS_PER_YEAR: Record<string, number> = {
  'per hour': 8760,
  'per day': 365,
  'per week': 52,
  'per month': 12,
  'per year': 1,
};

export const TIME_UNITS = [
  { value: 'per hour', label: 'per hour' },
  { value: 'per day', label: 'per day' },
  { value: 'per week', label: 'per week' },
  { value: 'per month', label: 'per month' },
  { value: 'per year', label: 'per year' },
];

export const TIME_UNITS_NO_HOUR = TIME_UNITS.filter(u => u.value !== 'per hour');

export const PRODUCT_UNITS = [
  { value: 'loaves', label: 'loaves', singular: 'loaf' },
  { value: 'lbs', label: 'lbs', singular: 'lb' },
  { value: 'units', label: 'units', singular: 'unit' },
  { value: 'pieces', label: 'pieces', singular: 'piece' },
];

/**
 * "loaves" -> "loaf", for per-unit labels like "Value per loaf".
 * Trimming a trailing "s" produced "loave"; the unit list is fixed and short, so
 * the singular is simply stated rather than derived.
 */
export function singularProduct(unit: string): string {
  return PRODUCT_UNITS.find(u => u.value === unit)?.singular ?? unit;
}

export const BENEFIT_YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const STORAGE_KEY = 'aim_glide_calculator_data_v3';
export const SAVED_CALCULATIONS_KEY = 'aim_glide_saved_calculations';

/**
 * Illustrative numbers for a mid-size bakery line. These are NOT defaults --
 * they are only applied when the user explicitly taps "Load example values",
 * because a calculator that silently prefills invented figures can be exported
 * to a customer as a PDF that looks like their own data.
 */
export const EXAMPLE_INPUTS: CalculatorInputs = {
  customerName: '',
  projectName: '',
  plantLocation: '',
  preparedBy: '',
  outputValue: 8000,
  outputUnit: 'per hour',
  outputProduct: 'loaves',
  maintenanceHours: 1,
  maintenanceTimeUnit: 'per week',
  maintenanceCost: 3000,
  maintenanceCostUnit: 'per month',
  unscheduledDowntime: 1,
  downtimeUnit: 'per year',
  productWaste: 8000,
  wasteUnit: 'per year',
  rebuildCost: 5000,
  sanitationTime: 0,
  sanitationTimeUnit: 'per week',
  aimGlideInvestment: 89850,
  laborRate: 70,
  productValue: 1,
  laborReallocated: false,
  aimMaintenanceHours: 1,
  aimSparePartsCost: 1000,
  aimRebuildCost: 10000,
  aimSanitationHours: 0,
  metalOtherCost: 0,
  metalOtherCostUnit: 'per year',
  metalOtherCostDesc: '',
  aimOtherCost: 0,
  aimOtherCostUnit: 'per year',
  aimOtherCostDesc: '',
  notes: [''],
};

export const CLEARED_INPUTS: CalculatorInputs = {
  customerName: '',
  projectName: '',
  plantLocation: '',
  preparedBy: '',
  outputValue: 0,
  outputUnit: 'per year',
  outputProduct: 'loaves',
  maintenanceHours: 0,
  maintenanceTimeUnit: 'per year',
  maintenanceCost: 0,
  maintenanceCostUnit: 'per year',
  unscheduledDowntime: 0,
  downtimeUnit: 'per year',
  productWaste: 0,
  wasteUnit: 'per year',
  rebuildCost: 0,
  sanitationTime: 0,
  sanitationTimeUnit: 'per year',
  aimGlideInvestment: 0,
  laborRate: 0,
  productValue: 0,
  laborReallocated: false,
  aimMaintenanceHours: 0,
  aimSparePartsCost: 0,
  aimRebuildCost: 0,
  aimSanitationHours: 0,
  metalOtherCost: 0,
  metalOtherCostUnit: 'per year',
  metalOtherCostDesc: '',
  aimOtherCost: 0,
  aimOtherCostUnit: 'per year',
  aimOtherCostDesc: '',
  notes: [''],
};

export function calculateTCO(inputs: CalculatorInputs, benefitYears: number): TCOResult {
  const hourlyOutput = inputs.outputValue * (PERIODS_PER_YEAR[inputs.outputUnit] / PERIODS_PER_YEAR['per hour']);
  const yearlyMaintenanceHours = inputs.maintenanceHours * PERIODS_PER_YEAR[inputs.maintenanceTimeUnit];
  const yearlyMaintenanceCost = inputs.maintenanceCost * PERIODS_PER_YEAR[inputs.maintenanceCostUnit];
  const yearlyDowntimeHours = inputs.unscheduledDowntime * PERIODS_PER_YEAR[inputs.downtimeUnit];
  const yearlyWaste = inputs.productWaste * PERIODS_PER_YEAR[inputs.wasteUnit];
  const yearlyMetalOtherCost = inputs.metalOtherCost * PERIODS_PER_YEAR[inputs.metalOtherCostUnit];
  const yearlySanitationHours = inputs.sanitationTime * PERIODS_PER_YEAR[inputs.sanitationTimeUnit];
  const yearlyMetalSanitationCost = yearlySanitationHours * inputs.laborRate;
  const yearlyAimOtherCost = inputs.aimOtherCost * PERIODS_PER_YEAR[inputs.aimOtherCostUnit];

  const metalMaintenanceLabor = yearlyMaintenanceHours * inputs.laborRate;
  const metalDowntimeCost = yearlyDowntimeHours * (hourlyOutput * inputs.productValue);
  const metalWasteCost = yearlyWaste * inputs.productValue;
  const metalTotalTCO = metalMaintenanceLabor + yearlyMaintenanceCost + metalDowntimeCost + metalWasteCost + inputs.rebuildCost + yearlyMetalSanitationCost + yearlyMetalOtherCost;

  const aimMaintenanceLabor = inputs.aimMaintenanceHours * inputs.laborRate;
  const aimSanitationCost = inputs.aimSanitationHours * inputs.laborRate;
  const aimTotalTCO = aimMaintenanceLabor + inputs.aimSparePartsCost + inputs.aimRebuildCost + aimSanitationCost + yearlyAimOtherCost;

  const yearlySavings = metalTotalTCO - aimTotalTCO;
  const paybackYears = yearlySavings > 0 ? inputs.aimGlideInvestment / yearlySavings : 0;
  const multiYearSavings = (yearlySavings * benefitYears) - inputs.aimGlideInvestment;
  const roi = inputs.aimGlideInvestment > 0 ? ((multiYearSavings + inputs.aimGlideInvestment) / inputs.aimGlideInvestment - 1) * 100 : 0;

  const stripPer = (s: string) => s.replace('per ', '');

  return {
    metal: {
      maintenanceLabor: Math.round(metalMaintenanceLabor),
      maintenanceLaborBreakdown: inputs.laborReallocated
        ? `${yearlyMaintenanceHours} hrs/year current maintenance`
        : `${inputs.maintenanceHours} hrs/${stripPer(inputs.maintenanceTimeUnit)} × ${PERIODS_PER_YEAR[inputs.maintenanceTimeUnit]} × $${inputs.laborRate}/hr`,
      maintenanceParts: Math.round(yearlyMaintenanceCost),
      maintenancePartsBreakdown: `$${inputs.maintenanceCost.toLocaleString()}/${stripPer(inputs.maintenanceCostUnit)} × ${PERIODS_PER_YEAR[inputs.maintenanceCostUnit]}`,
      downtimeCost: Math.round(metalDowntimeCost),
      downtimeBreakdown: `${inputs.unscheduledDowntime} hrs/${stripPer(inputs.downtimeUnit)} × ${hourlyOutput.toLocaleString()} ${inputs.outputProduct}/hr × $${inputs.productValue}`,
      wasteCost: Math.round(metalWasteCost),
      wasteBreakdown: `${inputs.productWaste.toLocaleString()} ${inputs.outputProduct}/${stripPer(inputs.wasteUnit)} × $${inputs.productValue}`,
      rebuildCost: Math.round(inputs.rebuildCost),
      sanitationCost: Math.round(yearlyMetalSanitationCost),
      sanitationBreakdown: `${inputs.sanitationTime} hrs/${stripPer(inputs.sanitationTimeUnit)} × ${PERIODS_PER_YEAR[inputs.sanitationTimeUnit]} × $${inputs.laborRate}/hr`,
      otherCost: Math.round(yearlyMetalOtherCost),
      otherCostBreakdown: inputs.metalOtherCostDesc || 'Other costs',
      total: Math.round(metalTotalTCO),
    },
    aim: {
      maintenanceLabor: Math.round(aimMaintenanceLabor),
      maintenanceLaborBreakdown: `${inputs.aimMaintenanceHours} hrs/year × $${inputs.laborRate}/hr`,
      spareparts: Math.round(inputs.aimSparePartsCost),
      rebuildCost: Math.round(inputs.aimRebuildCost),
      sanitationCost: Math.round(aimSanitationCost),
      sanitationBreakdown: `${inputs.aimSanitationHours} hrs/year × $${inputs.laborRate}/hr`,
      otherCost: Math.round(yearlyAimOtherCost),
      otherCostBreakdown: inputs.aimOtherCostDesc || 'Other costs',
      total: Math.round(aimTotalTCO),
    },
    savings: {
      yearly: Math.round(yearlySavings),
      multiYear: Math.round(multiYearSavings),
      benefitYears,
      paybackYears: paybackYears.toFixed(2),
      paybackMonths: Math.round(paybackYears * 12),
      roi: roi.toFixed(0),
    },
    reallocation: {
      hoursPerYear: Math.round(yearlyMaintenanceHours - inputs.aimMaintenanceHours),
      isReallocated: inputs.laborReallocated,
    },
    investment: inputs.aimGlideInvestment,
  };
}

export function formatCurrency(value: number): string {
  return '$' + value.toLocaleString();
}

/**
 * Currency with the sign in front of the symbol, for the cash-flow chart.
 * `formatCurrency` would render a recovery position as "$-89,850".
 */
export function formatSignedCurrency(value: number): string {
  return (value < 0 ? '-$' : '$') + Math.abs(value).toLocaleString();
}

/**
 * Has the user entered enough for the results to mean anything?
 *
 * `0` is a real answer everywhere else in this calculator, so this deliberately
 * does not ask "is any figure zero". It asks whether *nothing at all* has been
 * entered -- in which case the Results tab would otherwise render
 * "$0 saved / 0.00 yrs / 0% ROI" as though that were a finding, and Export PDF
 * would hand the account manager an empty analysis to leave with a customer.
 */
export function hasEnoughInput(tco: TCOResult): boolean {
  return tco.metal.total > 0 || tco.aim.total > 0 || tco.investment > 0;
}

/**
 * Payback, in words.
 *
 * `savings.paybackYears` is a raw string like "2.34", which is both false
 * precision for an estimate and unreadable at arm's length on a plant floor.
 * Worse, `calculateTCO` stores `0` when there are no yearly savings, so the raw
 * field renders as "0.00" -- an *instant* payback -- when it actually means the
 * investment never pays back at all. Every surface formats through here so the
 * screen and the PDF cannot disagree about that.
 */
export function formatPayback(tco: TCOResult): string {
  if (tco.investment <= 0) return 'None needed';
  if (tco.savings.yearly <= 0) return 'No payback';

  const months = tco.savings.paybackMonths;
  if (months < 1) return 'Under a month';
  if (months < 12) return months === 1 ? '1 month' : `${months} months`;

  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const yearPart = `${years} yr${years === 1 ? '' : 's'}`;
  return remainder === 0 ? yearPart : `${yearPart} ${remainder} mo`;
}

export interface CashflowPoint {
  year: number;
  /** Cumulative position: negative while the investment is still being recovered. */
  cumulative: number;
}

export interface CashflowSeries {
  points: CashflowPoint[];
  /** Where the line crosses zero, or `null` when it never does. */
  paybackYear: number | null;
  min: number;
  max: number;
}

/**
 * Cumulative cash position year by year, starting at -investment.
 *
 * This is the shape behind the payback chart on both the Results tab and the
 * PDF. It lives here rather than in either renderer so the two cannot drift --
 * the same bug that let the screen say "Spare Parts" while the PDF said
 * "Maintenance Parts" for the same row.
 */
export function buildCashflowSeries(tco: TCOResult, benefitYears: number): CashflowSeries {
  const points: CashflowPoint[] = [];
  for (let year = 0; year <= benefitYears; year++) {
    points.push({ year, cumulative: Math.round(tco.savings.yearly * year - tco.investment) });
  }

  // No savings means the line never climbs, so it never crosses zero. Guard
  // this rather than trusting savings.paybackYears, which is 0 in that case.
  const paybackYear =
    tco.savings.yearly > 0 ? tco.investment / tco.savings.yearly : tco.investment <= 0 ? 0 : null;

  const values = points.map(p => p.cumulative);
  return {
    points,
    paybackYear,
    min: Math.min(...values, 0),
    max: Math.max(...values, 0),
  };
}
