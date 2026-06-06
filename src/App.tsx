import { useEffect, useState } from 'react'
import intraloxLogo from './assets/intralox-logo.svg'
import { FormView } from './components/FormView'
import { AssessmentsList } from './components/AssessmentsList'
import { InstallPrompt } from './components/InstallPrompt'
import { useAssessmentsStore } from './store/assessmentsStore'
import { dbGet } from './lib/db'
import type { FormValues } from './schema/formSchema'

type View =
  | { type: 'list' }
  | { type: 'form'; id: string; initialData?: Partial<FormValues> }

export default function App() {
  const [view, setView] = useState<View>({ type: 'list' })
  const { load, flushQueue } = useAssessmentsStore()

  // Load assessments from IDB on mount
  useEffect(() => {
    load()
  }, [load])

  // Flush queued submissions when we come back online
  useEffect(() => {
    function handleOnline() {
      flushQueue()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [flushQueue])

  async function startNewAssessment() {
    const id = crypto.randomUUID()
    setView({ type: 'form', id })
  }

  async function openAssessment(id: string) {
    const stored = await dbGet(id)
    setView({ type: 'form', id, initialData: stored?.data })
  }

  const title = view.type === 'form' ? 'Assessment' : 'Assessments'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-4 py-3 flex items-center gap-4 sticky top-0 z-20">
        <img src={intraloxLogo} alt="Intralox" className="h-10 w-auto" />
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">Spiral Eval</h1>
          <p className="text-blue-200 text-xs mt-0.5">{title}</p>
        </div>
      </header>

      <InstallPrompt />

      <main className="bg-gray-50">
        {view.type === 'list' ? (
          <AssessmentsList
            onNew={startNewAssessment}
            onEdit={openAssessment}
          />
        ) : (
          <FormView
            assessmentId={view.id}
            initialData={view.initialData}
            onDone={() => {
              load()
              setView({ type: 'list' })
            }}
          />
        )}
      </main>
    </div>
  )
}
