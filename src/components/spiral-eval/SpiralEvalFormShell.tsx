import { useEffect, useRef, useCallback } from 'react'
import { useForm, useWatch, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation } from 'wouter'
import { toast } from 'sonner'
import { formSchema, type FormValues } from '../../schema/formSchema'
import { getSectionBySlug } from '../../schema/sectionMap'
import { useAssessmentsStore } from '../../store/assessmentsStore'
import { getCompleteness } from '../../lib/completeness'
import { shouldAutosave } from '../../lib/autosaveGuard'
import type { StoredAssessment } from '../../lib/db'
import { FormHub } from './FormHub'
import { SectionScreen } from './SectionScreen'
import { ReviewScreen } from './ReviewScreen'

interface Props {
  assessmentId: string
  existing?: StoredAssessment
  /** Section slug, "review", or undefined for the checklist hub. */
  section?: string
}

export interface FormScreenProps {
  control: Control<FormValues>
  assessmentId: string
}

export function SpiralEvalFormShell({ assessmentId, existing, section }: Props) {
  const { saveDraft, submitAssessment } = useAssessmentsStore()
  const [, navigate] = useLocation()
  const initialData = existing?.data

  // One form instance for the whole flow. A useForm per screen would lose
  // cross-section state and restart the autosave debounce on every
  // navigation -- the single most likely way to get this restructure wrong.
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { mode: 'quick', ...initialData },
    mode: 'onBlur',
  })
  const {
    control,
    handleSubmit,
    trigger,
    getFieldState,
    formState,
  } = form
  const { isSubmitting, isDirty } = formState

  const values = useWatch({ control }) as Partial<FormValues>
  const completeness = getCompleteness(values)

  // Autosave, debounced. See lib/autosaveGuard.ts for why this is guarded
  // rather than fired unconditionally.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const valuesRef = useRef(values)
  useEffect(() => {
    valuesRef.current = values
  }, [values])

  const doSave = useCallback(() => {
    if (!shouldAutosave({ hydrated: true, isDirty, incoming: valuesRef.current, existing })) return
    void saveDraft(assessmentId, valuesRef.current)
  }, [assessmentId, saveDraft, isDirty, existing])

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, 600)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)])

  // Flush any pending save when leaving the form entirely, so navigating away
  // inside the debounce window can't drop the last few keystrokes.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        doSave()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(data: FormValues) {
    const result = await submitAssessment(assessmentId, data)
    if (result.ok) {
      toast.success('Sent to the office.')
      navigate('/spiral-eval')
      return
    }
    if (result.reason === 'offline') {
      toast.info(result.message)
      navigate('/spiral-eval')
      return
    }
    // Real failure: stay put. Nothing is lost -- it's already saved -- but the
    // user needs to know it did not go through.
    toast.error(result.message)
  }

  const submit = handleSubmit(onSubmit)

  if (section === 'review') {
    return (
      <ReviewScreen
        assessmentId={assessmentId}
        control={control}
        completeness={completeness}
        isSubmitting={isSubmitting}
        onSubmit={submit}
      />
    )
  }

  const current = section ? getSectionBySlug(section) : undefined
  if (section && current) {
    return (
      <SectionScreen
        assessmentId={assessmentId}
        control={control}
        section={current}
        values={values}
        onLeave={() => {
          // Advisory validation, and only on fields the user actually
          // touched. Validating the whole section would paint a wall of red
          // on questions they merely scrolled past -- which reads as "you did
          // this wrong" to someone who has done nothing wrong yet.
          const touched = current.fields.filter((f) => getFieldState(f, formState).isTouched)
          if (touched.length > 0) void trigger(touched as never)
        }}
      />
    )
  }

  return (
    <FormHub
      assessmentId={assessmentId}
      control={control}
      values={values}
      completeness={completeness}
      existing={existing}
    />
  )
}
