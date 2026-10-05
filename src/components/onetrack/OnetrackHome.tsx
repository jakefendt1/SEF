// OneTrack BOM Builder -- main page.
//
// Job -> Parts -> Photos & notes -> Review. The BOM panel sits beside the
// steps on an iPad in landscape and behind a bottom bar on narrower screens.
// All the rules live in lib/onetrack; this file is state, layout and wiring.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight, FolderOpen, ListChecks, RotateCcw, Save, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ROUTES } from '@/lib/navigation'
import type { Unit } from '@/lib/measurement'
import { getItem, type CategoryId } from '@/lib/onetrack/catalog'
import {
  addItem,
  addQuoteOnly,
  emptyJob,
  hasWearstrip,
  missingFor,
  removeLine,
  resolveBom,
  setNote,
  setQty,
  upsertShaft,
  upsertWearstrip,
  type BomLine,
  type MissingItem,
  type OnetrackJob,
} from '@/lib/onetrack/bom'
import { deletePhotosFor, listPhotos, type BomPhoto } from '@/lib/onetrack/photos'
import { emptyWorksheet, type WearstripWorksheet } from '@/lib/onetrack/wearstrip'
import { emptyShaftSpec, type ShaftSpec } from '@/lib/onetrack/shaft'
import { buildRecord, fromRecord, recheckRecord, recordTitle, type StoredOnetrackBom } from '@/lib/onetrackRecord'
import { WRITE_MESSAGES } from '@/lib/writeOutcome'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useOnetrackStore } from '@/store/onetrackStore'
import { BomPanel } from './BomPanel'
import { JobStep, SeriesSuggestions } from './JobStep'
import { CategoryList, CategoryTiles, QuoteOnlyDialog } from './PartsStep'
import { PhotosStep } from './PhotosStep'
import { ReviewStep } from './ReviewStep'
import { WearstripEditor } from './WearstripEditor'
import { ShaftEditor } from './ShaftEditor'

const STEPS = [
  { id: 'job', title: 'Job' },
  { id: 'parts', title: 'Parts' },
  { id: 'photos', title: 'Photos' },
  { id: 'review', title: 'Review' },
] as const
type StepId = (typeof STEPS)[number]['id']

function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const contentKey = (job: OnetrackJob, unit: Unit, lines: readonly BomLine[], notes: string) =>
  JSON.stringify({ job, unit, lines, notes: notes.trim() })

export function OnetrackHome() {
  const [, params] = useRoute(ROUTES.onetrackBom)
  const routeId = params?.id ?? null
  const [, navigate] = useLocation()
  const user = useAuthStore((s) => s.user)
  const displayName = useAuthStore((s) => s.profile?.displayName ?? '')
  const boms = useOnetrackStore((s) => s.boms)
  const loaded = useOnetrackStore((s) => s.loaded)
  const listError = useOnetrackStore((s) => s.error)
  const subscribe = useOnetrackStore((s) => s.subscribe)
  const saveBom = useOnetrackStore((s) => s.save)
  const removeBom = useOnetrackStore((s) => s.remove)

  useEffect(() => {
    if (user?.uid) subscribe(user.uid)
  }, [user?.uid, subscribe])

  const [bomId, setBomId] = useState(() => routeId ?? crypto.randomUUID())
  const [job, setJob] = useState<OnetrackJob>(() => emptyJob(today(), displayName))
  const [unit, setUnit] = useState<Unit>('in')
  const [lines, setLines] = useState<BomLine[]>([])
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<BomPhoto[]>([])
  const [step, setStep] = useState<StepId>('job')
  const [category, setCategory] = useState<CategoryId | null>(null)
  const [editing, setEditing] = useState<
    | { kind: 'wearstrip'; id: string; ws: WearstripWorksheet; isNew: boolean }
    | { kind: 'shaft'; id: string; itemId: string; spec: ShaftSpec; isNew: boolean }
    | null
  >(null)
  const [editingQuote, setEditingQuote] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deleting, setDeleting] = useState<StoredOnetrackBom | null>(null)
  const [saving, setSaving] = useState(false)
  const [triedSave, setTriedSave] = useState(false)
  const [saved, setSaved] = useState<{ id: string; key: string } | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [reloadNote, setReloadNote] = useState<string | null>(null)

  // ---- Open a saved BOM from the URL, once per id. Reading never writes.
  if (routeId && loaded && loadedFor !== routeId) {
    setLoadedFor(routeId)
    const rec = boms.find((b) => b.id === routeId)
    if (rec) {
      const s = fromRecord(rec)
      setBomId(rec.id)
      setJob(s.job)
      setUnit(s.unit)
      setLines(s.lines)
      setNotes(s.notes)
      setStep('review')
      setCategory(null)
      setEditing(null)
      setSaved({ id: rec.id, key: contentKey(s.job, s.unit, s.lines, s.notes) })
      setReloadNote(
        recheckRecord(rec).changed
          ? 'Part numbers or quantities changed since this was saved. The BOM shown is from today’s catalog.'
          : null,
      )
    } else {
      setReloadNote("That saved BOM isn't on this account. It may have been deleted.")
    }
  }

  // The rep's name arrives after the first render on a cold start.
  if (!job.preparedBy && displayName && !routeId && lines.length === 0) {
    setJob((j) => ({ ...j, preparedBy: displayName }))
  }

  const refreshPhotos = useCallback(() => {
    listPhotos(bomId)
      .then(setPhotos)
      .catch((err) => {
        console.error('[onetrack photos]', err)
        setPhotos([])
      })
  }, [bomId])
  useEffect(refreshPhotos, [refreshPhotos])

  const rows = useMemo(() => resolveBom(lines, unit), [lines, unit])
  const missing = useMemo(() => missingFor(job, lines), [job, lines])
  const key = contentKey(job, unit, lines, notes)
  const isSaved = saved?.id === bomId
  const dirty = isSaved && saved.key !== key
  const stepIndex = STEPS.findIndex((s) => s.id === step)

  // ---- BOM changes ----
  const onAdd = (itemId: string, qty: number) => setLines((l) => addItem(l, itemId, qty))
  const onAddQuoteOnly = (itemId: string, note: string, qty: number) => {
    setLines((l) => addQuoteOnly(l, crypto.randomUUID(), itemId, note, qty))
    toast.success('Added to the BOM')
  }
  const onEditLine = (lineId: string) => {
    const line = lines.find((l) => l.id === lineId)
    if (!line) return
    setPanelOpen(false)
    if (line.kind === 'wearstrip') {
      setStep('parts')
      setEditing({ kind: 'wearstrip', id: line.id, ws: line.worksheet, isNew: false })
    } else if (line.kind === 'shaft') {
      setStep('parts')
      setEditing({ kind: 'shaft', id: line.id, itemId: line.itemId, spec: line.spec, isNew: false })
    } else if (line.kind === 'quoteOnly') {
      setEditingQuote(line.id)
    }
  }
  const quoteLine = lines.find((l) => l.id === editingQuote && l.kind === 'quoteOnly')

  const openCategory = (c: CategoryId) => {
    if (c === 'wearstrip') setEditing({ kind: 'wearstrip', id: crypto.randomUUID(), ws: emptyWorksheet(), isNew: true })
    else setCategory(c)
    window.scrollTo({ top: 0 })
  }

  const openShaft = (itemId: string) => {
    setEditing({ kind: 'shaft', id: crypto.randomUUID(), itemId, spec: emptyShaftSpec(), isNew: true })
    window.scrollTo({ top: 0 })
  }

  const goTo = (target: MissingItem['target']) => {
    if (target === 'job') setStep('job')
    else if (target === 'parts') {
      setStep('parts')
      setEditing(null)
      setCategory(null)
    } else onEditLine(target.lineId)
    window.scrollTo({ top: 0 })
  }

  // ---- Save / open / delete ----
  const handleSave = async () => {
    setTriedSave(true)
    if (!job.customer.trim() || !job.line.trim()) {
      toast.error('Add the customer and the line / conveyor ID first. Nothing was saved.')
      setStep('job')
      return
    }
    const now = Date.now()
    const existing = boms.find((b) => b.id === bomId)
    const rec = buildRecord({ id: bomId, job, unit, lines, notes, createdAt: existing?.createdAt ?? now, now })
    setSaving(true)
    const { outcome, settled } = await saveBom(rec)
    setSaving(false)
    if (outcome.kind === 'failed') {
      toast.error(`Didn't save. ${outcome.message}`)
      return
    }
    if (outcome.kind === 'saved') toast.success(WRITE_MESSAGES.saved)
    else {
      toast(WRITE_MESSAGES.queued)
      void settled.then((o) => {
        if (o.kind === 'failed') toast.error(`${WRITE_MESSAGES.lateFailed} ${o.message}`)
      })
    }
    setSaved({ id: bomId, key })
    setLoadedFor(bomId)
    setReloadNote(null)
    if (routeId !== bomId) navigate(`${ROUTES.onetrack}/${bomId}`)
  }

  const startNew = () => {
    setBomId(crypto.randomUUID())
    setJob(emptyJob(today(), displayName))
    setLines([])
    setNotes('')
    setStep('job')
    setCategory(null)
    setEditing(null)
    setSaved(null)
    setLoadedFor(null)
    setReloadNote(null)
    setTriedSave(false)
    if (routeId) navigate(ROUTES.onetrack)
  }

  const handleDelete = async (rec: StoredOnetrackBom) => {
    const { outcome, settled } = await removeBom(rec.id)
    if (outcome.kind === 'failed') {
      toast.error(`Didn't delete. ${outcome.message}`)
      return
    }
    toast(outcome.kind === 'saved' ? WRITE_MESSAGES.deleted : WRITE_MESSAGES.deleteQueued)
    void settled.then((o) => {
      if (o.kind === 'failed') toast.error(`The delete didn't go through: ${o.message}`)
    })
    void deletePhotosFor(rec.id).catch(() => {})
    if (rec.id === bomId) startNew()
  }

  const subtitle = isSaved
    ? `${recordTitle({ customer: job.customer, reference: job.line })} · ${dirty ? 'changes not saved yet' : 'saved'}`
    : 'Not saved. Use Save to keep it on your account.'

  const panel = (
    <BomPanel
      rows={rows}
      lines={lines}
      onQty={(id, q) => setLines((l) => setQty(l, id, q))}
      onRemove={(id) => setLines((l) => removeLine(l, id))}
      onEdit={onEditLine}
    />
  )

  return (
    <div className="flex flex-col bg-background pb-24 lg:pb-0">
      <SeriesSuggestions />
      {/* Page toolbar. The shell owns the sticky header and back navigation. */}
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground leading-tight flex items-center gap-2">
              OneTrack BOM Builder
              <span className="rounded-full bg-warning-orange/15 text-warning-orange text-xs font-semibold px-2 py-0.5">Beta</span>
            </h2>
            <p className={cn('text-sm truncate', dirty ? 'text-warning-orange font-medium' : 'text-muted-foreground')}>{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setListOpen(true)}>
              <FolderOpen className="size-5" />
              <span className="hidden sm:inline">Saved BOMs</span>
            </Button>
            <Button variant="outline" className="min-h-[44px]" disabled={saving} onClick={handleSave}>
              <Save className="size-5" />
              <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
            </Button>
            <div className="inline-flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Units">
              {(['in', 'mm'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={unit === u}
                  onClick={() => setUnit(u)}
                  className={cn(
                    'min-h-[44px] px-3 text-base font-semibold',
                    unit === u ? 'bg-brand text-white' : 'bg-white text-foreground hover:bg-secondary',
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
            <Button variant="outline" size="icon" className="size-11" onClick={() => setResetOpen(true)} aria-label="Start a new BOM">
              <RotateCcw className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 container py-5 sm:py-8 space-y-4">
        {reloadNote && (
          <div className="flex items-start gap-3 rounded-xl border border-warning-orange/40 bg-warning-orange/5 px-4 py-3" role="status">
            <TriangleAlert className="size-5 text-warning-orange shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-base flex-1">{reloadNote}</p>
            <button type="button" className="min-h-[44px] px-2 font-semibold text-brand underline" onClick={() => setReloadNote(null)}>
              OK
            </button>
          </div>
        )}

        <nav aria-label="Steps">
          <ol className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-card p-1">
            {STEPS.map((s, i) => {
              const current = s.id === step
              const done =
                (s.id === 'job' && job.customer.trim() && job.line.trim()) ||
                (s.id === 'parts' && lines.length > 0) ||
                (s.id === 'photos' && photos.length > 0)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(s.id)
                      setEditing(null)
                      window.scrollTo({ top: 0 })
                    }}
                    aria-current={current ? 'step' : undefined}
                    className={cn(
                      'w-full min-h-[56px] rounded-lg px-1 py-1 flex flex-col items-center justify-center gap-0.5 text-sm font-semibold border',
                      current ? 'border-brand bg-blue-50 text-brand' : 'border-transparent text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    <span
                      className={cn(
                        'size-7 rounded-full grid place-items-center text-sm',
                        current ? 'bg-brand text-white' : done ? 'bg-savings-green text-white' : 'bg-secondary text-foreground',
                      )}
                      aria-hidden="true"
                    >
                      {done && !current ? <Check className="size-4" /> : i + 1}
                    </span>
                    <span className="leading-tight">{s.title}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className={cn('grid gap-6 items-start', step !== 'review' && 'lg:grid-cols-[minmax(0,1fr)_22rem]')}>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6 min-w-0">
            {step === 'job' && <JobStep job={job} unit={unit} onChange={(p) => setJob((j) => ({ ...j, ...p }))} showErrors={triedSave} />}
            {step === 'parts' &&
              (editing?.kind === 'shaft' ? (
                <ShaftEditor
                  key={`${editing.id}-${unit}`}
                  itemId={editing.itemId}
                  initial={editing.spec}
                  isNew={editing.isNew}
                  unit={unit}
                  onCancel={() => setEditing(null)}
                  onSave={(spec) => {
                    setLines((l) => upsertShaft(l, editing.id, editing.itemId, spec))
                    toast.success(editing.isNew ? 'Shaft added to the BOM' : 'BOM line updated')
                    setEditing(null)
                    window.scrollTo({ top: 0 })
                  }}
                />
              ) : editing ? (
                <WearstripEditor
                  key={`${editing.id}-${unit}`}
                  initial={editing.ws}
                  isNew={editing.isNew}
                  unit={unit}
                  onCancel={() => setEditing(null)}
                  onSave={(ws) => {
                    setLines((l) => upsertWearstrip(l, editing.id, ws))
                    toast.success(editing.isNew ? 'Wearstrip added to the BOM' : 'BOM line updated')
                    setEditing(null)
                    window.scrollTo({ top: 0 })
                  }}
                />
              ) : category ? (
                <CategoryList
                  key={category}
                  category={category}
                  beltSeries={job.beltSeries}
                  onBack={() => setCategory(null)}
                  onAdd={onAdd}
                  onAddQuoteOnly={onAddQuoteOnly}
                  onAddShaft={openShaft}
                />
              ) : (
                <CategoryTiles lines={lines} onOpen={openCategory} />
              ))}
            {step === 'photos' && (
              <PhotosStep
                bomId={bomId}
                photos={photos}
                onPhotosChanged={refreshPhotos}
                showChecklist={hasWearstrip(lines)}
                notes={notes}
                onNotes={setNotes}
              />
            )}
            {step === 'review' && <ReviewStep state={{ job, unit, lines, notes, photos }} onGoTo={goTo} />}

            {!editing && (
              <div className="flex justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  className="min-h-[48px] text-base"
                  disabled={stepIndex === 0}
                  onClick={() => {
                    setStep(STEPS[Math.max(0, stepIndex - 1)].id)
                    window.scrollTo({ top: 0 })
                  }}
                >
                  <ChevronLeft className="size-5" /> Back
                </Button>
                {stepIndex < STEPS.length - 1 && (
                  <Button
                    className="min-h-[48px] text-base bg-brand hover:bg-brand-hover"
                    onClick={() => {
                      setStep(STEPS[stepIndex + 1].id)
                      setCategory(null)
                      window.scrollTo({ top: 0 })
                    }}
                  >
                    Next: {STEPS[stepIndex + 1].title} <ChevronRight className="size-5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {step !== 'review' && <aside className="hidden lg:block sticky top-32">{panel}</aside>}
        </div>
      </div>

      {/* Narrow screens: the BOM behind a bottom bar. */}
      {step !== 'review' && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 border-t border-border bg-card px-4 py-2 flex items-center gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <button type="button" onClick={() => setPanelOpen(true)} className="flex-1 min-h-[48px] text-left text-base font-semibold flex items-center gap-2">
            <ListChecks className="size-5 text-brand" aria-hidden="true" />
            BOM · {rows.length} line{rows.length === 1 ? '' : 's'}
          </button>
          <Button
            className="min-h-[48px] text-base bg-brand hover:bg-brand-hover"
            onClick={() => {
              setStep('review')
              setEditing(null)
              window.scrollTo({ top: 0 })
            }}
          >
            Review {missing.length > 0 && `(${missing.length} to do)`}
          </Button>
        </div>
      )}

      <Dialog open={panelOpen} onOpenChange={setPanelOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>BOM</DialogTitle>
            <DialogDescription>The parts on this BOM.</DialogDescription>
          </DialogHeader>
          {panel}
        </DialogContent>
      </Dialog>

      <QuoteOnlyDialog
        item={quoteLine?.kind === 'quoteOnly' ? (getItem(quoteLine.itemId) ?? null) : null}
        initialNote={quoteLine?.kind === 'quoteOnly' ? quoteLine.note : ''}
        initialQty={quoteLine?.kind === 'quoteOnly' ? quoteLine.qty : 1}
        editing
        onOpenChange={(v) => !v && setEditingQuote(null)}
        onSave={(note, qty) => {
          if (editingQuote) setLines((l) => setQty(setNote(l, editingQuote, note), editingQuote, qty))
          setEditingQuote(null)
        }}
      />

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saved BOMs</DialogTitle>
            <DialogDescription className="text-base">Open one to pick up where you left off.</DialogDescription>
          </DialogHeader>
          {listError ? (
            <p className="text-base text-warning-orange">Couldn't load your saved BOMs: {listError}</p>
          ) : !loaded ? (
            <p className="text-base text-muted-foreground">Loading your saved BOMs…</p>
          ) : boms.length === 0 ? (
            <p className="text-base text-muted-foreground">Nothing saved yet. Use Save to keep a BOM.</p>
          ) : (
            <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {boms.map((b) => (
                <li key={b.id} className="flex items-center gap-2 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setListOpen(false)
                      setLoadedFor(null)
                      navigate(`${ROUTES.onetrack}/${b.id}`)
                    }}
                    className="flex-1 min-w-0 px-4 py-3 min-h-[64px] text-left hover:bg-secondary"
                  >
                    <span className="block font-medium truncate">{recordTitle(b)}</span>
                    <span className="block text-sm text-muted-foreground">
                      {new Date(b.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ·{' '}
                      {b.lines.length} line{b.lines.length === 1 ? '' : 's'}
                    </span>
                  </button>
                  {/* Separated from the open target and confirmed: one stray tap
                      must never delete a customer's BOM. */}
                  <Button variant="ghost" size="icon" className="size-12 mr-1 text-muted-foreground" onClick={() => setDeleting(b)} aria-label={`Delete ${recordTitle(b)}`}>
                    <Trash2 className="size-5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting ? recordTitle(deleting) : ''}"?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone. Its photos on this device go too.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[48px]">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[48px] bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleting) void handleDelete(deleting)
                setDeleting(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new BOM?</AlertDialogTitle>
            <AlertDialogDescription>
              {isSaved && !dirty
                ? 'This one is saved; you can reopen it from Saved BOMs.'
                : 'This one has changes that aren’t saved. They’ll be lost.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[48px]">Cancel</AlertDialogCancel>
            <AlertDialogAction className="min-h-[48px]" onClick={startNew}>
              Start new
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
