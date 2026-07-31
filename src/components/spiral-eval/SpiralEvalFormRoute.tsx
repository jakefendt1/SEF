import { useParams, useLocation } from 'wouter'
import { FormView } from './FormView'
import { useAssessmentsStore } from '../../store/assessmentsStore'

export function SpiralEvalFormRoute() {
  const { id } = useParams<{ id: string }>()
  const [, navigate] = useLocation()
  const { assessments, loaded } = useAssessmentsStore()

  if (!id) return null

  // Don't render the form until we know for certain whether this id has
  // existing data. Rendering earlier risks mounting a blank form that then
  // autosaves over a completed record before the real data arrives.
  if (!loaded) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    )
  }

  const stored = assessments.find((a) => a.id === id)

  return (
    <FormView
      key={id}
      assessmentId={id}
      existing={stored}
      onDone={() => navigate('/spiral-eval')}
    />
  )
}
