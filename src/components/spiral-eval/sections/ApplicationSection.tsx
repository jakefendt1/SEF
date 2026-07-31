import { useWatch } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import type { FormValues } from '../../../schema/formSchema'
import { SectionCard } from '../SectionCard'
import { TextField } from '../fields/TextField'
import { NumberField } from '../fields/NumberField'
import { NumberWithUnitField } from '../fields/NumberWithUnitField'
import { RadioGroupField } from '../fields/RadioGroupField'
import { CheckboxGroupField } from '../fields/CheckboxGroupField'
import { SelectField } from '../fields/SelectField'
import { TextareaField } from '../fields/TextareaField'
import { DimensionField } from '../fields/DimensionField'

interface Props {
  control: Control<FormValues>
  isQuickMode: boolean
}

const INSTALLATION_TYPES = ['New', 'Retrofit']
const APPLICATION_TYPES = ['Freezer', 'Ambient Cooler', 'Refrigerated Cooler', 'Proofer', 'Elevator/Lowerator', 'Other']
const HOW_CARRIED = ['Direct on Belt', 'Fully Packaged', 'Open Container']
const HEAT_SOURCES = ['Oven', 'Microwave/Convection', 'Broiler', 'Fryer', 'Open Flame', 'Other Heat Source', 'No Heat Source']
const PRODUCT_PROPERTIES = ['Glazing', 'Oils', 'Marinate', 'Abrasive Ingredients', 'None']
const BELT_CLEANING = ['Once a Day', 'Twice daily', 'Weekly', 'Twice weekly', 'Monthly', 'Yearly', 'Never']
const BELT_TYPES = ['Metal', 'Plastic']
const TECHNOLOGIES = ['Friction Drive', 'DirectDrive']
const BELT_SERIES = ['2200', '2400', '2600', '2700', '2800', '2850', '2900', '2950', '22150', 'Other']
const BELT_ACCESSORIES = ['Lane Dividers', 'Friction', 'Edge Guards', 'Other']
const LOADING_PATTERNS = ['Uniform Across Width', 'Center', 'Random']
const LEADING_DIMS = ['Short Side Leading', 'Long Side Leading']

export function ApplicationSection({ control, isQuickMode }: Props) {
  const [applicationType, heatSource, preferredBeltSeries, beltAccessories] = useWatch({
    control,
    name: ['applicationType', 'heatSource', 'preferredBeltSeries', 'beltAccessories'],
  })

  return (
    <SectionCard title="Application" isQuickMode={isQuickMode} hasFullFields>
      {(showFull) => (
        <>
          {/* Quick fields */}
          <RadioGroupField
            name="installationType"
            control={control}
            label="Installation Type"
            options={INSTALLATION_TYPES}
            required
          />
          <RadioGroupField
            name="applicationType"
            control={control}
            label="Application Type"
            options={APPLICATION_TYPES}
            required
          />
          {applicationType === 'Other' && (
            <TextField
              name="applicationTypeOther"
              control={control}
              label="Specify Application Type"
              required
            />
          )}
          <TextField
            name="productProcessed"
            control={control}
            label="Product Processed"
            placeholder="e.g. Chicken nuggets"
            required
          />
          <NumberField
            name="incomingProductTemp"
            control={control}
            label="Incoming Product Temperature"
            unit="°F"
            required
          />
          <NumberField
            name="beltSpeed"
            control={control}
            label="Belt Speed"
            unit="fpm"
            required
          />

          {/* Full-mode fields */}
          {showFull && (
            <>
              <RadioGroupField
                name="howProductCarried"
                control={control}
                label="How Is Product Carried"
                options={HOW_CARRIED}
              />
              <CheckboxGroupField
                name="heatSource"
                control={control}
                label="Heat Source"
                options={HEAT_SOURCES}
                exclusiveOptions={['No Heat Source']}
              />
              {Array.isArray(heatSource) && heatSource.includes('Other Heat Source') && (
                <TextField
                  name="heatSourceSpecify"
                  control={control}
                  label="Specify Heat Source"
                  required
                />
              )}
              <CheckboxGroupField
                name="productProperties"
                control={control}
                label="Product Properties"
                options={PRODUCT_PROPERTIES}
                exclusiveOptions={['None']}
              />
              <SelectField
                name="beltCleaning"
                control={control}
                label="Belt Cleaning Frequency"
                options={BELT_CLEANING}
              />
              <TextField
                name="chemicalsUsed"
                control={control}
                label="Chemicals Used"
                placeholder="e.g. SaniDate, NovaSan"
              />
              <NumberWithUnitField
                numberName="productLoad"
                unitName="productLoadUnit"
                control={control}
                label="Product Load"
                unitOptions={['lbs/linear ft', 'lbs/sq ft']}
              />
              <NumberWithUnitField
                numberName="weightPerPiece"
                unitName="weightPerPieceUnit"
                control={control}
                label="Weight Per Piece"
                unitOptions={['lbs', 'oz']}
              />
              <DimensionField
                dims={[
                  { name: 'productDimL', label: 'L' },
                  { name: 'productDimW', label: 'W' },
                  { name: 'productDimH', label: 'H' },
                ]}
                control={control}
                groupLabel="Product Dimensions"
                unit="in"
              />
              <NumberWithUnitField
                numberName="productionRate"
                unitName="productionRateUnit"
                control={control}
                label="Production Rate"
                unitOptions={['units/hr', 'units/min', 'lbs/hr']}
              />
              <NumberField
                name="productionHoursPerDay"
                control={control}
                label="Production Hours per Day"
                unit="hr/day"
              />
              <RadioGroupField
                name="loadingPattern"
                control={control}
                label="Loading Pattern"
                options={LOADING_PATTERNS}
              />
              <NumberField
                name="productsAcrossWidth"
                control={control}
                label="Number of Products Across Width"
              />
              <RadioGroupField
                name="leadingDimension"
                control={control}
                label="Leading Dimension"
                options={LEADING_DIMS}
              />
              <NumberField
                name="operatingEnvTemp"
                control={control}
                label="Operating Environment Temperature"
                unit="°F"
              />
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  name="minOperatingEnvTemp"
                  control={control}
                  label="Min Env Temp"
                  unit="°F"
                />
                <NumberField
                  name="maxOperatingEnvTemp"
                  control={control}
                  label="Max Env Temp"
                  unit="°F"
                />
              </div>
              <RadioGroupField
                name="beltType"
                control={control}
                label="Belt Type"
                options={BELT_TYPES}
              />
              <RadioGroupField
                name="technology"
                control={control}
                label="Technology"
                options={TECHNOLOGIES}
              />
              <SelectField
                name="preferredBeltSeries"
                control={control}
                label="Preferred Belt Series"
                options={BELT_SERIES}
              />
              {preferredBeltSeries === 'Other' && (
                <TextField
                  name="preferredBeltSeriesOther"
                  control={control}
                  label="Specify Belt Series"
                  required
                />
              )}
              <CheckboxGroupField
                name="beltAccessories"
                control={control}
                label="Belt Accessories"
                options={BELT_ACCESSORIES}
              />
              {Array.isArray(beltAccessories) && beltAccessories.includes('Other') && (
                <TextField
                  name="beltAccessoriesOther"
                  control={control}
                  label="Specify Belt Accessories"
                  required
                />
              )}
              <NumberField
                name="sprocketBoreSize"
                control={control}
                label="Sprocket Bore Size"
                unit="in"
              />
              <TextareaField
                name="additionalComments"
                control={control}
                label="Additional Comments"
                rows={4}
              />
            </>
          )}
        </>
      )}
    </SectionCard>
  )
}
