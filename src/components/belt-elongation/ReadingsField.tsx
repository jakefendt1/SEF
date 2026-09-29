import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X } from 'lucide-react'
import { SIXTEENTHS, formatLength, type Unit } from '@/lib/measurement'
import { readingToInches, type TapeReading } from './readings'

interface Props {
  readings: TapeReading[]
  unit: Unit
  onPatch: (id: string, patch: Partial<TapeReading>) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function ReadingsField({ readings, unit, onPatch, onAdd, onRemove }: Props) {
  return (
    <div className="space-y-3">
      {readings.map((r, i) => {
        const inches = readingToInches(r, unit)
        const wholeId = `reading-${r.id}-whole`
        return (
          <div key={r.id} className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[140px]">
              <Label htmlFor={wholeId} className="text-sm font-medium text-foreground/80">
                Reading {i + 1}
              </Label>
              <Input
                id={wholeId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={r.whole}
                onChange={(e) => onPatch(r.id, { whole: e.target.value })}
                placeholder={unit === 'in' ? 'whole inches' : 'mm'}
                className="font-mono-num h-12 min-h-[48px] text-base mt-1"
              />
            </div>

            {unit === 'in' && (
              <div className="w-[128px]">
                {/* A span, not a <label>: the control below is a listbox
                    button, and its own aria-label names it. */}
                <span className="block text-sm font-medium text-foreground/80">Fraction</span>
                <Select
                  value={String(r.sixteenths)}
                  onValueChange={(v) => onPatch(r.id, { sixteenths: Number(v) })}
                >
                  <SelectTrigger
                    className="h-12 min-h-[48px] w-full mt-1 font-mono-num"
                    aria-label={`Reading ${i + 1} — fraction of an inch`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" className="min-h-[44px]">
                      — none
                    </SelectItem>
                    {SIXTEENTHS.map((s, k) => (
                      <SelectItem key={s.label} value={String(k + 1)} className="min-h-[44px]">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2 h-12 mt-1">
              <span
                className="font-mono-num text-sm text-muted-foreground w-[92px] tabular-nums"
                aria-live="polite"
              >
                {inches === null ? '' : `= ${formatLength(inches, unit)}`}
              </span>
              {/* Never let the user delete their way down to no readings at
                  all -- the empty row is what invites the next one. */}
              {readings.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-12 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(r.id)}
                  aria-label={`Remove reading ${i + 1}`}
                >
                  <X className="size-5" />
                </Button>
              )}
            </div>
          </div>
        )
      })}

      <Button type="button" variant="outline" onClick={onAdd} className="min-h-[48px]">
        <Plus className="size-4" />
        Add another reading
      </Button>
    </div>
  )
}
