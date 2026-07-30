import type { Control } from 'react-hook-form'
import type { FormValues } from '../../schema/formSchema'
import { SectionCard } from '../SectionCard'
import { TextField } from '../fields/TextField'
import { SelectField } from '../fields/SelectField'
import { COUNTRY_OPTIONS } from '../../schema/countryOptions'

interface Props {
  control: Control<FormValues>
  isQuickMode: boolean
}

export function PersonalInfoSection({ control, isQuickMode }: Props) {
  const countryOptions = COUNTRY_OPTIONS

  return (
    <SectionCard title="Personal Info" isQuickMode={isQuickMode} hasFullFields>
      {(showFull) => (
        <>
          <TextField name="name" control={control} label="Name" required />
          <TextField name="companyName" control={control} label="Company Name" required />
          <TextField name="systemName" control={control} label="System Name" />
          <TextField name="email" control={control} label="Email" required type="email" />
          <TextField name="phone" control={control} label="Phone" type="tel" />

          {showFull && (
            <>
              <TextField name="title" control={control} label="Title" />
              <SelectField
                name="countryOrRegion"
                control={control}
                label="Country or Region"
                options={countryOptions}
              />
              <TextField name="address" control={control} label="Address" />
              <div className="grid grid-cols-2 gap-3">
                <TextField name="city" control={control} label="City" />
                <TextField name="stateProvince" control={control} label="State / Province" />
              </div>
              <TextField name="zipPostalCode" control={control} label="Zip / Postal Code" />
            </>
          )}
        </>
      )}
    </SectionCard>
  )
}
