import { Link } from 'wouter'
import { useController, type Control } from 'react-hook-form'
import { Check, ChevronRight, Circle, CircleAlert } from 'lucide-react'
import type { FormValues } from '../../schema/formSchema'
import { FORM_SECTIONS } from '../../schema/sectionMap'
import { getSectionProgress, type Completeness } from '../../lib/completeness'
import { assessmentTitle } from '../../lib/assessmentTitle'
import type { StoredAssessment } from '../../lib/db'
import { cn } from '../../lib/utils'
import { LayoutToggle } from './LayoutToggle'

interface Props {
  assessmentId: string
  control: Control<FormValues>
  values: Partial<FormValues>
  completeness: Completeness
  existing?: StoredAssessment
}

/**
 * The checklist hub: the home screen for one evaluation.
 *
 * Deliberately not a linear wizard. Reps fill this out in the physical order
 * they walk the spiral, so any Next/Back gating turns "I can't reach the
 * take-up yet" into a hard stop. Every section is always reachable, and
 * Review is always available and honest about what is missing.
 */
export function FormHub({ assessmentId, control, values, completeness, existing }: Props) {
  const { field: modeField } = useController({ name: 'mode', control })
  const mode = (modeField.value as string) ?? 'quick'
  const progress = getSectionProgress(values)
  const base = `/spiral-eval/${assessmentId}`

  const title = existing
    ? assessmentTitle({ title: existing.title, data: values })
    : assessmentTitle({ data: values })

  // First section that still needs something -- where "continue" goes.
  const nextSection =
    FORM_SECTIONS.find((s) => {
      const p = progress.find((x) => x.id === s.id)
      return p && p.total > 0 && !p.complete
    }) ?? FORM_SECTIONS[0]

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto pb-12">
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>

      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-base font-medium text-gray-800">
            {completeness.filled} of {completeness.total} answered
          </span>
          <span className="text-base font-semibold text-gray-900">{completeness.pct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              completeness.canSubmit ? 'bg-green-600' : 'bg-blue-700',
            )}
            style={{ width: `${completeness.pct}%` }}
          />
        </div>
        {completeness.deferredCount > 0 && (
          <p className="text-sm text-amber-800 mt-2">
            {completeness.deferredCount} marked to measure later.
          </p>
        )}
      </div>

      {/* Quick / Full */}
      <fieldset className="mt-5">
        <legend className="text-base font-medium text-gray-800 mb-1">How much detail?</legend>
        <p className="text-sm text-gray-600 mb-2">
          Quick asks the essentials. Full adds the extra questions engineering likes to have.
        </p>
        <div className="flex gap-2">
          {(['quick', 'full'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => modeField.onChange(m)}
              aria-pressed={mode === m}
              className={cn(
                'flex-1 min-h-[52px] rounded-lg border text-base font-medium capitalize',
                mode === m
                  ? 'border-brand bg-blue-50 text-brand ring-1 ring-brand'
                  : 'border-gray-400 bg-white text-gray-800',
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <LayoutToggle current="sections" assessmentId={assessmentId} />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mt-7 mb-2">Sections</h3>
      <ul className="space-y-2">
        {FORM_SECTIONS.map((section) => {
          const p = progress.find((x) => x.id === section.id)!
          return (
            <li key={section.id}>
              <Link
                href={`${base}/${section.slug}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 min-h-[76px] hover:border-blue-400 active:bg-gray-50"
              >
                <span
                  className={cn(
                    'size-9 rounded-full flex items-center justify-center shrink-0',
                    p.complete
                      ? 'bg-green-100 text-green-800'
                      : p.total === 0 || p.untouched
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-amber-100 text-amber-900',
                  )}
                  aria-hidden="true"
                >
                  {p.complete ? (
                    <Check className="size-5" strokeWidth={3} />
                  ) : p.total === 0 ? (
                    // Nothing required here -- a warning icon would be a lie.
                    <Circle className="size-4" />
                  ) : (
                    <CircleAlert className="size-5" />
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-semibold text-gray-900">
                    {section.title}
                  </span>
                  <span className="block text-sm text-gray-600">
                    {p.total === 0
                      ? 'Optional'
                      : p.complete
                        ? 'All answered'
                        : `${p.filled} of ${p.total} answered`}
                  </span>
                </span>
                <ChevronRight className="size-5 text-gray-400 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 space-y-3">
        <Link
          href={`${base}/${nextSection.slug}`}
          className="flex items-center justify-center w-full min-h-[56px] rounded-xl bg-brand text-white text-lg font-semibold hover:bg-brand-hover active:bg-brand-active"
        >
          {completeness.filled === 0 ? 'Start' : 'Continue where you left off'}
        </Link>
        <Link
          href={`${base}/review`}
          className="flex items-center justify-center w-full min-h-[52px] rounded-xl border border-gray-400 text-gray-800 text-base font-semibold hover:bg-gray-50"
        >
          Review &amp; finish
        </Link>
      </div>
    </div>
  )
}
