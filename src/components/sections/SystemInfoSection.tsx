import { useWatch } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import type { FormValues } from '../../schema/formSchema'
import { isSpiral2Applicable } from '../../schema/conditionals'
import { SectionCard } from '../SectionCard'
import { TextField } from '../fields/TextField'
import { NumberField } from '../fields/NumberField'
import { RadioGroupField } from '../fields/RadioGroupField'
import { SelectField } from '../fields/SelectField'
import { DrumDiagram } from '../diagrams/DrumDiagram'
import { ConfigDiagram } from '../diagrams/ConfigDiagram'

interface Props {
  control: Control<FormValues>
  isQuickMode: boolean
}

const TRAVEL_DIRECTIONS = ['Upgo', 'Downgo', 'Two Drum, One Belt', 'Two Drum, Two Belt']
const ROTATION_DIRECTIONS = ['Clockwise', 'Counter Clockwise']
const TAKE_UP_LOOPS = ['Single', 'Double']
const DRUM_BASES = ['Diameter', 'Radius', 'Overall System Diameter (including belt)']
const CONFIGURATIONS = ['90°', '180°', '270°', '360°']
const RETURN_TYPES = ['Straight Through', 'Drum', 'Freewheel', 'Slide Rail']

export function SystemInfoSection({ control, isQuickMode }: Props) {
  const [travelDirection, drumBasis, configSpiral1, configSpiral2] = useWatch({
    control,
    name: ['travelDirection', 'drumBasis', 'configurationSpiral1', 'configurationSpiral2'],
  })
  const isSpiral2 = isSpiral2Applicable(travelDirection as string | undefined)

  return (
    <SectionCard title="System Information" isQuickMode={isQuickMode}>
      {() => (
        <>
          <TextField
            name="spiralManufacturer"
            control={control}
            label="Manufacturer of Spiral"
            placeholder="e.g. Ashworth, Frigoscandia"
            required
          />
          <RadioGroupField
            name="travelDirection"
            control={control}
            label="Travel Direction"
            options={TRAVEL_DIRECTIONS}
            required
          />
          <RadioGroupField
            name="rotationDirection"
            control={control}
            label="Rotation Direction"
            options={ROTATION_DIRECTIONS}
            required
          />

          {/* Tier counts */}
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              name="numTiersSpiral1"
              control={control}
              label={isSpiral2 ? 'Tiers — Spiral 1' : 'Number of Tiers'}
              required
            />
            {isSpiral2 && (
              <NumberField
                name="numTiersSpiral2"
                control={control}
                label="Tiers — Spiral 2"
                required
              />
            )}
          </div>

          <NumberField
            name="tierPitch"
            control={control}
            label="Tier Pitch"
            unit="in"
            required
          />
          <NumberField
            name="takeUpTravelLength"
            control={control}
            label="Take Up Travel Length"
            unit="in"
            required
          />
          <RadioGroupField
            name="takeUpLoop"
            control={control}
            label="Take Up Loop"
            options={TAKE_UP_LOOPS}
          />
          <NumberField
            name="beltLength"
            control={control}
            label="Belt Length (if known)"
            unit="ft"
          />
          <NumberField
            name="minRollerDiameter"
            control={control}
            label="Minimum Roller Diameter"
            unit="in"
          />

          {/* Drum basis with diagram */}
          <div>
            <RadioGroupField
              name="drumBasis"
              control={control}
              label="Drum (Measurement Basis)"
              options={DRUM_BASES}
              required
            />
            {drumBasis && (
              <div className="mt-3 flex justify-center">
                <DrumDiagram basis={drumBasis as 'Diameter' | 'Radius'} />
              </div>
            )}
          </div>

          <NumberField
            name="drumValue"
            control={control}
            label={drumBasis === 'Radius' ? 'Drum Radius' : 'Drum Diameter'}
            unit="in"
            required
          />
          <NumberField
            name="beltWidth"
            control={control}
            label="Belt Width"
            unit="in"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField name="infeedLength" control={control} label="Infeed Length (A)" unit="ft" required />
            <NumberField name="dischargeLength" control={control} label="Discharge Length (B)" unit="ft" required />
          </div>

          {isSpiral2 && (
            <NumberField
              name="distanceBetweenDrums"
              control={control}
              label="Distance Between Drums"
              unit="ft"
              required
            />
          )}

          {/* Spiral 1 configuration with diagram */}
          <div>
            <RadioGroupField
              name="configurationSpiral1"
              control={control}
              label={isSpiral2 ? 'Configuration — Spiral 1' : 'Configuration'}
              options={CONFIGURATIONS}
              required
            />
            {configSpiral1 && (
              <div className="mt-3 flex justify-center">
                <ConfigDiagram value={configSpiral1 as string} />
              </div>
            )}
          </div>

          <SelectField
            name="returnTypeSpiral1"
            control={control}
            label={isSpiral2 ? 'Type of Return — Spiral 1' : 'Type of Return'}
            options={RETURN_TYPES}
            required
          />

          {/* Spiral 2 fields */}
          {isSpiral2 && (
            <>
              <div>
                <RadioGroupField
                  name="configurationSpiral2"
                  control={control}
                  label="Configuration — Spiral 2"
                  options={CONFIGURATIONS}
                  required
                />
                {configSpiral2 && (
                  <div className="mt-3 flex justify-center">
                    <ConfigDiagram value={configSpiral2 as string} />
                  </div>
                )}
              </div>
              <SelectField
                name="returnTypeSpiral2"
                control={control}
                label="Type of Return — Spiral 2"
                options={RETURN_TYPES}
                required
              />
            </>
          )}
        </>
      )}
    </SectionCard>
  )
}
