import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { MoreVertical, Search, ChevronRight, Plus } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAssessmentsStore } from '../../store/assessmentsStore'
import { downloadSingleCSV, downloadAllCSV } from '../../lib/csvExport'
import { assessmentTitle, assessmentSubtitle, assessmentSearchText } from '../../lib/assessmentTitle'
import { STATUS_PRESENTATION, isEditedSinceSent } from '../../lib/statusLabels'
import type { StoredAssessment } from '../../lib/db'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

async function downloadPDF(a: StoredAssessment) {
  const { downloadAssessmentPDF } = await import('../../pdf/generatePDF')
  return downloadAssessmentPDF(a)
}

interface Props {
  onNew: () => void
  onEdit: (id: string) => void
}

function AssessmentRow({ a, onEdit }: { a: StoredAssessment; onEdit: (id: string) => void }) {
  const { retryFailed, deleteAssessment, renameAssessment, duplicateAssessment } =
    useAssessmentsStore()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const title = assessmentTitle(a)
  const subtitle = assessmentSubtitle(a)
  const status = STATUS_PRESENTATION[a.status]
  const editedSinceSent = isEditedSinceSent(a)
  const date = new Date(a.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  async function handlePDF() {
    setPdfLoading(true)
    try {
      await downloadPDF(a)
    } finally {
      setPdfLoading(false)
    }
  }

  function openRename() {
    setRenameValue(a.title ?? title)
    setRenameOpen(true)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* The whole card is the primary target -- previously the only way in
          was a 32px button competing with four others of the same size. */}
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => onEdit(a.id)}
          className="flex-1 min-w-0 text-left p-4 hover:bg-gray-50 active:bg-gray-100"
        >
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold text-gray-900 truncate">{title}</span>
            <span
              className={cn('text-sm font-medium px-2 py-0.5 rounded-full', status.className)}
            >
              {status.label}
            </span>
            {editedSinceSent && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-blue-50 text-brand">
                Changed since sending
              </span>
            )}
          </span>
          {subtitle && <span className="block text-base text-gray-600 mt-0.5">{subtitle}</span>}
          <span className="block text-sm text-gray-600 mt-1">{date}</span>
        </button>

        <div className="flex items-center gap-1 pr-2 shrink-0">
          <ChevronRight className="size-5 text-gray-400" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`More actions for ${title}`}
                className="size-12 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <MoreVertical className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={openRename}>Rename</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  void duplicateAssessment(a.id)
                }}
              >
                Make a copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePDF} disabled={pdfLoading}>
                {pdfLoading ? 'Making PDF…' : 'Download PDF'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadSingleCSV(a)}>
                Download spreadsheet
              </DropdownMenuItem>
              {a.status === 'failed' && (
                <DropdownMenuItem onClick={() => retryFailed(a.id)}>Try sending again</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {/* Destructive action last, and never adjacent to "open". */}
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-700 focus:text-red-700"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {a.status === 'failed' && (
        <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center justify-between gap-2">
          <p className="text-sm text-red-800">{status.help}</p>
          <button
            type="button"
            onClick={() => retryFailed(a.id)}
            className="text-sm font-semibold text-red-800 underline min-h-[44px] px-2"
          >
            Try again
          </button>
        </div>
      )}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename this evaluation</DialogTitle>
            <DialogDescription>
              This only changes what you see in your list. It doesn't change any of the answers.
            </DialogDescription>
          </DialogHeader>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            aria-label="Evaluation name"
            className="w-full h-12 px-4 rounded-lg border border-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRenameOpen(false)}
              className="min-h-[48px] px-4 rounded-lg border border-gray-400 text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!renameValue.trim()}
              onClick={() => {
                void renameAssessment(a.id, renameValue)
                setRenameOpen(false)
              }}
              className="min-h-[48px] px-4 rounded-lg bg-brand text-white text-base font-semibold disabled:opacity-50"
            >
              Save name
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {subtitle ? `${subtitle} — ` : ''}
              {date}. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAssessment(a.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function AssessmentsList({ onNew, onEdit }: Props) {
  const { assessments, loaded } = useAssessmentsStore()
  const [search, setSearch] = useState('')

  // Client-side over the already-in-memory list: no Firestore query, no index,
  // no extra reads to pay for.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return assessments
    return assessments.filter((a) => assessmentSearchText(a).includes(q))
  }, [assessments, search])

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto space-y-3 pb-8">
      <button
        onClick={onNew}
        className="w-full min-h-[56px] rounded-xl bg-brand text-white font-semibold text-lg hover:bg-brand-hover active:bg-brand-active flex items-center justify-center gap-2"
      >
        <Plus className="size-5" aria-hidden="true" />
        Start a new evaluation
      </button>

      {assessments.length > 3 && (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or contact"
            aria-label="Search evaluations"
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-400 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </div>
      )}

      {!loaded ? (
        <p className="text-center text-gray-600 py-8">Loading…</p>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-800 text-base font-medium">No evaluations yet.</p>
          <p className="text-gray-600 text-base mt-1">
            Tap "Start a new evaluation" above to begin.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-800 text-base">Nothing matches "{search}".</p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-brand font-medium underline mt-2 min-h-[44px]"
          >
            Clear the search
          </button>
        </div>
      ) : (
        <>
          {visible.map((a) => (
            <AssessmentRow key={a.id} a={a} onEdit={onEdit} />
          ))}
          <button
            onClick={() => downloadAllCSV(assessments)}
            className="w-full min-h-[48px] rounded-xl border border-gray-400 text-gray-800 text-base font-medium hover:bg-gray-50"
          >
            Download all as a spreadsheet
          </button>
        </>
      )}

      <p className="text-center pt-2">
        <Link href="/aim-glide" className="text-brand underline text-base">
          Go to the ROI Calculator
        </Link>
      </p>
    </div>
  )
}
