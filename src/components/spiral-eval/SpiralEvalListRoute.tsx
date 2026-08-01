import { useLocation } from 'wouter'
import { AssessmentsList } from './AssessmentsList'
import { evaluationHref } from '../../lib/formLayout'

export function SpiralEvalListRoute() {
  const [, navigate] = useLocation()

  function startNewAssessment() {
    navigate(`/spiral-eval/${crypto.randomUUID()}`)
  }

  function openAssessment(id: string) {
    // Respect whichever layout this rep last chose.
    navigate(evaluationHref(id))
  }

  return <AssessmentsList onNew={startNewAssessment} onEdit={openAssessment} />
}
