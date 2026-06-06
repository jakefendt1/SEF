import type { Control } from 'react-hook-form'
import type { FormValues } from '../../schema/formSchema'
import { SectionCard } from '../SectionCard'
import { TextField } from '../fields/TextField'

interface Props {
  control: Control<FormValues>
  isQuickMode: boolean
}

export function ProjectInfoSection({ control, isQuickMode }: Props) {
  return (
    <SectionCard title="Project Information" isQuickMode={isQuickMode} hasFullFields>
      {(showFull) => (
        <>
          {showFull ? (
            <>
              <TextField name="projectNumber" control={control} label="Project Number" />
              <TextField name="endUserName" control={control} label="End User Name" />
              <div className="grid grid-cols-2 gap-3">
                <TextField name="endUserCity" control={control} label="End User City" />
                <TextField name="endUserState" control={control} label="End User State" />
              </div>
              <TextField name="lineId" control={control} label="Line ID" />
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">Project details available in Full mode</p>
          )}
        </>
      )}
    </SectionCard>
  )
}
