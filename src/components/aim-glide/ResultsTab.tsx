// Results & ROI Tab
// Design: Executive Dashboard — metric cards, cost comparison, payback, breakdown
//
// Every figure and label on this page comes from the same helpers the PDF uses
// (`buildTcoRows`, `formatPayback`, `buildCashflowSeries`). The two surfaces are
// shown to the customer minutes apart, so they must not be able to disagree.

import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type TCOResult,
  BENEFIT_YEARS,
  buildCashflowSeries,
  formatCurrency,
  formatPayback,
  formatSignedCurrency,
  hasEnoughInput,
} from '@/lib/calculator';
import { buildTcoRows, type TcoRow } from '@/lib/tco-rows';
import { BarChart3, Calculator, FileText, TrendingDown, TrendingUp, Clock } from 'lucide-react';

interface ResultsTabProps {
  tco: TCOResult;
  benefitYears: number;
  onBenefitYearsChange: (years: number) => void;
  onGoToCalculator: () => void;
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
    <div className={`flex justify-between items-start py-3 ${isTotal ? 'border-t-2 border-border pt-4 mt-2 font-semibold' : 'border-b border-border/50'}`}>
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

/** One side of the detailed breakdown, driven by the shared row list. */
function BreakdownColumn({
  title,
  dotClass,
  borderClass,
  rows,
  side,
}: {
  title: string;
  dotClass: string;
  borderClass: string;
  rows: TcoRow[];
  side: 'metal' | 'aim';
}) {
  return (
    <div
      className={`rounded-lg bg-muted/40 p-5 border-l-4 ${borderClass}`}
      role="region"
      aria-label={`${title} costs`}
    >
      <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${dotClass}`} aria-hidden="true" />
        {title}
      </h3>
      {rows.map(row => {
        const value = side === 'metal' ? row.metal : row.aim;
        const breakdown = side === 'metal' ? row.metalBreakdown : row.aimBreakdown;
        const note = side === 'metal' ? row.metalNote : row.aimNote;
        // A zero AIM Glide removed is good news; a zero nobody entered is not.
        const isEliminated = side === 'aim' && row.aimEliminated;
        return (
          <TCORow
            key={row.label}
            label={row.label}
            breakdown={breakdown}
            extraInfo={note}
            value={value === null ? '—' : formatCurrency(value)}
            isTotal={row.isTotal}
            valueColor={
              isEliminated || (row.isTotal && side === 'aim') ? 'text-savings-green' : undefined
            }
          />
        );
      })}
    </div>
  );
}

/**
 * Cumulative cash position, year by year.
 *
 * The page used to assert a payback period as a bare number and show nothing
 * that made it legible. This is the columns crossing the axis — the same shape
 * the PDF draws, from the same `buildCashflowSeries` data.
 */
function PaybackChart({ tco, benefitYears }: { tco: TCOResult; benefitYears: number }) {
  const series = buildCashflowSeries(tco, benefitYears);
  const span = series.max - series.min || 1;
  const zeroPct = ((series.max - 0) / span) * 100;

  const description = series.points
    .map(p => `${p.year === 0 ? 'today' : `year ${p.year}`}: ${formatSignedCurrency(p.cumulative)}`)
    .join(', ');

  return (
    <div>
      <div
        className="relative h-44 sm:h-52"
        role="img"
        aria-label={`Cumulative cash position, starting at ${formatSignedCurrency(-tco.investment)} and reaching ${formatSignedCurrency(series.points.at(-1)!.cumulative)} — ${description}`}
      >
        {/* The line the customer cares about crossing. */}
        <div
          className="absolute left-0 right-0 border-t border-border"
          style={{ top: `${zeroPct}%` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex" aria-hidden="true">
          {series.points.map(point => {
            const heightPct = (Math.abs(point.cumulative) / span) * 100;
            const positive = point.cumulative >= 0;
            return (
              <div key={point.year} className="flex-1 relative">
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-1/2 max-w-10 rounded-sm transition-all duration-500 ease-out ${
                    positive ? 'bg-savings-green' : 'bg-metal-gray'
                  }`}
                  style={
                    positive
                      ? { bottom: `${100 - zeroPct}%`, height: `${heightPct}%` }
                      : { top: `${zeroPct}%`, height: `${heightPct}%` }
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex mt-2" aria-hidden="true">
        {series.points.map(point => (
          <div key={point.year} className="flex-1 text-center text-[11px] text-muted-foreground">
            {point.year === 0 ? 'Now' : `Yr ${point.year}`}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        {series.paybackYear === null ? (
          <>The investment does not recover at these figures.</>
        ) : (
          <>
            The {formatCurrency(tco.investment)} investment recovers after{' '}
            <span className="font-medium text-foreground">{formatPayback(tco)}</span>, then
            accumulates at {formatCurrency(tco.savings.yearly)} a year.
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Shown before anything has been entered.
 *
 * Without it the page renders "$0 saved / 0.00 yrs / 0% ROI" against empty
 * inputs, which reads as a finding rather than an absence — and Export PDF
 * would hand that to a customer. Note this asks whether *nothing* has been
 * entered, not whether any figure is zero; zero is a real answer here.
 */
function NothingToShow({ onGoToCalculator }: { onGoToCalculator: () => void }) {
  return (
    <Card className="animate-in fade-in duration-300">
      <CardContent className="flex flex-col items-center text-center gap-4 py-12 px-6">
        <Calculator className="size-10 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold">Nothing to compare yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Enter the line's current costs and the AIM Glide investment on the Calculator tab, and
            the comparison will build itself here.
          </p>
        </div>
        <Button onClick={onGoToCalculator} className="min-h-[48px] text-base">
          Go to Calculator
        </Button>
      </CardContent>
    </Card>
  );
}

export function ResultsTab({
  tco,
  benefitYears,
  onBenefitYearsChange,
  onGoToCalculator,
}: ResultsTabProps) {
  if (!hasEnoughInput(tco)) {
    return <NothingToShow onGoToCalculator={onGoToCalculator} />;
  }

  const rows = buildTcoRows(tco);
  const saving = tco.savings.yearly > 0;
  const maxTCO = Math.max(tco.metal.total, tco.aim.total, 1);

  const paybackSubtitle =
    tco.investment <= 0
      ? 'No investment entered yet'
      : tco.savings.yearly <= 0
        ? 'AIM Glide costs more to run at these numbers'
        : `To recover ${formatCurrency(tco.investment)}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300" role="region" aria-label="Results and ROI analysis">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="group" aria-label="Key metrics summary">
        {/* Both of these can go negative, and rendering "$-449,430" in green
            would read as a win. Sign and colour follow the number. */}
        <StatCard
          label="Annual Savings"
          value={formatSignedCurrency(tco.savings.yearly)}
          subtitle="vs. Traditional Slat Switch"
          accent="green"
          valueColor={saving ? undefined : 'text-destructive'}
        />
        <StatCard
          label="Payback Period"
          value={formatPayback(tco)}
          subtitle={paybackSubtitle}
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
          value={formatSignedCurrency(tco.savings.multiYear)}
          subtitle="After Investment Recovery"
          accent="green"
          valueColor={tco.savings.multiYear >= 0 ? undefined : 'text-destructive'}
        >
          <div className="absolute top-4 right-4">
            <Select value={String(benefitYears)} onValueChange={(v) => onBenefitYearsChange(parseInt(v))}>
              <SelectTrigger className="h-9 text-xs w-auto min-w-[76px] border-border/50" aria-label="Select benefit period in years">
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

      {/* Annual comparison */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <BarChart3 className="size-5 text-primary" aria-hidden="true" />
            Annual Cost of Ownership
          </CardTitle>
          <CardAction>
            {tco.reallocation.isReallocated ? (
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                <Clock className="size-3" />
                {tco.reallocation.hoursPerYear} hrs/yr reallocated
              </Badge>
            ) : saving ? (
              <Badge variant="outline" className="border-savings-green/30 text-savings-green bg-savings-green/5">
                <TrendingUp className="size-3" />
                Payback in {formatPayback(tco)}
              </Badge>
            ) : (
              // "Payback in No payback" is what the unconditional version read.
              <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5">
                <TrendingUp className="size-3" />
                No payback
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div
            className="space-y-4"
            role="img"
            aria-label={`Traditional Slat Switch costs ${formatCurrency(tco.metal.total)} a year; AIM Glide costs ${formatCurrency(tco.aim.total)} a year`}
          >
            {([
              ['Traditional Slat Switch', tco.metal.total, 'bg-metal-gray'],
              ['AIM Glide', tco.aim.total, 'bg-savings-green'],
            ] as const).map(([label, value, barClass]) => (
              <div key={label} className="flex items-center gap-4">
                <span className="w-32 sm:w-44 shrink-0 text-sm font-medium text-muted-foreground">
                  {label}
                </span>
                <div className="flex-1 h-9 rounded-md bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-md transition-all duration-500 ease-out ${barClass}`}
                    style={{ width: `${Math.max((value / maxTCO) * 100, 1)}%` }}
                  />
                </div>
                <span className="w-24 sm:w-28 shrink-0 text-right text-sm sm:text-base font-mono-num font-semibold">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
          </div>

          {/* The delta is the point of the chart, and it used to be missing from it. */}
          <div
            className={`flex flex-wrap items-baseline justify-between gap-2 rounded-lg px-4 py-3 ${
              saving ? 'bg-savings-green-light' : 'bg-destructive/10'
            }`}
          >
            <span className={`flex items-center gap-2 text-base font-semibold ${saving ? 'text-savings-green' : 'text-destructive'}`}>
              {saving ? <TrendingDown className="size-4" aria-hidden="true" /> : <TrendingUp className="size-4" aria-hidden="true" />}
              {saving
                ? `Saves ${formatCurrency(tco.savings.yearly)} per year`
                : `Costs ${formatCurrency(Math.abs(tco.savings.yearly))} more per year`}
            </span>
            <span className="text-sm text-muted-foreground font-mono-num">
              {formatCurrency(tco.metal.total)} → {formatCurrency(tco.aim.total)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payback */}
      {tco.investment > 0 && (
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <Clock className="size-5 text-primary" aria-hidden="true" />
              Cumulative Position
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="border-border text-muted-foreground">
                {benefitYears}-year view
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-6">
            <PaybackChart tco={tco} benefitYears={benefitYears} />
          </CardContent>
        </Card>
      )}

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
            <BreakdownColumn
              title="Traditional Slat Switch"
              dotClass="bg-metal-gray"
              borderClass="border-metal-gray"
              rows={rows}
              side="metal"
            />
            <BreakdownColumn
              title="AIM Glide Switch"
              dotClass="bg-savings-green"
              borderClass="border-savings-green"
              rows={rows}
              side="aim"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
