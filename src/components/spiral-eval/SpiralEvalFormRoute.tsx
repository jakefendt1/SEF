import { useParams, useLocation } from 'wouter'
import { FormView } from './FormView'
import { useAssessmentsStore } from '../../store/assessmentsStore'

export function SpiralEvalFormRoute() {
  const { id } = useParams<{ id: string }>()
  const [, navigate] = useLocation()
  const { assessments } = useAssessmentsStore()

  if (!id) return null

  const stored = assessments.find((a) => a.id === id)

  return (
    <FormView
      assessmentId={id}
      initialData={stored?.data}
      onDone={() => navigate('/spiral-eval')}
    />
  )
}
