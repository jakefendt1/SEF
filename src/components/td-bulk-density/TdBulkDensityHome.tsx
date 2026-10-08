// ThermoDrive Bulk Density Calculator -- main page.
//
// What it answers: how much bulk product a flighted ThermoDrive incline
// carries per flight, the belt speed a line needs, and what sidewalls or
// guards add. It replaces CalcLab's Bulk Density Calculator, which had no
// model of the flight ends at all.
//
// All of the arithmetic lives in lib/tdBulkDensity and runs in a worker.
// This file is inputs, layout, persistence wiring and honest presentation.
import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import { toast } from 'sonner'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileDown,
  FolderOpen,
  Layers,
  Pin,
  RotateCcw,
  Save,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTES } from '@/lib/navigation'
import { PDF_EXPORT_MESSAGES } from '@/lib/statusLabels'
import { compareNames } from '@/lib/tdBulkDensity/compare'
import { computeTdBulkDensity, type TdComputed } from '@/lib/tdBulkDensity/compute'
import { findPreset } from '@/lib/tdBulkDensity/data/products'
import { governingKindsPresent } from '@/lib/tdBulkDensity/fieldSlices'
import {
  STEPS,
  convertForm,
  fieldText,
  formToInputs,
  initialForm,
  inputsKey,
  inputsToForm,
  missingByStep,
  reconcile,
  type StepId,
  type TdForm,
} from '@/lib/tdBulkDensity/form'
import type { UnitSystem } from '@/lib/tdBulkDensity/units'
import {
  buildRun,
  fromStoredInputs,
  recheckRun,
  runTitle,
  type StoredTdRun,
} from '@/lib/tdBulkDensityRecord'
import type { PdfVersion } from '@/lib/tdBulkDensityPdf'
import { WRITE_MESSAGES } from '@/lib/writeOutcome'
import { cn } from '@/lib/utils'
import { useTdBulkDensityStore } from '@/store/tdBulkDensityStore'
import { CompareStrip } from './CompareStrip'
import { ConveyorStep } from './ConveyorStep'
import { DepthHeatmap } from './DepthHeatmap'
import { EdgeLegend } from './EdgeLegend'
import { EdgeStep } from './EdgeStep'
import { EndSection } from './EndSection'
import { FlightStep } from './FlightStep'
import { LayerPanel } from './LayerPanel'
import { DEFAULT_LAYERS, type LayerState } from './layers'
import { ProductStep } from './ProductStep'
import { ResultsCard } from './ResultsCard'
import { ResultsStep } from './ResultsStep'
import { ExportDialog, SaveDialog, SavedRunsDialog, type RunMeta } from './RunDialogs'
import { SideSection } from './SideSection'
import type { StepProps } from './stepProps'
import { Sweeps, type SweepPick } from './Sweeps'
import { useTdEngine } from './useTdEngine'

const Pocket3D = lazy(() => import('./Pocket3D'))

const STEP_COMPONENT: Record<StepId, (p: StepProps) => React.ReactElement> = {
  conveyor: ConveyorStep,
  flights: FlightStep,
  edges: EdgeStep,
  product: ProductStep,
  results: ResultsStep,
}

const EMPTY_META: RunMeta = { customer: '', reference: '', notes: '' }

function densitySource(form: TdForm): string {
  const preset = findPreset(form.productPreset)
  if (preset && form.density === fieldText(preset.densityLbFt3, 'density', form.system)) {
    return `${preset.label} preset (typical range — confirm with customer)`
  }
  if (preset) return `Entered (started from the ${preset.label} preset)`
  return 'Entered or measured on site'
}

function Loading3D() {
  return <div className="h-[min(60vh,26rem)] grid place-items-center text-muted-foreground">Loading 3D view…</div>
}

export function TdBulkDensityHome() {
  const [, params] = useRoute(ROUTES.tdBulkDensityRun)
  const runId = params?.id ?? null
  const [, navigate] = useLocation()
  const runs = useTdBulkDensityStore((s) => s.runs)
  const runsLoaded = useTdBulkDensityStore((s) => s.loaded)
  const saveRun = useTdBulkDensityStore((s) => s.save)
  const removeRun = useTdBulkDensityStore((s) => s.remove)

  const [form, setForm] = useState<TdForm>(initialForm)
  const [stepIndex, setStepIndex] = useState(0)
  const [cutX, setCutX] = useState(0.4)
  const [cutZ, setCutZ] = useState(0.5)
  const [show3D, setShow3D] = useState(true)
  const [tab, setTab] = useState('side')
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS)
  const [pinned, setPinned] = useState<{ result: TdComputed; form: TdForm } | null>(null)

  const [meta, setMeta] = useState<RunMeta>(EMPTY_META)
  const [loadedRun, setLoadedRun] = useState<StoredTdRun | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [reloadNote, setReloadNote] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [runsOpen, setRunsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const canvasB = useRef<HTMLCanvasElement | null>(null)
  const canvasA = useRef<HTMLCanvasElement | null>(null)
  const setCanvasB = useCallback((c: HTMLCanvasElement | null) => (canvasB.current = c), [])
  const setCanvasA = useCallback((c: HTMLCanvasElement | null) => (canvasA.current = c), [])

  // ---- Open a saved run from the URL, once per id. Reading never writes:
  // the run is recomputed with today's engine and compared, nothing more.
  if (runId && runsLoaded && loadedFor !== runId) {
    setLoadedFor(runId)
    const run = runs.find((r) => r.id === runId)
    if (run) {
      const re = recheckRun(run)
      setForm(inputsToForm(re.inputs, run.system, run.productPreset))
      setMeta({ customer: run.customer, reference: run.reference, notes: run.notes })
      setLoadedRun(run)
      setStepIndex(STEPS.length - 1)
      setReloadNote(
        re.changed
          ? `Results changed since this was saved${re.engineChanged ? ` (saved with engine ${run.engineVersion})` : ''}. The numbers shown are from today's calculation.`
          : null,
      )
    } else {
      setLoadedRun(null)
      setReloadNote("That saved run isn't on this account. It may have been deleted.")
    }
  }

  const set = useCallback((patch: Partial<TdForm>) => {
    setForm((f) => reconcile({ ...f, ...patch }))
  }, [])

  // ---- Derived. Nothing is stored that can be computed. ----
  const inputs = useMemo(() => formToInputs(form), [form])
  const missing = useMemo(() => missingByStep(form), [form])
  const engine = useTdEngine(inputs, form.system, tab === 'sweeps')
  const result = engine.result
  const shown = result && result.heap && result.status === 'ok' ? result : null
  // Results come back from the worker as structured clones, so "is this result
  // for the current inputs?" has to compare values, not object identity.
  const currentKey = useMemo(() => inputsKey(inputs), [inputs])
  const shownKey = useMemo(() => inputsKey(shown?.inputs ?? null), [shown])
  const sweepsKey = useMemo(() => inputsKey(engine.sweepsFor), [engine.sweepsFor])
  const exportable = !!(shown && !shown.blocked && engine.grid === 'fine' && shownKey === currentKey)

  const savedInputsJson = useMemo(
    () => (loadedRun ? inputsKey(fromStoredInputs(loadedRun.inputs)) : null),
    [loadedRun],
  )
  const dirty = !!loadedRun && currentKey !== savedInputsJson

  const step = STEPS[stepIndex]
  const StepBody = STEP_COMPONENT[step.id]
  const stepMissing = (id: StepId) => missing.filter((m) => m.step === id).length
  const firstMissingStep = missing.length ? STEPS.findIndex((s) => s.id === missing[0].step) : -1
  const nonInfo = result ? result.warnings.filter((w) => w.severity !== 'info').length : 0
  const names = useMemo(
    () => (pinned ? compareNames(pinned.result, shown, form.system) : { a: 'A', b: 'B' }),
    [pinned, shown, form.system],
  )

  // ---- Handlers ----
  const handleUnits = (next: UnitSystem) => setForm((f) => convertForm(f, next))

  const handleReset = () => {
    const prev = { form, meta, loadedRun, loadedFor, path: runId ? `${ROUTES.tdBulkDensity}/${runId}` : ROUTES.tdBulkDensity }
    setForm(initialForm())
    setMeta(EMPTY_META)
    setLoadedRun(null)
    setLoadedFor(null)
    setReloadNote(null)
    setStepIndex(0)
    if (runId) navigate(ROUTES.tdBulkDensity)
    toast('Cleared — start a new run', {
      action: {
        label: 'Undo',
        onClick: () => {
          setForm(prev.form)
          setMeta(prev.meta)
          setLoadedRun(prev.loadedRun)
          setLoadedFor(prev.loadedFor)
          navigate(prev.path)
        },
      },
    })
  }

  const handleSave = async (asNew: boolean) => {
    if (!inputs) return
    const now = Date.now()
    const isNew = asNew || !loadedRun
    const id = isNew ? crypto.randomUUID() : loadedRun!.id
    const run = buildRun({
      id,
      ...meta,
      inputs,
      system: form.system,
      productPreset: form.productPreset,
      // The snapshot is always the full-grid result for exactly these inputs.
      result: computeTdBulkDensity(inputs, 'fine', form.system),
      createdAt: isNew ? now : loadedRun!.createdAt,
      now,
    })
    setSaving(true)
    const { outcome, settled } = await saveRun(run)
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
    setLoadedRun(run)
    setLoadedFor(id)
    setReloadNote(null)
    setSaveOpen(false)
    if (runId !== id) navigate(`${ROUTES.tdBulkDensity}/${id}`)
  }

  const handleDelete = async (run: StoredTdRun) => {
    const { outcome, settled } = await removeRun(run.id)
    if (outcome.kind === 'failed') {
      toast.error(`Didn't delete. ${outcome.message}`)
      return
    }
    toast(outcome.kind === 'saved' ? WRITE_MESSAGES.deleted : WRITE_MESSAGES.deleteQueued)
    void settled.then((o) => {
      if (o.kind === 'failed') toast.error(`The delete didn't go through: ${o.message}`)
    })
    if (loadedRun?.id === run.id) {
      setLoadedRun(null)
      setLoadedFor(null)
      navigate(ROUTES.tdBulkDensity)
    }
  }

  const handleExport = async (version: PdfVersion) => {
    if (!shown) return
    setExporting(true)
    try {
      const { exportTdPdf } = await import('./exportPdf')
      const r = await exportTdPdf({
        version,
        customer: meta.customer.trim(),
        reference: meta.reference.trim(),
        result: shown,
        system: form.system,
        densitySource: densitySource(form),
        cutX,
        cutZ,
        canvas3d: show3D ? canvasB.current : null,
        compare: pinned
          ? { a: pinned.result, canvasA: show3D ? canvasA.current : null, canvasB: show3D ? canvasB.current : null }
          : undefined,
      })
      if (!r.logoRendered) toast.warning(PDF_EXPORT_MESSAGES.missingLogo)
      else if (r.viewsMissing) toast.warning("PDF saved, but the section views didn't draw. Check it before you send it.")
      else toast.success(PDF_EXPORT_MESSAGES.ok)
      setExportOpen(false)
    } catch (err) {
      console.error('[td pdf]', err)
      toast.error(PDF_EXPORT_MESSAGES.failed)
    } finally {
      setExporting(false)
    }
  }

  const handlePick = (p: SweepPick) => {
    const sys = form.system
    if (p.sweep === 'sidewall') set({ containment: 'sidewalls', sidewallHeight: String(p.x) })
    else if (p.sweep === 'angle') set({ incline: fieldText(Math.round(p.x), 'incline', sys) })
    else set({ flightSpacing: fieldText(Math.round(p.x * 20) / 20, 'flightSpacing', sys) })
    toast('Applied to the inputs')
  }

  const subtitle = loadedRun
    ? `${runTitle(loadedRun)} · ${dirty ? 'changes not saved yet' : 'saved'}`
    : 'Not saved — use Save to keep it on your account.'

  return (
    <div className="flex flex-col bg-background">
      {/* Page toolbar. The shell owns the sticky header and back navigation. */}
      <div className="border-b bg-card no-print">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground leading-tight">ThermoDrive Bulk Density Calculator</h2>
            <p className={cn('text-sm truncate', dirty ? 'text-warning-orange font-medium' : 'text-muted-foreground')}>{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setRunsOpen(true)}>
              <FolderOpen className="size-5" />
              <span className="hidden sm:inline">Saved runs</span>
            </Button>
            <Button variant="outline" className="min-h-[44px]" disabled={!inputs} onClick={() => setSaveOpen(true)}>
              <Save className="size-5" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button
              variant="outline"
              className="min-h-[44px]"
              disabled={!exportable}
              onClick={() => setExportOpen(true)}
              aria-label="Export a PDF"
            >
              <FileDown className="size-5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <div className="inline-flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Units">
              {(['imperial', 'metric'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={form.system === u}
                  onClick={() => handleUnits(u)}
                  className={cn(
                    'min-h-[44px] px-3 text-base font-semibold',
                    form.system === u ? 'bg-brand text-white' : 'bg-white text-foreground hover:bg-secondary',
                  )}
                >
                  {u === 'imperial' ? 'in / lb' : 'mm / kg'}
                </button>
              ))}
            </div>
            <Button variant="outline" size="icon" className="size-11" onClick={handleReset} aria-label="Clear and start a new run">
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] items-start">
          {/* ---- Visuals: top on mobile, right column on desktop ---- */}
          <div className="space-y-4 lg:col-start-2 lg:row-start-1">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="size-5 text-primary" aria-hidden="true" /> The pocket
                </CardTitle>
                <div className="flex gap-2">
                  {shown && (
                    <Button
                      variant="outline"
                      className="min-h-[44px]"
                      onClick={() => {
                        setPinned({ result: shown, form })
                        toast('This run is now A. Change anything (say the belt width) and B shows side by side.')
                      }}
                    >
                      <Pin className="size-4" /> {pinned ? 'Make this A' : 'Compare'}
                    </Button>
                  )}
                  <Button variant="outline" className="min-h-[44px]" onClick={() => setShow3D((v) => !v)} aria-expanded={show3D}>
                    {show3D ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    {show3D ? 'Hide 3D' : 'Show 3D'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!shown ? (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-10 text-center text-base text-muted-foreground">
                    {result && result.status !== 'ok'
                      ? result.statusReason
                      : 'The pocket appears here once the belt, flights and product are in.'}
                  </div>
                ) : (
                  <>
                    {show3D &&
                      (pinned?.result.heap ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-sm font-semibold mb-1">{names.a} (pinned)</p>
                            <Suspense fallback={<Loading3D />}>
                              <Pocket3D result={pinned.result} inputs={pinned.result.inputs} cutX={cutX} cutZ={cutZ} onCanvas={setCanvasA} layers={layers} />
                            </Suspense>
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-1 text-brand">{names.b} (now)</p>
                            <Suspense fallback={<Loading3D />}>
                              <Pocket3D result={shown} inputs={shown.inputs} cutX={cutX} cutZ={cutZ} onCanvas={setCanvasB} layers={layers} />
                            </Suspense>
                          </div>
                        </div>
                      ) : (
                        <Suspense fallback={<Loading3D />}>
                          <Pocket3D result={shown} inputs={shown.inputs} cutX={cutX} cutZ={cutZ} onCanvas={setCanvasB} layers={layers} />
                        </Suspense>
                      ))}
                    {show3D && (
                      <>
                        <p className="text-sm text-muted-foreground">Drag to turn it, pinch to zoom.</p>
                        <LayerPanel
                          layers={layers}
                          onChange={setLayers}
                          edgeKinds={governingKindsPresent(shown.heap!)}
                          hasWalls={
                            shown.inputs.containment === 'sidewalls' ||
                            shown.inputs.containment === 'sealed' ||
                            (shown.inputs.containment === 'guards' && shown.inputs.guardClearanceIn !== null)
                          }
                        />
                      </>
                    )}
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md bg-secondary/40 px-2 py-1">
                      <p className="text-xs font-semibold text-foreground/70">Key:</p>
                      <EdgeLegend kinds={governingKindsPresent(shown.heap!)} />
                    </div>
                    <Tabs value={tab} onValueChange={setTab}>
                      <TabsList className="w-full h-auto grid grid-cols-2 sm:grid-cols-4 gap-1">
                        <TabsTrigger value="side" className="text-base min-h-[44px]">Side</TabsTrigger>
                        <TabsTrigger value="end" className="text-base min-h-[44px]">End</TabsTrigger>
                        <TabsTrigger value="heatmap" className="text-base min-h-[44px]">Depth map</TabsTrigger>
                        <TabsTrigger value="sweeps" className="text-base min-h-[44px]">Sweeps</TabsTrigger>
                      </TabsList>
                      <TabsContent value="side" className="pt-3">
                        <SideSection result={shown} inputs={shown.inputs} cutX={cutX} cutZ={cutZ} onCutX={setCutX} onCutZ={setCutZ} system={form.system} />
                      </TabsContent>
                      <TabsContent value="end" className="pt-3">
                        <EndSection result={shown} inputs={shown.inputs} cutX={cutX} cutZ={cutZ} onCutX={setCutX} onCutZ={setCutZ} system={form.system} />
                      </TabsContent>
                      <TabsContent value="heatmap" className="pt-3">
                        <DepthHeatmap result={shown} system={form.system} />
                      </TabsContent>
                      <TabsContent value="sweeps" className="pt-3">
                        <Sweeps
                          sweeps={engine.sweeps}
                          busy={engine.sweepsBusy}
                          stale={sweepsKey !== currentKey}
                          system={form.system}
                          onPick={handlePick}
                        />
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ---- Stepper: left column on desktop ---- */}
          <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
            <Card>
              <CardHeader className="pb-2">
                <nav aria-label="Steps">
                  <ol className="grid grid-cols-5 gap-1">
                    {STEPS.map((s, i) => {
                      const done = s.id !== 'results' && stepMissing(s.id) === 0
                      const current = i === stepIndex
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setStepIndex(i)}
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
              </CardHeader>
              <CardContent className="space-y-6">
                <h3 className="text-xl font-semibold">
                  {stepIndex + 1}. {step.title}
                </h3>
                <StepBody form={form} set={set} result={result} />
                <div className="flex justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="min-h-[48px] text-base"
                    disabled={stepIndex === 0}
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  >
                    <ChevronLeft className="size-5" /> Back
                  </Button>
                  {stepIndex < STEPS.length - 1 && (
                    <Button
                      className="min-h-[48px] text-base bg-brand hover:bg-brand-hover"
                      onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                    >
                      Next: {STEPS[stepIndex + 1].title} <ChevronRight className="size-5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ---- Results: below the stepper on mobile, bottom right on desktop ---- */}
          <div className="space-y-4 lg:col-start-2 lg:row-start-2">
            {pinned && (
              <CompareStrip
                a={pinned.result}
                b={shown}
                system={form.system}
                onUnpin={() => setPinned(null)}
                onRestoreA={() => setForm(pinned.form)}
              />
            )}
            <ResultsCard
              result={result}
              missing={missing.map((m) => m.label)}
              refining={engine.refining}
              system={form.system}
              onGoToStep={firstMissingStep >= 0 ? () => setStepIndex(firstMissingStep) : undefined}
            />
            {engine.error && (
              <p className="text-base text-destructive">
                The calculation failed: {engine.error}. Change an input to try again.
              </p>
            )}
            {result && stepIndex !== STEPS.length - 1 && nonInfo > 0 && (
              <p className="text-base">
                <button type="button" className="min-h-[48px] font-semibold text-brand underline" onClick={() => setStepIndex(STEPS.length - 1)}>
                  {nonInfo} warning{nonInfo === 1 ? '' : 's'} to check
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      <SaveDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        meta={meta}
        onMetaChange={setMeta}
        canUpdate={!!loadedRun}
        saving={saving}
        onSave={handleSave}
      />
      <SavedRunsDialog
        open={runsOpen}
        onOpenChange={setRunsOpen}
        runs={runs}
        loaded={runsLoaded}
        system={form.system}
        onDelete={handleDelete}
      />
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        meta={meta}
        onMetaChange={setMeta}
        exporting={exporting}
        hasCompare={!!pinned}
        has3d={show3D}
        onExport={handleExport}
      />
    </div>
  )
}
