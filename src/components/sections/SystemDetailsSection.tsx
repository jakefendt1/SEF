import { useWatch } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import type { FormValues } from '../../schema/formSchema'
import { SectionCard } from '../SectionCard'
import { NumberField } from '../fields/NumberField'
import { RadioGroupField } from '../fields/RadioGroupField'
import { CheckboxGroupField } from '../fields/CheckboxGroupField'
import { SelectField } from '../fields/SelectField'
import { TextField } from '../fields/TextField'
import { DimensionField } from '../fields/DimensionField'
import { CageBarDiagram } from '../diagrams/CageBarDiagram'

interface Props {
  control: Control<FormValues>
  isQuickMode: boolean
}

const BELT_SUPPORT_MATERIALS = ['Stainless Steel', 'Aluminum', 'Galvanized', 'Painted Steel']
const CARRYWAY_MATERIALS = ['UHMW', 'Other']
const DRUM_TYPES = ['Cage', 'Solid']
const CAGE_CAP_MATERIALS = ['UHMW', 'Nylon', 'Stainless Steel Cage', 'Other']
const CAP_PROFILES = ['Trapezoidal', 'Flat', 'Ribbed', 'Winged', 'Other']
const YES_NO = ['Yes', 'No']
const YES_NO_NA = ['Yes', 'No', 'Does Not Apply']
const TAKE_UP_SENSORS = ['Upper', 'Lower']
const NUM_VFDS = ['0', '1', '2', '3']

export function SystemDetailsSection({ control, isQuickMode }: Props) {
  const [drumType, carrywayMaterial, cageCapMaterial, capProfile] = useWatch({
    control,
    name: ['drumType', 'carrywayWearstripMaterial', 'cageBarCapMaterial', 'capProfile'],
  })

  return (
    <SectionCard title="System Details" isQuickMode={isQuickMode}>
      {() => (
        <>
          {/* Rails and overhang reference diagram */}
          <div className="mt-1 mb-1">
            <img
              src="/diagrams/rails-and-structure.png"
              alt="Diagram showing column, drum, rails, overhang, and rail spacing"
              className="w-full max-w-sm mx-auto rounded border border-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              name="numRails"
              control={control}
              label="Number of Rails"
              required
            />
            <NumberField
              name="railSpacing"
              control={control}
              label="Rail Spacing"
              unit="in"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              name="insideOverhang"
              control={control}
              label="Inside Overhang"
              unit="in"
              required
            />
            <NumberField
              name="outsideOverhang"
              control={control}
              label="Outside Overhang"
              unit="in"
              required
            />
          </div>
          <SelectField
            name="beltSupportMaterial"
            control={control}
            label="Belt Support Material"
            options={BELT_SUPPORT_MATERIALS}
          />
          <div>
            <RadioGroupField
              name="carrywayWearstripMaterial"
              control={control}
              label="Carryway Wearstrip Material"
              options={CARRYWAY_MATERIALS}
              required
            />
            {carrywayMaterial === 'Other' && (
              <div className="mt-3">
                <TextField
                  name="carrywayWearstripMaterialOther"
                  control={control}
                  label="Specify Carryway Wearstrip Material"
                  required
                />
              </div>
            )}
          </div>

          {/* Drum type + cage bar details */}
          <RadioGroupField
            name="drumType"
            control={control}
            label="Type of Drum"
            options={DRUM_TYPES}
            required
          />
          {drumType === 'Cage' && (
            <>
              <div className="flex justify-center py-2">
                <CageBarDiagram />
              </div>
              <DimensionField
                dims={[
                  { name: 'cageBarDimA', label: 'A' },
                  { name: 'cageBarDimB', label: 'B' },
                  { name: 'cageBarDimC', label: 'C' },
                ]}
                control={control}
                groupLabel="Cage Bar Dimensions"
                unit="in"
                required
              />
            </>
          )}

          <div>
            <SelectField
              name="cageBarCapMaterial"
              control={control}
              label="Cage Bar Cap Material"
              options={CAGE_CAP_MATERIALS}
              required
            />
            {cageCapMaterial === 'Other' && (
              <div className="mt-3">
                <TextField
                  name="cageBarCapMaterialOther"
                  control={control}
                  label="Specify Cap Material"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <SelectField
              name="capProfile"
              control={control}
              label="Cap Profile"
              options={CAP_PROFILES}
            />
            {capProfile === 'Other' && (
              <div className="mt-3">
                <TextField
                  name="capProfileOther"
                  control={control}
                  label="Specify Cap Profile"
                  required
                />
              </div>
            )}
          </div>

          <RadioGroupField
            name="tierSensorsEveryTier"
            control={control}
            label="Tier Sensors Every Tier"
            options={YES_NO}
          />
          <CheckboxGroupField
            name="takeUpSensors"
            control={control}
            label="Take Up Sensors"
            options={TAKE_UP_SENSORS}
          />
          <RadioGroupField
            name="beltWasher"
            control={control}
            label="Belt Washer"
            options={YES_NO}
          />
          <RadioGroupField
            name="topTierHoldDown"
            control={control}
            label="Top Tier Hold Down"
            options={YES_NO}
          />
          <RadioGroupField
            name="returnPathHoldDown"
            control={control}
            label="Return Path Hold Down"
            options={YES_NO_NA}
          />
          <RadioGroupField
            name="productContainmentRail"
            control={control}
            label="Product Containment Rail"
            options={YES_NO}
          />
          <RadioGroupField
            name="numVFDs"
            control={control}
            label="Number of VFDs"
            options={NUM_VFDS}
          />
        </>
      )}
    </SectionCard>
  )
}
