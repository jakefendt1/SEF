// ThermoDrive Belt Configurator: lay out a ThermoDrive belt and check it
// against the fabrication rules. Rebuilt from Patrick's Belt Configurator
// (v0.65) over the shared engine in lib/thermodrive, which the Bulk Density
// calculator uses too. Saves nothing: the belt travels by URL and leaves as a
// build sheet.
import { useCallback, useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { Check, ChevronLeft, ChevronRight, Layers, ListChecks, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { freshBelt, type TdBelt } from '@/lib/thermodrive/belt'
import { HANDOFF_PARAM, bulkDensityBlocker, encodeHandoff, handoffFromBelt, type HandoffBelt } from '@/lib/thermodrive/handoff'
import { ROUTES } from '@/lib/navigation'
import { useMyTools } from '@/store/useMyTools'
import { defaultRepair, defaultSectionMode, type RepairState } from '@/lib/thermodrive/repair'
import type { SectionMode } from '@/lib/thermodrive/geometry'
import { validateBelt, validateRepair } from '@/lib/thermodrive/validate'
import type { UnitSystem } from '@/lib/tdBulkDensity/units'
import { cn } from '@/lib/utils'
import { WarningsPanel } from '../td-bulk-density/WarningsPanel'
import { EdgesPanel, FlightsPanel, ProductPanel, SizePanel, type PanelProps } from './BeltPanels'
import { RepairPanel, RepairView, SectionsPanel, SectionsView } from './RepairSections'
import { CrossView, SeamView, SummaryTable, TopView } from './views'

const UNIT_KEY = 'tdConfiguratorUnits'

function loadUnits(): UnitSystem {
  try {
    return localStorage.getItem(UNIT_KEY) === 'metric' ? 'metric' : 'imperial'
  } catch {
    return 'imperial'
  }
}

type StepId = 'product' | 'size' | 'flights' | 'edges' | 'check'
const STEPS: { id: StepId; title: string }[] = [
  { id: 'product', title: 'Product' },
  { id: 'size', title: 'Size' },
  { id: 'flights', title: 'Flights' },
  { id: 'edges', title: 'Edges' },
  { id: 'check', title: 'Check' },
]

const PANELS: Record<Exclude<StepId, 'check'>, (p: PanelProps) => React.ReactElement> = {
  product: ProductPanel,
  size: SizePanel,
  flights: FlightsPanel,
  edges: EdgesPanel,
}

export interface ConfiguratorInit {
  belt: TdBelt
  /** What Bulk Density sent that the configurator doesn't model; sent back as-is. */
  carry?: Pick<HandoffBelt, 'flightType' | 'flightThicknessIn'>
  note?: string
}

export function TdConfiguratorHome({ init }: { init?: ConfiguratorInit }) {
  const [belt, setBelt] = useState<TdBelt>(() => init?.belt ?? freshBelt())
  const [system, setSystem] = useState<UnitSystem>(loadUnits)
  const [stepIndex, setStepIndex] = useState(0)
  const [allPanels, setAllPanels] = useState(false)
  const [tab, setTab] = useState<'belt' | 'repair' | 'sections'>('belt')
  const [view, setView] = useState('top')
  const [repair, setRepair] = useState<RepairState>(() => defaultRepair(init?.belt ?? freshBelt()))
  const [sectionMode, setSectionMode] = useState<SectionMode>(defaultSectionMode)
  const [note, setNote] = useState(init?.note ?? null)
  const [, navigate] = useLocation()
  const { tools } = useMyTools()

  const set = useCallback((patch: Partial<TdBelt> | ((b: TdBelt) => TdBelt)) => {
    setBelt((b) => (typeof patch === 'function' ? patch(b) : { ...b, ...patch }))
  }, [])

  const warnings = useMemo(
    () => [...validateBelt(belt, system), ...(tab === 'repair' ? validateRepair(belt, system) : [])],
    [belt, system, tab],
  )
  const warnIds = useMemo(() => new Set(warnings.map((w) => w.id)), [warnings])
  const errors = warnings.filter((w) => w.severity === 'error').length

  const chooseUnits = (u: UnitSystem) => {
    setSystem(u)
    try {
      localStorage.setItem(UNIT_KEY, u)
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  }

  const reset = () => {
    const b = freshBelt(belt.series)
    setBelt(b)
    setRepair(defaultRepair(b))
    setSectionMode(defaultSectionMode())
    setStepIndex(0)
    setNote(null)
  }

  const sendBlocker = bulkDensityBlocker(belt.series) ?? (!(belt.widthMm > 0) || !belt.flightsOn || !(belt.vars[0]?.heightMm > 0) ? 'Enter the width and a flight height first.' : null)
  const sendToBulkDensity = () => {
    if (sendBlocker) return
    const { handoff } = handoffFromBelt(belt, init?.carry)
    navigate(`${ROUTES.tdBulkDensity}?${HANDOFF_PARAM}=${encodeHandoff(handoff)}`)
  }

  const step = STEPS[stepIndex]
  const stepDone = (id: StepId) =>
    id === 'product' ? true : id === 'size' ? belt.widthMm > 0 && belt.lengthMm > 0 : id === 'flights' ? !belt.flightsOn || belt.vars.every((v) => v.heightMm > 0) : id === 'edges'
  const panelProps: PanelProps = { belt, set, system }

  const stepper = (
    <Card>
      <CardHeader className="pb-2 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{allPanels ? 'All settings' : `${stepIndex + 1}. ${step.title}`}</CardTitle>
          <Button variant="outline" className="min-h-[44px]" onClick={() => setAllPanels((v) => !v)} aria-pressed={allPanels}>
            <ListChecks className="size-4" /> {allPanels ? 'Step by step' : 'All panels'}
          </Button>
        </div>
        {!allPanels && (
          <nav aria-label="Steps">
            <ol className="grid grid-cols-5 gap-1">
              {STEPS.map((s, i) => {
                const current = i === stepIndex
                const done = s.id !== 'check' && stepDone(s.id)
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
                        className={cn('size-7 rounded-full grid place-items-center text-sm', current ? 'bg-brand text-white' : done ? 'bg-savings-green text-white' : 'bg-secondary text-foreground')}
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
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {allPanels ? (
          (Object.keys(PANELS) as (keyof typeof PANELS)[]).map((k) => {
            const Panel = PANELS[k]
            return (
              <section key={k} className="space-y-3">
                <h3 className="text-lg font-semibold border-b border-border pb-1">{STEPS.find((s) => s.id === k)!.title}</h3>
                <Panel {...panelProps} />
              </section>
            )
          })
        ) : step.id === 'check' ? (
          <div className="space-y-3">
            <p className="text-base">
              {errors ? `${errors} thing${errors === 1 ? '' : 's'} to fix before this belt can be built.` : 'Nothing blocks this belt. Check the notes, then send the build sheet.'}
            </p>
            <SummaryTable belt={belt} system={system} />
          </div>
        ) : (
          (() => {
            const Panel = PANELS[step.id]
            return <Panel {...panelProps} />
          })()
        )}
        {!allPanels && (
          <div className="flex justify-between gap-3 pt-2">
            <Button variant="outline" className="min-h-[48px] text-base" disabled={stepIndex === 0} onClick={() => setStepIndex((i) => Math.max(0, i - 1))}>
              <ChevronLeft className="size-5" /> Back
            </Button>
            {stepIndex < STEPS.length - 1 && (
              <Button className="min-h-[48px] text-base bg-brand hover:bg-brand-hover" onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}>
                Next: {STEPS[stepIndex + 1].title} <ChevronRight className="size-5" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col bg-background">
      <div className="border-b bg-card no-print">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground leading-tight">ThermoDrive Belt Configurator</h2>
            <p className="text-sm text-muted-foreground truncate">Based on Patrick's Belt Configurator (v0.65). Nothing is saved.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Units">
              {(['imperial', 'metric'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={system === u}
                  onClick={() => chooseUnits(u)}
                  className={cn('min-h-[44px] px-3 text-base font-semibold', system === u ? 'bg-brand text-white' : 'bg-white text-foreground hover:bg-secondary')}
                >
                  {u === 'imperial' ? 'in' : 'mm'}
                </button>
              ))}
            </div>
            {tools.includes('td-bulk-density') && (
              <Button variant="outline" className="min-h-[44px]" disabled={!!sendBlocker} onClick={sendToBulkDensity} title={sendBlocker ?? undefined}>
                <Layers className="size-5" />
                <span className="hidden sm:inline">Send to Bulk Density</span>
              </Button>
            )}
            <Button variant="outline" size="icon" className="size-11" onClick={reset} aria-label="Start a new belt">
              <RotateCcw className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 container py-5 sm:py-8 space-y-4">
        {note && (
          <div className="flex items-start gap-3 rounded-xl border border-brand/40 bg-blue-50 px-4 py-3" role="status">
            <p className="text-base flex-1">{note}</p>
            <button type="button" className="min-h-[44px] px-2 font-semibold text-brand underline" onClick={() => setNote(null)}>
              OK
            </button>
          </div>
        )}
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full sm:w-auto h-auto grid grid-cols-3 gap-1">
            <TabsTrigger value="belt" className="text-base min-h-[44px]">Belt</TabsTrigger>
            <TabsTrigger value="repair" className="text-base min-h-[44px]">Repair</TabsTrigger>
            <TabsTrigger value="sections" className="text-base min-h-[44px]">Sections</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] items-start">
          <div className="space-y-4 lg:col-start-2 lg:row-start-1">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {tab === 'belt' && (
                  <Tabs value={view} onValueChange={setView}>
                    <TabsList className="w-full h-auto grid grid-cols-2 sm:grid-cols-4 gap-1">
                      <TabsTrigger value="top" className="text-base min-h-[44px]">Top</TabsTrigger>
                      <TabsTrigger value="splice" className="text-base min-h-[44px]">Splice</TabsTrigger>
                      <TabsTrigger value="cross" className="text-base min-h-[44px]">Cross-section</TabsTrigger>
                      <TabsTrigger value="summary" className="text-base min-h-[44px]">Summary</TabsTrigger>
                    </TabsList>
                    <TabsContent value="top" className="pt-3">
                      <TopView belt={belt} system={system} warnIds={warnIds} id="td-view-top" />
                    </TabsContent>
                    <TabsContent value="splice" className="pt-3">
                      <SeamView belt={belt} system={system} id="td-view-splice" />
                    </TabsContent>
                    <TabsContent value="cross" className="pt-3">
                      <CrossView belt={belt} system={system} warnIds={warnIds} id="td-view-cross" />
                    </TabsContent>
                    <TabsContent value="summary" className="pt-3">
                      <SummaryTable belt={belt} system={system} />
                    </TabsContent>
                  </Tabs>
                )}
                {tab === 'repair' && <RepairView belt={belt} repair={repair} system={system} id="td-view-repair" />}
                {tab === 'sections' && <SectionsView belt={belt} mode={sectionMode} system={system} id="td-view-sections" />}
              </CardContent>
            </Card>
            <WarningsPanel warnings={warnings} />
          </div>

          <div className="lg:col-start-1 lg:row-start-1">
            {tab === 'belt' && stepper}
            {tab === 'repair' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Repair section</CardTitle>
                </CardHeader>
                <CardContent>
                  <RepairPanel belt={belt} repair={repair} setRepair={setRepair} />
                </CardContent>
              </Card>
            )}
            {tab === 'sections' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <SectionsPanel belt={belt} mode={sectionMode} setMode={setSectionMode} system={system} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
