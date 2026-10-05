// Inputs for the OneTrack screens. 48px targets and 16px text so iOS Safari
// doesn't zoom on focus; helper text always visible (no hover).
import { useState, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MM_PER_IN, SIXTEENTHS, parseMeasurement, type Unit } from '@/lib/measurement'
import { readingToInches } from '@/components/belt-elongation/readings'
import { cn } from '@/lib/utils'

export const fieldLabel = 'block text-sm font-medium text-foreground/80 mb-1'
const inputBox =
  'w-full min-w-0 h-12 px-4 text-base bg-white border border-gray-400 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60'

export function TextField({
  id,
  title,
  value,
  onChange,
  helper,
  problem,
  optional,
  type = 'text',
  list,
}: {
  id: string
  title: string
  value: string
  onChange: (v: string) => void
  helper?: ReactNode
  problem?: ReactNode
  optional?: boolean
  type?: 'text' | 'date'
  list?: string
}) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>
        {title}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        list={list}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={problem ? true : undefined}
        className={cn(inputBox, problem && 'border-warning-orange')}
      />
      {(problem || helper) && (
        <p className={cn('text-sm mt-1', problem ? 'text-warning-orange' : 'text-muted-foreground')}>{problem ?? helper}</p>
      )}
    </div>
  )
}

/** Whole-number quantity with big − / + buttons. */
export function QtyStepper({
  value,
  onChange,
  label,
  min = 1,
}: {
  value: number
  onChange: (n: number) => void
  label: string
  min?: number
}) {
  const [text, setText] = useState(String(value))
  const [shown, setShown] = useState(value)
  // Keep the box in step when the value changes from outside (e.g. the − button).
  if (shown !== value) {
    setShown(value)
    setText(String(value))
  }
  const btn =
    'size-12 grid place-items-center rounded-lg border border-gray-400 bg-white text-foreground hover:bg-secondary disabled:opacity-40'
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer: ${label}`}>
        <Minus className="size-5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Quantity: ${label}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const n = Number.parseInt(e.target.value, 10)
          if (Number.isFinite(n) && n >= min) onChange(n)
        }}
        onBlur={() => setText(String(value))}
        className="font-mono-num w-16 h-12 text-center text-base bg-white border border-gray-400 rounded-lg"
      />
      <button type="button" className={btn} onClick={() => onChange(value + 1)} aria-label={`More: ${label}`}>
        <Plus className="size-5" />
      </button>
    </div>
  )
}

/**
 * A profile dimension. Inches are typed as whole units plus a fraction from a
 * list: the iPad's decimal keypad has no "/" (see belt-elongation/readings.ts).
 */
export function DimInput({
  id,
  title,
  valueIn,
  onChange,
  unit,
  helper,
  problem,
}: {
  id: string
  title: ReactNode
  valueIn: number | null | undefined
  onChange: (v: number | null) => void
  unit: Unit
  helper?: ReactNode
  problem?: ReactNode
}) {
  const [state, setState] = useState(() => initialReading(valueIn, unit))
  const update = (patch: Partial<typeof state>) => {
    const next = { ...state, ...patch }
    setState(next)
    onChange(readingToInches({ id, ...next }, unit))
  }
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>
        {title}
      </label>
      <div className="flex gap-2">
        <div className="flex items-stretch flex-1 min-w-0">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={state.whole}
            placeholder={unit === 'in' ? 'whole in' : 'mm'}
            onChange={(e) => update({ whole: e.target.value })}
            className={cn(inputBox, 'font-mono-num rounded-r-none border-r-0', problem && 'border-warning-orange')}
          />
          <span className="inline-flex items-center px-3 rounded-r-lg border border-gray-400 bg-secondary text-base text-muted-foreground shrink-0">
            {unit}
          </span>
        </div>
        {unit === 'in' && (
          <Select value={String(state.sixteenths)} onValueChange={(v) => update({ sixteenths: Number(v) })}>
            <SelectTrigger className="h-12 min-h-[48px] w-[104px] font-mono-num bg-white border-gray-400" aria-label="Fraction of an inch">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0" className="min-h-[44px]">
                + 0
              </SelectItem>
              {SIXTEENTHS.map((s, k) => (
                <SelectItem key={s.label} value={String(k + 1)} className="min-h-[44px]">
                  + {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {(problem || helper) && (
        <p className={cn('text-sm mt-1', problem ? 'text-warning-orange' : 'text-muted-foreground')}>{problem ?? helper}</p>
      )}
    </div>
  )
}

function initialReading(valueIn: number | null | undefined, unit: Unit) {
  if (typeof valueIn !== 'number') return { whole: '', sixteenths: 0 }
  if (unit === 'mm') return { whole: String(Number((valueIn * MM_PER_IN).toFixed(1))), sixteenths: 0 }
  const whole = Math.floor(valueIn)
  const sixteenths = (valueIn - whole) * 16
  return Math.abs(sixteenths - Math.round(sixteenths)) < 1e-6
    ? { whole: String(whole), sixteenths: Math.round(sixteenths) % 16 }
    : { whole: String(Number(valueIn.toFixed(3))), sixteenths: 0 }
}

/** A length of rail: feet + inches, or millimetres. */
export function RunInput({
  id,
  title,
  valueIn,
  onChange,
  unit,
}: {
  id: string
  title: ReactNode
  valueIn: number | null | undefined
  onChange: (v: number | null) => void
  unit: Unit
}) {
  const [ft, setFt] = useState(() => (typeof valueIn === 'number' && unit === 'in' ? String(Math.floor(valueIn / 12)) : ''))
  const [inch, setInch] = useState(() =>
    typeof valueIn === 'number'
      ? unit === 'in'
        ? String(Number((valueIn - Math.floor(valueIn / 12) * 12).toFixed(3)))
        : String(Number((valueIn * MM_PER_IN).toFixed(0)))
      : '',
  )
  const emit = (f: string, i: string) => {
    if (unit === 'mm') {
      const mm = parseMeasurement(i)
      onChange(mm === null ? null : mm / MM_PER_IN)
      return
    }
    const feet = f.trim() ? parseMeasurement(f) : 0
    const inches = i.trim() ? parseMeasurement(i) : 0
    if (feet === null || inches === null || (!f.trim() && !i.trim())) onChange(null)
    else onChange(feet * 12 + inches)
  }
  const box = (value: string, set: (v: string) => void, suffix: string, aria: string, idAttr?: string) => (
    <div className="flex items-stretch flex-1 min-w-0">
      <input
        id={idAttr}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={aria}
        value={value}
        onChange={(e) => set(e.target.value)}
        className={cn(inputBox, 'font-mono-num rounded-r-none border-r-0')}
      />
      <span className="inline-flex items-center px-3 rounded-r-lg border border-gray-400 bg-secondary text-base text-muted-foreground shrink-0">
        {suffix}
      </span>
    </div>
  )
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>
        {title}
      </label>
      <div className="flex gap-2">
        {unit === 'in' ? (
          <>
            {box(ft, (v) => { setFt(v); emit(v, inch) }, 'ft', 'Feet', id)}
            {box(inch, (v) => { setInch(v); emit(ft, v) }, 'in', 'Inches')}
          </>
        ) : (
          box(inch, (v) => { setInch(v); emit('', v) }, 'mm', 'Millimetres', id)
        )}
      </div>
    </div>
  )
}

/** One row of single-select filter chips, with "All". */
export function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string | null
  onChange: (v: string | null) => void
}) {
  if (options.length < 2) return null
  const chip = (text: string, selected: boolean, onClick: () => void) => (
    <button
      key={text}
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'min-h-[48px] px-4 rounded-full border text-base whitespace-nowrap',
        selected ? 'border-brand bg-blue-50 text-brand font-semibold ring-1 ring-brand' : 'border-gray-400 bg-white text-gray-800',
      )}
    >
      {text}
    </button>
  )
  return (
    <div>
      <p className={fieldLabel}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {chip('All', value === null, () => onChange(null))}
        {options.map((o) => chip(o, value === o, () => onChange(value === o ? null : o)))}
      </div>
    </div>
  )
}
