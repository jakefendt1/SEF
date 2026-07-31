import { useParams } from 'wouter'
import { SpiralEvalFormShell } from './SpiralEvalFormShell'
import { useAssessmentsStore } from '../../store/assessmentsStore'

export function SpiralEvalFormRoute() {
  const { id, section } = useParams<{ id: string; section?: string }>()
  const { assessments, loaded } = useAssessmentsStore()

  if (!id) return null

  // Don't render the form until we know for certain whether this id has
  // existing data. Rendering earlier risks mounting a blank form that then
  // autosaves over a completed record before the real data arrives.
  if (!loaded) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-gray-600 text-base">Loading…</p>
      </div>
    )
  }

  const stored = assessments.find((a) => a.id === id)

  // `key` on the id only: switching records must remount the form, but moving
  // between sections of the same record must not -- that would throw away
  // every unsaved keystroke on navigation.
  return (
    <SpiralEvalFormShell key={id} assessmentId={id} existing={stored} section={section} />
  )
}
