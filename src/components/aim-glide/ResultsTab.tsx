// Results & ROI Tab
// Design: Executive Dashboard — metric cards, bar chart, detailed TCO breakdown

import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type TCOResult, type CalculatorInputs, BENEFIT_YEARS, formatCurrency } from '@/lib/calculator';
import { BarChart3, FileText, TrendingUp, Clock } from 'lucide-react';

interface ResultsTabProps {
  tco: TCOResult;
  inputs: CalculatorInputs;
  benefitYears: number;
  onBenefitYearsChange: (years: number) => void;
}

function StatCard({
  label,
  value,
  subtitle,
  accent,
  valueColor,
  children,
}: {
  label: string;
  value: string;
  subtitle: string;
  accent: 'red' | 'green' | 'orange';
  valueColor?: string;
  children?: React.ReactNode;
}) {
  const accentClass = accent === 'red' ? 'stat-accent-red' : accent === 'green' ? 'stat-accent-green' : 'stat-accent-orange';
  const colorClass = valueColor || (accent === 'green' ? 'text-savings-green' : accent === 'red' ? 'text-primary' : 'text-foreground');

  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-card p-5 sm:p-6 ${accentClass}`}
      role="group"
      aria-label={label}
    >
      {children}
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2" id={`stat-${label.replace(/\s/g, '-')}`}>
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-bold font-mono-num ${colorClass}`} aria-labelledby={`stat-${label.replace(/\s/g, '-')}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function TCORow({
  label,
  breakdown,
  value,
  isTotal,
  valueColor,
  extraInfo,
}: {
  label: string;
  breakdown?: string;
  value: string;
  isTotal?: boolean;
  valueColor?: string;
  extraInfo?: string;
}) {
  return (
    <div className={`flex justify-between items-start py-3 ${isTotal ? 'border-t-2 border-border pt-4 mt-2' : 'border-b border-border/50'} ${isTotal ? 'font-semibold' : ''}`}>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-3">
        <span className="text-sm text-foreground/80">{label}</span>
        {breakdown && (
          <span className="text-[11px] text-muted-foreground font-mono truncate">{breakdown}</span>
        )}
        {extraInfo && (
          <span className="text-[11px] text-primary font-medium">{extraInfo}</span>
        )}
      </div>
      <span className={`text-sm font-mono-num font-medium whitespace-nowrap ${valueColor || ''}`}>{value}</span>
    </div>
  );
}

export function ResultsTab({ tco, benefitYears, onBenefitYearsChange }: ResultsTabProps) {
  const maxTCO = Math.max(tco.metal.total, tco.aim.total, 1);
  const metalBarHeight = Math.min(220, (tco.metal.total / maxTCO) * 220);
  const aimBarHeight = Math.min(220, (tco.aim.total / maxTCO) * 220);

  return (
    <div className="space-y-6 animate-in fade-in duration-300" role="region" aria-label="Results and ROI analysis">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="group" aria-label="Key metrics summary">
        <StatCard
          label="Annual Savings"
          value={formatCurrency(tco.savings.yearly)}
          subtitle="vs. Traditional Slat Switch"
          accent="green"
        />
        <StatCard
          label="Payback Period"
          value={tco.savings.paybackYears}
          subtitle={`Years (${tco.savings.paybackMonths} months)`}
          accent="red"
        />
        {tco.reallocation.isReallocated ? (
          <StatCard
            label="Hours Reallocated"
            value={String(tco.reallocation.hoursPerYear)}
            subtitle="Hours/year to other work"
            accent="orange"
            valueColor="text-primary"
          />
        ) : (
          <StatCard
            label={`${benefitYears}-Year ROI`}
            value={`${tco.savings.roi}%`}
            subtitle="Return on Investment"
            accent="orange"
          />
        )}
        <StatCard
          label="Net Benefit"
          value={formatCurrency(tco.savings.multiYear)}
          subtitle="After Investment Recovery"
          accent="green"
        >
          <div className="absolute top-4 right-4">
            <Select value={String(benefitYears)} onValueChange={(v) => onBenefitYearsChange(parseInt(v))}>
              <SelectTrigger className="h-7 text-xs w-auto min-w-[70px] border-border/50" aria-label="Select benefit period in years">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BENEFIT_YEARS.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}-Year</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </StatCard>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <BarChart3 className="size-5 text-primary" aria-hidden="true" />
            Annual TCO Comparison
          </CardTitle>
          <CardAction>
            {tco.reallocation.isReallocated ? (
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                <Clock className="size-3" />
                {tco.reallocation.hoursPerYear} hrs/yr reallocated
              </Badge>
            ) : (
              <Badge variant="outline" className="border-savings-green/30 text-savings-green bg-savings-green/5">
                <TrendingUp className="size-3" />
                Save {formatCurrency(tco.savings.yearly)}/year
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardContent className="pt-6">
          <div
            className="flex items-end justify-center gap-12 sm:gap-20 h-[280px] sm:h-[320px] px-4 pb-4"
            role="img"
            aria-label={`Bar chart comparing Traditional Slat Switch annual TCO of ${formatCurrency(tco.metal.total)} versus AIM Glide annual TCO of ${formatCurrency(tco.aim.total)}`}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-20 sm:w-28 rounded-t-md flex items-start justify-center pt-4 transition-all duration-500 ease-out"
                style={{
                  height: `${metalBarHeight}px`,
                  background: 'linear-gradient(180deg, oklch(0.6 0.02 280) 0%, oklch(0.5 0.02 280) 100%)',
                }}
              >
                <span className="text-white font-mono-num font-semibold text-sm sm:text-base">
                  {formatCurrency(tco.metal.total)}
                </span>
              </div>
              <span className="text-sm font-medium text-muted-foreground text-center">Traditional<br className="sm:hidden" /> Slat Switch</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-20 sm:w-28 rounded-t-md flex items-start justify-center pt-4 transition-all duration-500 ease-out"
                style={{
                  height: `${aimBarHeight}px`,
                  background: 'linear-gradient(180deg, oklch(0.62 0.17 165) 0%, oklch(0.52 0.15 165) 100%)',
                }}
              >
                <span className="text-white font-mono-num font-semibold text-sm sm:text-base">
                  {formatCurrency(tco.aim.total)}
                </span>
              </div>
              <span className="text-sm font-medium text-muted-foreground text-center">AIM Glide</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed TCO Breakdown */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <FileText className="size-5 text-primary" aria-hidden="true" />
            Detailed TCO Breakdown (Annual)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traditional Slat Switch Column */}
            <div className="rounded-lg bg-muted/40 p-5 border-l-4 border-metal-gray" role="region" aria-label="Traditional Slat Switch costs">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-metal-gray" aria-hidden="true" />
                Traditional Slat Switch
              </h3>
              <TCORow
                label="Maintenance Labor"
                breakdown={tco.metal.maintenanceLaborBreakdown}
                value={formatCurrency(tco.metal.maintenanceLabor)}
                extraInfo={tco.reallocation.isReallocated ? `${tco.reallocation.hoursPerYear} hrs to be reallocated after AIM investment` : undefined}
              />
              <TCORow
                label="Maintenance Parts"
                breakdown={tco.metal.maintenancePartsBreakdown}
                value={formatCurrency(tco.metal.maintenanceParts)}
              />
              <TCORow
                label="Unscheduled Downtime"
                breakdown={tco.metal.downtimeBreakdown}
                value={formatCurrency(tco.metal.downtimeCost)}
              />
              <TCORow
                label="Product Waste"
                breakdown={tco.metal.wasteBreakdown}
                value={formatCurrency(tco.metal.wasteCost)}
              />
              <TCORow
                label="Rebuild Cost"
                value={formatCurrency(tco.metal.rebuildCost)}
              />
              <TCORow
                label="Sanitation"
                breakdown={tco.metal.sanitationBreakdown}
                value={formatCurrency(tco.metal.sanitationCost)}
              />
              {tco.metal.otherCost > 0 && (
                <TCORow
                  label="Other Costs"
                  breakdown={tco.metal.otherCostBreakdown}
                  value={formatCurrency(tco.metal.otherCost)}
                />
              )}
              <TCORow
                label="Total Annual TCO"
                value={formatCurrency(tco.metal.total)}
                isTotal
              />
            </div>

            {/* AIM Glide Column */}
            <div className="rounded-lg bg-muted/40 p-5 border-l-4 border-savings-green" role="region" aria-label="AIM Glide costs">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-savings-green" aria-hidden="true" />
                AIM Glide Switch
              </h3>
              <TCORow
                label="Maintenance Labor"
                breakdown={tco.aim.maintenanceLaborBreakdown}
                value={formatCurrency(tco.aim.maintenanceLabor)}
                extraInfo={tco.reallocation.isReallocated ? `+${tco.reallocation.hoursPerYear} hrs freed` : undefined}
              />
              <TCORow
                label="Spare Parts"
                value={formatCurrency(tco.aim.spareparts)}
              />
              <TCORow
                label="Unscheduled Downtime"
                breakdown="Eliminated with AIM Glide"
                value="$0"
                valueColor="text-savings-green"
              />
              <TCORow
                label="Product Waste"
                breakdown="Eliminated with AIM Glide"
                value="$0"
                valueColor="text-savings-green"
              />
              <TCORow
                label="Rebuild Cost"
                value={formatCurrency(tco.aim.rebuildCost)}
              />
              <TCORow
                label="Sanitation"
                breakdown={tco.aim.sanitationBreakdown}
                value={formatCurrency(tco.aim.sanitationCost)}
              />
              {tco.aim.otherCost > 0 && (
                <TCORow
                  label="Other Costs"
                  breakdown={tco.aim.otherCostBreakdown}
                  value={formatCurrency(tco.aim.otherCost)}
                />
              )}
              <TCORow
                label="Total Annual TCO"
                value={formatCurrency(tco.aim.total)}
                isTotal
                valueColor="text-savings-green"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
