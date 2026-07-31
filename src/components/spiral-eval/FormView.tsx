import { useEffect, useRef, useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema, type FormValues } from '../../schema/formSchema'
import { useAssessmentsStore } from '../../store/assessmentsStore'
import { getCompleteness } from '../../lib/completeness'
import { PersonalInfoSection } from './sections/PersonalInfoSection'
import { ApplicationSection } from './sections/ApplicationSection'
import { SystemInfoSection } from './sections/SystemInfoSection'
import { SystemDetailsSection } from './sections/SystemDetailsSection'
import { ProjectInfoSection } from './sections/ProjectInfoSection'
import { cn } from '../../lib/utils'

interface Props {
  assessmentId: string
  initialData?: Partial<FormValues>
  onDone: () => void
}

export function FormView({ assessmentId, initialData, onDone }: Props) {
  const { saveDraft, submitAssessment } = useAssessmentsStore()

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { mode: 'quick', ...initialData },
    mode: 'onBlur',
  })

  const mode = useWatch({ control, name: 'mode' })
  const isQuickMode = mode !== 'full'

  // Completeness indicator
  const allValues = useWatch({ control }) as Partial<FormValues>
  const { filled, total, pct } = getCompleteness(allValues, mode ?? 'quick')

  // Autosave — debounced 600 ms
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const valuesRef = useRef(allValues)
  valuesRef.current = allValues

  const doSave = useCallback(() => {
    saveDraft(assessmentId, valuesRef.current)
  }, [assessmentId, saveDraft])

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, 600)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(allValues)])

  async function onSubmit(data: FormValues) {
    await submitAssessment(assessmentId, data)
    alert('Assessment saved.')
    onDone()
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Sticky top bar: back + Quick/Full toggle + completeness */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-blue-900 font-medium hover:underline min-h-[40px] px-1"
          >
            ← Assessments
          </button>
          {/* Quick / Full toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm font-medium">
            <button
              type="button"
              onClick={() => setValue('mode', 'quick')}
              className={cn(
                'px-4 py-2 min-h-[40px] transition-colors',
                isQuickMode ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              Quick
            </button>
            <button
              type="button"
              onClick={() => setValue('mode', 'full')}
              className={cn(
                'px-4 py-2 min-h-[40px] border-l border-gray-300 transition-colors',
                !isQuickMode ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              Full
            </button>
          </div>
        </div>
        {/* Completeness bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Required fields</span>
            <span className="font-medium">{filled}/{total}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                pct === 100 ? 'bg-green-500' : pct > 60 ? 'bg-blue-500' : 'bg-amber-400',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-28">
        <PersonalInfoSection control={control} isQuickMode={isQuickMode} />
        <ApplicationSection control={control} isQuickMode={isQuickMode} />
        <SystemInfoSection control={control} isQuickMode={isQuickMode} />
        <SystemDetailsSection control={control} isQuickMode={isQuickMode} />
        <ProjectInfoSection control={control} isQuickMode={isQuickMode} />
      </div>

      {/* Fixed submit bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto space-y-2">
          {hasErrors && (
            <p className="text-sm text-red-600 text-center">
              Please fix the highlighted fields before submitting.
            </p>
          )}
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
      </div>
    </form>
  )
}
