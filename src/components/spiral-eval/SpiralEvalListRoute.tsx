import { useLocation } from 'wouter'
import { AssessmentsList } from './AssessmentsList'

export function SpiralEvalListRoute() {
  const [, navigate] = useLocation()

  function startNewAssessment() {
    navigate(`/spiral-eval/${crypto.randomUUID()}`)
  }

  function openAssessment(id: string) {
    navigate(`/spiral-eval/${id}`)
  }

  return <AssessmentsList onNew={startNewAssessment} onEdit={openAssessment} />
}
