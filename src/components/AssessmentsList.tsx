import { useState } from 'react'
import { cn } from '../lib/utils'
import { useAssessmentsStore } from '../store/assessmentsStore'
// Lazy-load the PDF renderer so it doesn't inflate the initial bundle
async function downloadPDF(a: import('../lib/db').StoredAssessment) {
  const { downloadAssessmentPDF } = await import('../pdf/generatePDF')
  return downloadAssessmentPDF(a)
}
import type { StoredAssessment } from '../lib/db'

interface Props {
  onNew: () => void
  onResume: (id: string) => void
}

const STATUS_LABELS: Record<StoredAssessment['status'], string> = {
  draft: 'Draft',
  queued: 'Queued',
  synced: 'Synced',
  failed: 'Failed',
}
const STATUS_COLORS: Record<StoredAssessment['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  queued: 'bg-amber-100 text-amber-700',
  synced: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

function AssessmentRow({ a, onResume }: { a: StoredAssessment; onResume: (id: string) => void }) {
  const { retryFailed, deleteAssessment } = useAssessmentsStore()
  const [pdfLoading, setPdfLoading] = useState(false)

  const company = (a.data?.companyName as string | undefined) || 'Unnamed'
  const name = (a.data?.name as string | undefined) || ''
  const date = new Date(a.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  async function handlePDF() {
    setPdfLoading(true)
    try {
      await downloadPDF(a)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-800 truncate">{company}</span>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[a.status])}>
            {STATUS_LABELS[a.status]}
          </span>
        </div>
        {name && <p className="text-sm text-gray-500 mt-0.5">{name}</p>}
        <p className="text-xs text-gray-400 mt-1">{date}</p>
      </div>
      <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
        {a.status === 'draft' && (
          <button
            onClick={() => onResume(a.id)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 min-h-[32px]"
          >
            Resume
          </button>
        )}
        {a.status === 'failed' && (
          <button
            onClick={() => retryFailed(a.id)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 min-h-[32px]"
          >
            Retry
          </button>
        )}
        <button
          onClick={handlePDF}
          disabled={pdfLoading}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 min-h-[32px] disabled:opacity-50"
        >
          {pdfLoading ? 'Generating…' : 'PDF'}
        </button>
        <button
          onClick={() => {
            if (confirm('Delete this assessment?')) deleteAssessment(a.id)
          }}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white text-gray-400 hover:text-red-500 min-h-[32px]"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export function AssessmentsList({ onNew, onResume }: Props) {
  const { assessments } = useAssessmentsStore()

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto space-y-3 pb-8">
      <button
        onClick={onNew}
        className="w-full h-14 rounded-xl bg-blue-900 text-white font-semibold text-base hover:bg-blue-800 active:bg-blue-950 transition-colors"
      >
        + New Assessment
      </button>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-gray-400 text-sm">No assessments yet.</p>
          <p className="text-gray-400 text-xs mt-1">Tap New Assessment to begin.</p>
        </div>
      ) : (
        assessments.map((a) => (
          <AssessmentRow key={a.id} a={a} onResume={onResume} />
        ))
      )}
    </div>
  )
}
