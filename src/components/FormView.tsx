import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema, type FormValues } from '../schema/formSchema'
import { PersonalInfoSection } from './sections/PersonalInfoSection'
import { ApplicationSection } from './sections/ApplicationSection'
import { SystemInfoSection } from './sections/SystemInfoSection'
import { SystemDetailsSection } from './sections/SystemDetailsSection'
import { ProjectInfoSection } from './sections/ProjectInfoSection'
import { cn } from '../lib/utils'

export function FormView() {
  const { control, handleSubmit, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { mode: 'quick' },
    mode: 'onBlur',
  })

  const mode = useWatch({ control, name: 'mode' })
  const isQuickMode = mode !== 'full'

  function onSubmit(data: FormValues) {
    // Submission wired in Step 5
    console.log('submit', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Quick / Full toggle */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Mode</span>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm font-medium">
          <button
            type="button"
            onClick={() => setValue('mode', 'quick')}
            className={cn(
              'px-4 py-2 min-h-[40px] transition-colors',
              isQuickMode
                ? 'bg-blue-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            Quick
          </button>
          <button
            type="button"
            onClick={() => setValue('mode', 'full')}
            className={cn(
              'px-4 py-2 min-h-[40px] border-l border-gray-300 transition-colors',
              !isQuickMode
                ? 'bg-blue-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            Full
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-24">
        <PersonalInfoSection control={control} isQuickMode={isQuickMode} />
        <ApplicationSection control={control} isQuickMode={isQuickMode} />
        <SystemInfoSection control={control} isQuickMode={isQuickMode} />
        <SystemDetailsSection control={control} isQuickMode={isQuickMode} />
        <ProjectInfoSection control={control} isQuickMode={isQuickMode} />
      </div>

      {/* Fixed submit bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 max-w-2xl mx-auto">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full h-12 rounded-xl font-semibold text-base transition-colors',
            isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-900 text-white hover:bg-blue-800 active:bg-blue-950',
          )}
        >
          {isSubmitting ? 'Submitting…' : 'Submit Assessment'}
        </button>
      </div>
    </form>
  )
}
