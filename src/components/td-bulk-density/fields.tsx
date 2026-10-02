// Form controls for the bulk density steps. 48px targets and 16px text so
// iOS Safari doesn't zoom on focus; helper text always visible (no hover).
import type { ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const label = 'block text-sm font-medium text-foreground/80 mb-1'

export function NumberField({
  id,
  title,
  unit,
  value,
  onChange,
  helper,
  problem,
  optional,
  placeholder,
  inputMode = 'decimal',
}: {
  id: string
  title: string
  unit?: string
  value: string
  onChange: (v: string) => void
  helper?: ReactNode
  /** Shown in place of the helper, in warning colour. */
  problem?: ReactNode
  optional?: boolean
  placeholder?: string
  inputMode?: 'decimal' | 'numeric'
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {title}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      <div className="flex items-stretch">
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={problem ? true : undefined}
          aria-describedby={helper || problem ? `${id}-help` : undefined}
          className={cn(
            'font-mono-num w-full min-w-0 h-12 px-4 text-base bg-white border outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring/60',
            unit ? 'rounded-l-lg border-r-0' : 'rounded-lg',
            problem ? 'border-warning-orange' : 'border-gray-400',
          )}
        />
        {unit && (
          <span className="inline-flex items-center px-3 rounded-r-lg border border-gray-400 bg-secondary text-base text-muted-foreground shrink-0">
            {unit}
          </span>
        )}
      </div>
      {(problem || helper) && (
        <p
          id={`${id}-help`}
          className={cn('text-sm mt-1', problem ? 'text-warning-orange' : 'text-muted-foreground')}
        >
          {problem ?? helper}
        </p>
      )}
    </div>
  )
}

export interface Choice<T extends string> {
  value: T
  label: ReactNode
  /** Second line under the label. */
  detail?: ReactNode
  disabled?: boolean
  /** Why it's disabled, always shown -- not a tooltip. */
  reason?: string
  image?: string
}

export function ChoiceButtons<T extends string>({
  title,
  value,
  options,
  onChange,
  columns = 'auto',
}: {
  title: string
  value: T
  options: Choice<T>[]
  onChange: (v: T) => void
  columns?: 'auto' | 2 | 3 | 4
}) {
  return (
    <fieldset>
      <legend className={label}>{title}</legend>
      <div
        className={cn(
          'grid gap-2',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-3',
          columns === 4 && 'grid-cols-2 sm:grid-cols-4',
          columns === 'auto' && 'grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]',
        )}
      >
        {options.map((o) => {
          const selected = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              disabled={o.disabled}
              onClick={() => onChange(o.value)}
              className={cn(
                'min-h-[48px] rounded-lg border px-3 py-2 text-left text-base transition-colors',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                selected
                  ? 'border-brand bg-blue-50 text-brand ring-1 ring-brand font-semibold'
                  : 'border-gray-400 bg-white text-gray-800 hover:border-gray-600',
              )}
            >
              {o.image && (
                <img
                  src={o.image}
                  alt=""
                  className="w-full aspect-[4/3] object-cover rounded-md mb-2 bg-secondary"
                  loading="lazy"
                />
              )}
              <span className="block leading-tight">{o.label}</span>
              {o.detail && (
                <span className="block text-sm font-normal text-muted-foreground mt-0.5">
                  {o.detail}
                </span>
              )}
              {o.disabled && o.reason && (
                <span className="block text-sm font-normal text-warning-orange mt-0.5">{o.reason}</span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function SelectField({
  id,
  title,
  value,
  onChange,
  options,
  placeholder = 'Choose…',
  helper,
}: {
  id: string
  title: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  helper?: ReactNode
}) {
  return (
    <div>
      <span id={`${id}-label`} className={label}>
        {title}
      </span>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          aria-labelledby={`${id}-label`}
          className="h-12 min-h-[48px] w-full text-base bg-white border-gray-400"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[50vh]">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="min-h-[44px] text-base">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helper && <p className="text-sm text-muted-foreground mt-1">{helper}</p>}
    </div>
  )
}

export function CheckField({
  id,
  title,
  checked,
  onChange,
  helper,
}: {
  id: string
  title: string
  checked: boolean
  onChange: (v: boolean) => void
  helper?: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 min-h-[48px]">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="size-6 mt-1"
      />
      <label htmlFor={id} className="text-base leading-snug cursor-pointer">
        {title}
        {helper && <span className="block text-sm text-muted-foreground mt-0.5">{helper}</span>}
      </label>
    </div>
  )
}

/** A figure from the engineering manual, with its caption and page. */
export function ManualFigure({ src, caption }: { src: string; caption: string }) {
  return (
    <figure className="rounded-lg border border-border bg-white p-2">
      <img src={src} alt={caption} className="w-full h-auto" loading="lazy" />
      <figcaption className="text-sm text-muted-foreground mt-1">{caption}</figcaption>
    </figure>
  )
}

export function SectionNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground rounded-lg bg-secondary px-3 py-2">{children}</p>
}
