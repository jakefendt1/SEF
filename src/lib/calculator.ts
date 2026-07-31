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
  { value: 'loaves', label: 'loaves' },
  { value: 'lbs', label: 'lbs' },
  { value: 'units', label: 'units' },
  { value: 'pieces', label: 'pieces' },
];

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
