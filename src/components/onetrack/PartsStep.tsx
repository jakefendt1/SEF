// Step 2: the category tiles, and the list of parts inside one category.
import { useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getItem, itemsIn, refLabel, type CatalogItem, type CategoryId } from '@/lib/onetrack/catalog'
import { CATEGORIES, getCategory, type CategoryDef } from '@/lib/onetrack/categories'
import { chipOptions, filterItems, seriesLabel, normalizeSeries } from '@/lib/onetrack/filter'
import type { BomLine } from '@/lib/onetrack/bom'
import { isShaftItem } from '@/lib/onetrack/shaft'
import { cn } from '@/lib/utils'
import { ChipRow, QtyStepper, fieldLabel } from './controls'

function linesIn(lines: readonly BomLine[], category: CategoryId): number {
  return lines.filter((l) =>
    l.kind === 'wearstrip' ? category === 'wearstrip' : getItem(l.itemId)?.category === category,
  ).length
}

export function CategoryTiles({
  lines,
  onOpen,
}: {
  lines: readonly BomLine[]
  onOpen: (c: CategoryId) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xl font-semibold">2. Parts</h3>
        <p className="text-base text-muted-foreground">
          Tap a category to add parts. Wearstrip walks you through measuring the rails.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3">
        {CATEGORIES.map((c) => (
          <CategoryTile key={c.id} c={c} inBom={linesIn(lines, c.id)} onOpen={() => onOpen(c.id)} />
        ))}
      </div>
    </div>
  )
}

function CategoryTile({ c, inBom, onOpen }: { c: CategoryDef; inBom: number; onOpen: () => void }) {
  const Icon = c.icon
  const count = itemsIn(c.id).length
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative min-h-[150px] rounded-xl border border-gray-300 bg-white p-3 text-left flex flex-col hover:border-brand active:bg-blue-50"
    >
      {inBom > 0 && (
        <span className="absolute top-2 right-2 rounded-full bg-savings-green text-white text-sm font-semibold px-2.5 py-0.5">
          {inBom} in BOM
        </span>
      )}
      {c.image ? (
        <img src={c.image} alt="" className="h-20 w-full object-contain" loading="lazy" />
      ) : (
        <span className="h-20 grid place-items-center text-brand">
          <Icon className="size-12" aria-hidden="true" />
        </span>
      )}
      <span className="block mt-2 text-base font-semibold leading-tight">{c.label}</span>
      <span className="block text-sm text-muted-foreground mt-0.5">
        {c.id === 'wearstrip' ? 'Measure and quote' : `${count} part${count === 1 ? '' : 's'}`} · {c.pages}
      </span>
    </button>
  )
}

export function CategoryList({
  category,
  beltSeries,
  onBack,
  onAdd,
  onAddQuoteOnly,
  onAddShaft,
}: {
  category: CategoryId
  beltSeries: string
  onBack: () => void
  onAdd: (itemId: string, qty: number) => void
  onAddQuoteOnly: (itemId: string, note: string, qty: number) => void
  /** Shafts open the shaft spec sheet instead of a note. */
  onAddShaft: (itemId: string) => void
}) {
  const def = getCategory(category)
  const all = itemsIn(category)
  const [chips, setChips] = useState<Record<string, string | null>>({})
  const [showAllSeries, setShowAllSeries] = useState(false)
  const [quoting, setQuoting] = useState<CatalogItem | null>(null)
  const result = filterItems(all, { chips, beltSeries: showAllSeries ? null : beltSeries, bySeries: def.bySeries })
  const jobSeries = normalizeSeries(beltSeries)

  return (
    <div className="space-y-4">
      <Button variant="ghost" className="min-h-[48px] text-base text-brand -ml-3" onClick={onBack}>
        <ChevronLeft className="size-5" /> All categories
      </Button>
      <div>
        <h3 className="text-xl font-semibold">{def.label}</h3>
        <p className="text-base text-muted-foreground">{def.helper}</p>
      </div>

      {def.bySeries && jobSeries && (
        <div className="rounded-lg bg-secondary px-3 py-2 text-base flex flex-wrap items-center gap-2">
          {result.seriesApplied ? (
            <>
              <span>
                Showing <strong>{seriesLabel(result.seriesApplied)}</strong> only, from the job.
              </span>
              <button type="button" className="min-h-[44px] px-2 font-semibold text-brand underline" onClick={() => setShowAllSeries(true)}>
                Show all
              </button>
            </>
          ) : result.seriesNoMatch ? (
            <span>
              No {def.label.toLowerCase()} listed for {seriesLabel(jobSeries)} in the menu. Showing all of them.
            </span>
          ) : (
            <>
              <span>Showing every series.</span>
              <button type="button" className="min-h-[44px] px-2 font-semibold text-brand underline" onClick={() => setShowAllSeries(false)}>
                Only {seriesLabel(jobSeries)}
              </button>
            </>
          )}
        </div>
      )}

      {def.filters.map((f) => (
        <ChipRow
          key={f.key}
          label={f.label}
          options={chipOptions(all, f.key)}
          value={chips[f.key] ?? null}
          onChange={(v) => setChips((c) => ({ ...c, [f.key]: v }))}
        />
      ))}

      {result.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-base text-muted-foreground">
          Nothing matches those filters.{' '}
          <button type="button" className="min-h-[44px] font-semibold text-brand underline" onClick={() => setChips({})}>
            Clear filters
          </button>
        </p>
      ) : (
        <ul className="space-y-2">
          {result.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onAdd={(qty) =>
                isShaftItem(item.id) ? onAddShaft(item.id) : item.category === 'quoteOnly' ? setQuoting(item) : onAdd(item.id, qty)
              }
            />
          ))}
        </ul>
      )}

      <QuoteOnlyDialog
        item={quoting}
        onOpenChange={(v) => !v && setQuoting(null)}
        onSave={(note, qty) => {
          if (quoting) onAddQuoteOnly(quoting.id, note, qty)
          setQuoting(null)
        }}
      />
    </div>
  )
}

function ItemCard({ item, onAdd }: { item: CatalogItem; onAdd: (qty: number) => void }) {
  const [qty, setQty] = useState(1)
  const quoteOnly = item.category === 'quoteOnly'
  const shaft = isShaftItem(item.id)
  return (
    <li className="rounded-xl border border-gray-300 bg-white p-3 flex flex-wrap items-center gap-3">
      {item.image && (
        <img src={item.image} alt="" loading="lazy" className="w-24 h-20 object-contain rounded-md bg-white border border-border shrink-0" />
      )}
      <div className="flex-1 min-w-[12rem]">
        <p className="text-base leading-snug">{item.description}</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          <span className={cn('font-mono-num', !quoteOnly && 'font-semibold text-foreground')}>
            {item.partNumber ?? (shaft ? 'No part number: CS quotes it from the spec sheet' : 'No part number: CS quotes it')}
          </span>{' '}
          · {item.uom} · {refLabel(item)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {!quoteOnly && <QtyStepper value={qty} onChange={setQty} label={item.partNumber ?? item.description} />}
        <Button
          className="min-h-[48px] text-base bg-brand hover:bg-brand-hover"
          onClick={() => {
            onAdd(qty)
            if (!quoteOnly) {
              toast.success(`Added: ${qty} × ${item.partNumber}`)
              setQty(1)
            }
          }}
        >
          <Plus className="size-5" /> {shaft ? 'Fill in spec sheet' : quoteOnly ? 'Add…' : 'Add'}
        </Button>
      </div>
    </li>
  )
}

/** Add or edit a no-part-number line: CS needs the rep's words to price it. */
export function QuoteOnlyDialog({
  item,
  initialNote = '',
  initialQty = 1,
  editing = false,
  onOpenChange,
  onSave,
}: {
  item: CatalogItem | null
  initialNote?: string
  initialQty?: number
  editing?: boolean
  onOpenChange: (v: boolean) => void
  onSave: (note: string, qty: number) => void
}) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent>
        {item && (
          <QuoteOnlyBody
            key={item.id + initialNote}
            item={item}
            initialNote={initialNote}
            initialQty={initialQty}
            editing={editing}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function QuoteOnlyBody({
  item,
  initialNote,
  initialQty,
  editing,
  onCancel,
  onSave,
}: {
  item: CatalogItem
  initialNote: string
  initialQty: number
  editing: boolean
  onCancel: () => void
  onSave: (note: string, qty: number) => void
}) {
  const [note, setNote] = useState(initialNote)
  const [qty, setQty] = useState(initialQty)
  const [tried, setTried] = useState(false)
  const empty = !note.trim()
  return (
    <>
      <DialogHeader>
        <DialogTitle>{item.description}</DialogTitle>
        <DialogDescription className="text-base">No part number. CS quotes it from what you write here.</DialogDescription>
      </DialogHeader>
      <div>
        <label htmlFor="qo-note" className={fieldLabel}>
          What CS needs
        </label>
        <textarea
          id="qo-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={cn('w-full rounded-lg border p-3 text-base bg-white', tried && empty ? 'border-warning-orange' : 'border-gray-400')}
        />
        <p className={cn('text-sm mt-1', tried && empty ? 'text-warning-orange' : 'text-muted-foreground')}>
          {tried && empty ? 'CS can’t quote it without this.' : `${item.notePrompt}.`}
        </p>
      </div>
      <div>
        <p className={fieldLabel}>Quantity</p>
        <QtyStepper value={qty} onChange={setQty} label={item.description} />
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" className="min-h-[48px] text-base" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="min-h-[48px] text-base bg-brand hover:bg-brand-hover"
          onClick={() => {
            setTried(true)
            if (!empty) onSave(note.trim(), qty)
          }}
        >
          {editing ? 'Save' : 'Add to BOM'}
        </Button>
      </DialogFooter>
    </>
  )
}
