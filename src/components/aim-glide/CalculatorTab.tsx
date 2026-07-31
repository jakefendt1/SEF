// Calculator Tab — Input Form
// Design: Executive Dashboard — structured card layout with accessible form fields

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  NumberField,
  NumberWithSelect,
  TextField,
  NumberWithSelectAndText,
  OutputField,
} from './FormField';
import {
  TIME_UNITS,
  TIME_UNITS_NO_HOUR,
  PRODUCT_UNITS,
  type CalculatorInputs,
} from '@/lib/calculator';
import {
  FileText,
  Calculator,
  TrendingUp,
  DollarSign,
  Pencil,
  Plus,
  X,
} from 'lucide-react';

interface CalculatorTabProps {
  inputs: CalculatorInputs;
  onChange: (field: keyof CalculatorInputs, value: any) => void;
  addNote: () => void;
  updateNote: (index: number, value: string) => void;
  removeNote: (index: number) => void;
}

export function CalculatorTab({ inputs, onChange, addNote, updateNote, removeNote }: CalculatorTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" role="region" aria-label="Calculator input form">
      {/* Project Information */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <FileText className="size-5 text-primary" aria-hidden="true" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <TextField
              label="Customer Name"
              value={inputs.customerName}
              onChange={(v) => onChange('customerName', v)}
              placeholder="e.g., Pan-O-Gold"
            />
            <TextField
              label="Project Name"
              value={inputs.projectName}
              onChange={(v) => onChange('projectName', v)}
              placeholder="e.g., Line 4 Switch Replacement"
            />
            <TextField
              label="Plant Location"
              value={inputs.plantLocation}
              onChange={(v) => onChange('plantLocation', v)}
              placeholder="e.g., St. Cloud, MN"
            />
            <TextField
              label="Prepared By"
              value={inputs.preparedBy}
              onChange={(v) => onChange('preparedBy', v)}
              placeholder="e.g., Jake Fendt"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plant Operating Data */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <Calculator className="size-5 text-primary" aria-hidden="true" />
            Plant Operating Data
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md bg-primary/[0.03] border-l-[3px] border-primary p-4 mb-6" role="note">
            <p className="text-sm text-muted-foreground">
              Enter your plant's operating data below. All calculations normalize to yearly values.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <OutputField
              label="Plant Output"
              hint="Line capacity"
              value={inputs.outputValue}
              onChange={(v) => onChange('outputValue', v)}
              productValue={inputs.outputProduct}
              onProductChange={(v) => onChange('outputProduct', v)}
              productOptions={PRODUCT_UNITS}
              unitValue={inputs.outputUnit}
              onUnitChange={(v) => onChange('outputUnit', v)}
              unitOptions={TIME_UNITS}
            />
            <NumberField
              label="Product Value"
              hint="$ per unit"
              value={inputs.productValue}
              onChange={(v) => onChange('productValue', v)}
              suffix="$ per unit"
              step="0.01"
            />
            <NumberWithSelect
              label="Regular Maintenance Time"
              value={inputs.maintenanceHours}
              onChange={(v) => onChange('maintenanceHours', v)}
              selectValue={inputs.maintenanceTimeUnit}
              onSelectChange={(v) => onChange('maintenanceTimeUnit', v)}
              options={TIME_UNITS}
              suffix="hours"
              step="0.5"
            />
            <NumberWithSelect
              label="Sanitation Time"
              value={inputs.sanitationTime}
              onChange={(v) => onChange('sanitationTime', v)}
              selectValue={inputs.sanitationTimeUnit}
              onSelectChange={(v) => onChange('sanitationTimeUnit', v)}
              options={TIME_UNITS_NO_HOUR}
              suffix="hours"
            />
            <NumberField
              label="Labor Rate"
              hint="Fully burdened"
              value={inputs.laborRate}
              onChange={(v) => onChange('laborRate', v)}
              suffix="$ / hour"
            />

            {/* Labor Reallocation Checkbox */}
            <div className="sm:col-span-2">
              <div
                className="flex items-start gap-3 p-4 rounded-md bg-primary/[0.03] border border-border cursor-pointer hover:bg-primary/[0.06] transition-colors"
                onClick={() => onChange('laborReallocated', !inputs.laborReallocated)}
                role="presentation"
              >
                <Checkbox
                  id="labor-reallocated"
                  checked={inputs.laborReallocated}
                  onCheckedChange={(checked) => onChange('laborReallocated', checked)}
                  className="mt-0.5 size-5"
                  aria-describedby="labor-reallocated-desc"
                />
                <div className="flex flex-col gap-1">
                  <Label htmlFor="labor-reallocated" className="text-sm font-semibold cursor-pointer">
                    Labor will be reallocated (not eliminated)
                  </Label>
                  <p id="labor-reallocated-desc" className="text-xs text-muted-foreground">
                    Check this if maintenance staff will be reassigned to other work. Labor hours will show as "capacity gained" instead of dollar savings.
                  </p>
                </div>
              </div>
            </div>

            <NumberWithSelect
              label="Maintenance Parts Cost"
              value={inputs.maintenanceCost}
              onChange={(v) => onChange('maintenanceCost', v)}
              selectValue={inputs.maintenanceCostUnit}
              onSelectChange={(v) => onChange('maintenanceCostUnit', v)}
              options={TIME_UNITS_NO_HOUR}
              suffix="$"
            />
            <NumberWithSelect
              label="Unscheduled Downtime"
              value={inputs.unscheduledDowntime}
              onChange={(v) => onChange('unscheduledDowntime', v)}
              selectValue={inputs.downtimeUnit}
              onSelectChange={(v) => onChange('downtimeUnit', v)}
              options={TIME_UNITS_NO_HOUR}
              suffix="hours"
              step="0.5"
            />
            <NumberWithSelect
              label="Product Waste"
              value={inputs.productWaste}
              onChange={(v) => onChange('productWaste', v)}
              selectValue={inputs.wasteUnit}
              onSelectChange={(v) => onChange('wasteUnit', v)}
              options={TIME_UNITS_NO_HOUR}
              suffix={inputs.outputProduct}
            />
            <NumberField
              label="Rebuild Cost"
              hint="Annualized"
              value={inputs.rebuildCost}
              onChange={(v) => onChange('rebuildCost', v)}
              suffix="$ / year"
            />
            <NumberWithSelectAndText
              label="Other Costs (Traditional Slat Switch)"
              value={inputs.metalOtherCost}
              onChange={(v) => onChange('metalOtherCost', v)}
              selectValue={inputs.metalOtherCostUnit}
              onSelectChange={(v) => onChange('metalOtherCostUnit', v)}
              options={TIME_UNITS_NO_HOUR}
              textValue={inputs.metalOtherCostDesc}
              onTextChange={(v) => onChange('metalOtherCostDesc', v)}
              textPlaceholder="Description (e.g., Belt replacement)"
              className="sm:col-span-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* AIM Glide Operating Costs */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <TrendingUp className="size-5 text-primary" aria-hidden="true" />
            AIM Glide Operating Costs
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <NumberField
              label="Maintenance Labor (Annual)"
              value={inputs.aimMaintenanceHours}
              onChange={(v) => onChange('aimMaintenanceHours', v)}
              suffix="hours / year"
            />
            <NumberField
              label="Spare Parts (Annual)"
              value={inputs.aimSparePartsCost}
              onChange={(v) => onChange('aimSparePartsCost', v)}
              suffix="$ / year"
            />
            <NumberField
              label="Rebuild Cost (Annual)"
              value={inputs.aimRebuildCost}
              onChange={(v) => onChange('aimRebuildCost', v)}
              suffix="$ / year"
            />
            <NumberField
              label="Sanitation Time (Annual)"
              value={inputs.aimSanitationHours}
              onChange={(v) => onChange('aimSanitationHours', v)}
              suffix="hours / year"
            />
            <NumberWithSelectAndText
              label="Other Costs (AIM Glide)"
              value={inputs.aimOtherCost}
              onChange={(v) => onChange('aimOtherCost', v)}
              selectValue={inputs.aimOtherCostUnit}
              onSelectChange={(v) => onChange('aimOtherCostUnit', v)}
              options={TIME_UNITS_NO_HOUR}
              textValue={inputs.aimOtherCostDesc}
              onTextChange={(v) => onChange('aimOtherCostDesc', v)}
              textPlaceholder="Description"
              className="sm:col-span-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Investment */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <DollarSign className="size-5 text-primary" aria-hidden="true" />
            Investment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <NumberField
            label="AIM Glide One-Time Investment"
            value={inputs.aimGlideInvestment}
            onChange={(v) => onChange('aimGlideInvestment', v)}
            suffix="$"
          />
        </CardContent>
      </Card>

      {/* Notes & Assumptions */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <Pencil className="size-5 text-primary" aria-hidden="true" />
            Notes & Assumptions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md bg-primary/[0.03] border-l-[3px] border-primary p-4 mb-5" role="note">
            <p className="text-sm text-muted-foreground">
              Add notes or assumptions for the PDF report.
            </p>
          </div>
          <div className="space-y-3 mb-4" role="list" aria-label="Notes list">
            {inputs.notes.map((note, i) => (
              <div key={i} className="flex items-center gap-2" role="listitem">
                <Input
                  type="text"
                  value={note}
                  onChange={(e) => updateNote(i, e.target.value)}
                  placeholder={`Note ${i + 1}`}
                  className="h-11 min-h-[44px] text-base flex-1"
                  aria-label={`Note ${i + 1}`}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeNote(i)}
                  aria-label={`Remove note ${i + 1}`}
                  className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addNote} className="h-10 min-h-[44px]">
            <Plus className="size-4" />
            Add Note
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
