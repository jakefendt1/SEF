// Belt Elongation Check — main page.
//
// The field problem this solves: an account manager is standing at a conveyor
// without the Intralox elongation ruler, and needs to know whether the belt has
// stretched enough to matter. A tape measure and a pitch count is enough, as
// long as the arithmetic and the judgement are done for them.
//
// All of the arithmetic lives in lib/beltElongation.ts and lib/measurement.ts.
// This file is inputs, layout, and honest presentation.
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, Minus, Plus, RotateCcw, Ruler, TriangleAlert } from 'lucide-react'
import {
  BELT_SERIES,
  CUSTOM_SERIES,
  DEFAULT_SERIES,
  seriesLabel,
  seriesPitchIn,
} from '@/schema/beltSeries'
import {
  BREAK_IN_PCT,
  DEFAULT_REPLACE_LIMIT_PCT,
  TARGET_TAPE_ERROR_PCT,
  computeElongation,
  growthOverBeltIn,
  pitchesGained,
  readingsDisagree,
  recommendedPitchCount,
  spanAtPct,
  summarizeResult,
  verdictFor,
} from '@/lib/beltElongation'
import {
  formatForTape,
  formatLength,
  fromInches,
  parseMeasurement,
  toInches,
  type Unit,
} from '@/lib/measurement'
import { cn } from '@/lib/utils'
import { ElongationGauge } from './ElongationGauge'
import { MeasureGuide } from './MeasureGuide'
import { ReadingsField } from './ReadingsField'
import { LEVEL_STYLES } from './levelStyles'
import { convertReading, newReading, readingToInches, type TapeReading } from './readings'

const INITIAL_PITCH_IN = seriesPitchIn(DEFAULT_SERIES) ?? 1

/** Decimal places a typed field should keep, per unit and per kind of value. */
const PITCH_DP: Record<Unit, number> = { in: 4, mm: 2 }
const LENGTH_DP: Record<Unit, number> = { in: 2, mm: 0 }

/** Round for display without leaving trailing zeros in an input box. */
function trimNum(value: number, dp: number): string {
  return String(Number.parseFloat(value.toFixed(dp)))
}

function convertText(text: string, from: Unit, to: Unit, dp: number): string {
  const v = parseMeasurement(text)
  if (v === null) return text
  return trimNum(fromInches(toInches(v, from), to), dp)
}

interface Snapshot {
  unit: Unit
  series: string
  pitchText: string
  countText: string
  limitText: string
  readings: TapeReading[]
  beltLenText: string
}

export function BeltElongationHome() {
  const [unit, setUnit] = useState<Unit>('in')
  const [series, setSeries] = useState<string>(DEFAULT_SERIES)
  const [pitchText, setPitchText] = useState(() => trimNum(INITIAL_PITCH_IN, PITCH_DP.in))
  const [countText, setCountText] = useState(() => String(recommendedPitchCount(INITIAL_PITCH_IN)))
  const [limitText, setLimitText] = useState(String(DEFAULT_REPLACE_LIMIT_PCT))
  const [readings, setReadings] = useState<TapeReading[]>(() => [newReading()])
  const [beltLenText, setBeltLenText] = useState('')

  // ---- Derived values. Nothing is stored that can be computed. ----
  const pitchIn = useMemo(() => {
    const v = parseMeasurement(pitchText)
    return v === null || v <= 0 ? null : toInches(v, unit)
  }, [pitchText, unit])

  const pitchCount = useMemo(() => {
    const v = parseMeasurement(countText)
    return v === null || v < 1 ? 0 : Math.floor(v)
  }, [countText])

  const limitPct = useMemo(() => {
    const v = parseMeasurement(limitText)
    return v === null || v <= 0 ? DEFAULT_REPLACE_LIMIT_PCT : v
  }, [limitText])

  const readingsIn = useMemo(
    () =>
      readings
        .map((r) => readingToInches(r, unit))
        .filter((v): v is number => v !== null && v > 0),
    [readings, unit],
  )

  const beltLenIn = useMemo(() => {
    const v = parseMeasurement(beltLenText)
    return v === null || v <= 0 ? null : toInches(v, unit)
  }, [beltLenText, unit])

  const result = useMemo(
    () => computeElongation({ nominalPitchIn: pitchIn ?? 0, pitchCount, readingsIn }),
    [pitchIn, pitchCount, readingsIn],
  )

  const verdict = result ? verdictFor(result.elongationPct, limitPct) : null
  const levelStyle = verdict ? LEVEL_STYLES[verdict.level] : null
  const recommended = pitchIn ? recommendedPitchCount(pitchIn) : null
  const nominalSpanIn = pitchIn && pitchCount ? pitchIn * pitchCount : null
  const spanIsShort = !!(recommended && pitchCount > 0 && pitchCount < recommended)
  const seriesName =
    series === CUSTOM_SERIES
      ? `Custom ${pitchIn ? formatLength(pitchIn, unit) : ''} pitch`.trim()
      : `Series ${series}`

  // ---- Handlers ----
  const handleSeriesChange = useCallback(
    (value: string) => {
      setSeries(value)
      const p = seriesPitchIn(value)
      if (p !== undefined) setPitchText(trimNum(fromInches(p, unit), PITCH_DP[unit]))
    },
    [unit],
  )

  const handlePitchChange = useCallback(
    (text: string) => {
      setPitchText(text)
      // The series label and the pitch being computed with must never
      // disagree: a card that says "Series 900" while dividing by 2.00 in is
      // a wrong answer wearing a correct label.
      const current = seriesPitchIn(series)
      if (current === undefined) return
      const v = parseMeasurement(text)
      const inches = v === null ? null : toInches(v, unit)
      if (inches === null || Math.abs(inches - current) > 0.0005) setSeries(CUSTOM_SERIES)
    },
    [series, unit],
  )

  const handleUnitChange = useCallback(
    (next: Unit) => {
      if (next === unit) return
      setPitchText((t) => convertText(t, unit, next, PITCH_DP[next]))
      setBeltLenText((t) => convertText(t, unit, next, LENGTH_DP[next]))
      setReadings((rs) => rs.map((r) => convertReading(r, unit, next)))
      setUnit(next)
    },
    [unit],
  )

  const patchReading = useCallback((id: string, patch: Partial<TapeReading>) => {
    setReadings((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const applySnapshot = useCallback((s: Snapshot) => {
    setUnit(s.unit)
    setSeries(s.series)
    setPitchText(s.pitchText)
    setCountText(s.countText)
    setLimitText(s.limitText)
    setReadings(s.readings)
    setBeltLenText(s.beltLenText)
  }, [])

  const handleReset = useCallback(() => {
    const prev: Snapshot = { unit, series, pitchText, countText, limitText, readings, beltLenText }
    setUnit('in')
    setSeries(DEFAULT_SERIES)
    setPitchText(trimNum(INITIAL_PITCH_IN, PITCH_DP.in))
    setCountText(String(recommendedPitchCount(INITIAL_PITCH_IN)))
    setLimitText(String(DEFAULT_REPLACE_LIMIT_PCT))
    setReadings([newReading()])
    setBeltLenText('')
    toast('Cleared', {
      action: { label: 'Undo', onClick: () => applySnapshot(prev) },
    })
  }, [unit, series, pitchText, countText, limitText, readings, beltLenText, applySnapshot])

  const handleCopy = useCallback(async () => {
    if (!result) return
    const text = summarizeResult({
      result,
      seriesLabel: seriesName,
      pitchCount,
      limitPct,
      unit,
      totalBeltLengthIn: beltLenIn,
    })
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Result copied')
    } catch {
      // Say what actually happened. iOS blocks the clipboard outside a user
      // gesture and in some in-app browsers, and claiming success there means
      // the rep pastes the previous thing they copied into a customer email.
      toast.error("Couldn't copy — your browser blocked it. Take a screenshot instead.")
    }
  }, [result, seriesName, pitchCount, limitPct, unit, beltLenIn])

  return (
    <div className="flex flex-col bg-background">
      {/* Page toolbar. The app shell owns the sticky header and back
          navigation; this is not a <header> and not sticky. */}
      <div className="border-b bg-card no-print">
        <div className="container flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground leading-tight">
              Belt Elongation Check
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {seriesName} · {pitchCount || '—'} pitches · replace at {limitPct}%
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!result}
              title={result ? undefined : 'Enter a tape reading first'}
              className="min-h-[44px]"
            >
              <Copy className="size-4" />
              <span className="hidden sm:inline">Copy result</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-11"
              onClick={handleReset}
              aria-label="Clear and start over"
            >
              <RotateCcw className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 container py-5 sm:py-8 space-y-6">
        {/* Why this tool exists, in one line, with a way to the instructions. */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Ruler className="size-6 text-primary shrink-0" aria-hidden="true" />
          <p className="text-base text-muted-foreground flex-1">
            No elongation ruler on you? Count the pitches, measure that span with a tape, and this
            works out how far the belt has stretched.
          </p>
          <a
            href="#how-to-measure"
            className="inline-flex items-center justify-center min-h-[48px] px-4 rounded-lg border border-border font-semibold text-brand hover:bg-secondary shrink-0"
          >
            Show me how
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-5 items-start">
          {/* ---- Inputs ---- */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">The belt and the span</CardTitle>
                <CardDescription>
                  Pick the series and this fills in the nominal pitch from the engineering manual.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <span className="block text-sm font-medium text-foreground/80 mb-1">Units</span>
                  <div
                    className="inline-flex rounded-lg border border-border overflow-hidden"
                    role="group"
                    aria-label="Units"
                  >
                    {(['in', 'mm'] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        aria-pressed={unit === u}
                        onClick={() => handleUnitChange(u)}
                        className={cn(
                          'min-h-[48px] px-6 text-base font-semibold',
                          unit === u
                            ? 'bg-brand text-white'
                            : 'bg-white text-foreground hover:bg-secondary',
                        )}
                      >
                        {u === 'in' ? 'inches' : 'mm'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-foreground/80 mb-1">
                      Belt series
                    </span>
                    <Select value={series} onValueChange={handleSeriesChange}>
                      <SelectTrigger
                        className="h-12 min-h-[48px] w-full text-base"
                        aria-label="Belt series"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[50vh]">
                        {BELT_SERIES.map((s) => (
                          <SelectItem key={s.series} value={s.series} className="min-h-[44px]">
                            {seriesLabel(s)}
                          </SelectItem>
                        ))}
                        <SelectItem value={CUSTOM_SERIES} className="min-h-[44px]">
                          Other / custom pitch
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="be-pitch"
                      className="text-sm font-medium text-foreground/80 mb-1"
                    >
                      Nominal pitch ({unit})
                    </Label>
                    <Input
                      id="be-pitch"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={pitchText}
                      onChange={(e) => handlePitchChange(e.target.value)}
                      className="font-mono-num h-12 min-h-[48px] text-base"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Type over it and the series switches to custom.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="be-count"
                      className="text-sm font-medium text-foreground/80 mb-1"
                    >
                      Pitches you counted
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-12 shrink-0"
                        onClick={() => setCountText(String(Math.max(1, pitchCount - 1)))}
                        aria-label="One fewer pitch"
                      >
                        <Minus className="size-5" />
                      </Button>
                      <Input
                        id="be-count"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={countText}
                        onChange={(e) => setCountText(e.target.value)}
                        className="font-mono-num h-12 min-h-[48px] text-base text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-12 shrink-0"
                        onClick={() => setCountText(String(pitchCount + 1))}
                        aria-label="One more pitch"
                      >
                        <Plus className="size-5" />
                      </Button>
                    </div>
                    {/* The single most useful piece of advice in the tool: a
                        short span turns tape error into fake elongation. */}
                    {spanIsShort ? (
                      <p className="text-sm text-warning-orange mt-1 flex flex-wrap items-center gap-x-2">
                        <span>
                          Short span — a 1/16 in misread is ±
                          {(((1 / 16) / (pitchCount * (pitchIn ?? 1))) * 100).toFixed(2)}% here.
                        </span>
                        <button
                          type="button"
                          onClick={() => setCountText(String(recommended))}
                          className="font-semibold text-brand underline min-h-[32px]"
                        >
                          Use {recommended}
                        </button>
                      </p>
                    ) : (
                      recommended && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {recommended}+ pitches keeps tape error under {TARGET_TAPE_ERROR_PCT}%.
                        </p>
                      )
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="be-limit"
                      className="text-sm font-medium text-foreground/80 mb-1"
                    >
                      Replace at (%)
                    </Label>
                    <Input
                      id="be-limit"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={limitText}
                      onChange={(e) => setLimitText(e.target.value)}
                      className="font-mono-num h-12 min-h-[48px] text-base"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Not an Intralox figure — confirm with Modular TSG.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tape readings</CardTitle>
                <CardDescription>
                  Measure across those {pitchCount || '—'} pitches. Two or three readings from
                  different parts of the belt get averaged.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* What the blade should say. A rep can use this without
                    typing a reading at all. */}
                {nominalSpanIn && (
                  <div>
                    <span className="block text-sm font-medium text-foreground/80 mb-2">
                      What the tape should read across {pitchCount} pitches
                    </span>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        { label: 'Brand new (0%)', pct: 0, tone: 'green' as const },
                        {
                          label: `Broken in (${BREAK_IN_PCT}%)`,
                          pct: BREAK_IN_PCT,
                          tone: 'green' as const,
                        },
                        { label: `Your limit (${limitPct}%)`, pct: limitPct, tone: 'red' as const },
                      ].map((t) => (
                        <div
                          key={t.label}
                          className={cn(
                            'rounded-lg border px-3 py-2',
                            t.tone === 'green'
                              ? 'border-savings-green/30 bg-savings-green/5'
                              : 'border-destructive/30 bg-destructive/5',
                          )}
                        >
                          <div className="text-sm text-muted-foreground">{t.label}</div>
                          <div className="font-mono-num text-lg font-semibold text-foreground">
                            {formatForTape(spanAtPct(nominalSpanIn, t.pct), unit)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <ReadingsField
                  readings={readings}
                  unit={unit}
                  onPatch={patchReading}
                  onAdd={() => setReadings((rs) => [...rs, newReading()])}
                  onRemove={(id) => setReadings((rs) => rs.filter((r) => r.id !== id))}
                />
              </CardContent>
            </Card>

          </div>

          {/* ---- Result ---- */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Elongation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4" aria-live="polite">
                {result && verdict && levelStyle ? (
                  <>
                    <div>
                      <div
                        className={cn(
                          'font-mono-num text-5xl font-semibold leading-none',
                          levelStyle.text,
                        )}
                      >
                        {result.elongationPct.toFixed(2)}%
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 font-mono-num">
                        ± {result.precisionPct.toFixed(2)}% from reading the tape to 1/16 in
                      </div>
                    </div>

                    <div
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-base font-semibold',
                        levelStyle.chip,
                      )}
                    >
                      <span className={cn('size-2.5 rounded-full', levelStyle.dot)} aria-hidden="true" />
                      {verdict.headline}
                    </div>
                    <p className="text-base text-muted-foreground">{verdict.detail}</p>

                    <ElongationGauge
                      elongationPct={result.elongationPct}
                      limitPct={limitPct}
                      level={verdict.level}
                    />

                    {readingsDisagree(result) && (
                      <p className="flex gap-2 rounded-lg border border-warning-orange/30 bg-warning-orange/10 p-3 text-base text-foreground">
                        <TriangleAlert
                          className="size-5 shrink-0 text-warning-orange"
                          aria-hidden="true"
                        />
                        <span>
                          Your readings are {formatLength(result.spreadIn, unit)} apart — further
                          than the tape can explain. That is usually a miscounted pitch, so check
                          the count before you use this number.
                        </span>
                      </p>
                    )}

                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-base border-t border-border pt-4">
                      <dt className="text-muted-foreground">Nominal span</dt>
                      <dd className="font-mono-num text-right">
                        {formatLength(result.nominalSpanIn, unit)}
                      </dd>
                      <dt className="text-muted-foreground">
                        Measured{result.readingCount > 1 ? ` (avg of ${result.readingCount})` : ''}
                      </dt>
                      <dd className="font-mono-num text-right">
                        {formatLength(result.measuredSpanIn, unit)}
                      </dd>
                      <dt className="text-muted-foreground">Actual pitch</dt>
                      <dd className="font-mono-num text-right">
                        {formatLength(result.actualPitchIn, unit)}
                      </dd>
                      <dt className="text-muted-foreground">Nominal pitch</dt>
                      <dd className="font-mono-num text-right">
                        {formatLength(result.nominalSpanIn / pitchCount, unit)}
                      </dd>
                    </dl>

                    <Button
                      type="button"
                      onClick={handleCopy}
                      className="w-full min-h-[48px] text-base"
                    >
                      <Copy className="size-4" />
                      Copy result
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-base text-muted-foreground">
                      {pitchIn && pitchCount
                        ? 'Enter a tape reading and the elongation appears here.'
                        : 'Pick a series and how many pitches you counted, then enter a tape reading.'}
                    </p>
                    <ElongationGauge elongationPct={null} limitPct={limitPct} level={null} />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Whole belt, optional</CardTitle>
                <CardDescription>
                  How much the complete belt has grown, and whether the take-up can absorb it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="be-belt-len" className="text-sm font-medium text-foreground/80 mb-1">
                  Total belt length ({unit})
                </Label>
                <Input
                  id="be-belt-len"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={beltLenText}
                  onChange={(e) => setBeltLenText(e.target.value)}
                  placeholder="From the belt drawing, or pitch count × pitch"
                  className="font-mono-num h-12 min-h-[48px] text-base max-w-xs"
                />
                {result && beltLenIn && pitchIn && (
                  <p className="text-base text-foreground mt-3">
                    At {result.elongationPct.toFixed(2)}%, a {formatLength(beltLenIn, unit)} belt has
                    grown{' '}
                    <strong className="font-semibold">
                      {formatLength(growthOverBeltIn(beltLenIn, result.elongationPct), unit)}
                    </strong>{' '}
                    — about{' '}
                    {Math.abs(pitchesGained(beltLenIn, result.elongationPct, pitchIn) ?? 0).toFixed(
                      1,
                    )}{' '}
                    pitches. Check the take-up has that much travel left.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <MeasureGuide recommendedPitches={recommended} />

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">The maths.</span> Elongation % =
            (measured span − pitches × nominal pitch) ÷ (pitches × nominal pitch) × 100.
          </p>
          <p>
            <span className="font-semibold text-foreground">Where the numbers come from.</span>{' '}
            Nominal pitches are from the 2026 MPB Engineering Manual. Break-in growth of 0.5–1% is
            normal (manual p. 494). The manual does not publish a replacement limit, so the 3%
            default is a starting point only — confirm the limit with Modular TSG before you quote
            it to a customer. For ThermoDrive, use the lug pitch and treat the result as a reference
            rather than a specification.
          </p>
          <p>
            Nothing on this page is saved. It is a calculator, not a record — copy the result if you
            need to keep it.
          </p>
        </div>
      </div>

      <footer className="border-t py-4 no-print">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center">
            Intralox Belt Elongation Check — For internal use only
          </p>
        </div>
      </footer>
    </div>
  )
}
