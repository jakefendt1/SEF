import { Link } from 'wouter'
import type { Control } from 'react-hook-form'
import { Check, ChevronRight } from 'lucide-react'
import type { FormValues } from '../../schema/formSchema'
import { getSection } from '../../schema/sectionMap'
import type { Completeness } from '../../lib/completeness'
import { cn } from '../../lib/utils'

interface Props {
  assessmentId: string
  control: Control<FormValues>
  completeness: Completeness
  isSubmitting: boolean
  onSubmit: () => void
}

/**
 * The last screen: exactly what is still unanswered, in plain words, each one
 * a tap away from the field that fixes it. Submitting is always allowed --
 * anything left blank is reported honestly rather than blocking a rep who is
 * standing in a freezer.
 */
export function ReviewScreen({ assessmentId, completeness, isSubmitting, onSubmit }: Props) {
  const base = `/spiral-eval/${assessmentId}`
  const { missing, deferredCount, filled, total, canSubmit } = completeness

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto pb-12">
      <h2 className="text-2xl font-semibold text-gray-900">Review &amp; finish</h2>

      {missing.length === 0 ? (
        <div className="mt-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <Check className="size-6 text-green-700 shrink-0" aria-hidden="true" />
          <p className="text-base text-green-900">
            Everything required is answered — {filled} of {total}.
            {deferredCount > 0 && ` ${deferredCount} marked to measure later.`}
          </p>
        </div>
      ) : (
        <>
          <p className="text-base text-gray-700 mt-2">
            {missing.length === 1
              ? '1 answer is still missing.'
              : `${missing.length} answers are still missing.`}{' '}
            Tap one to go straight to it. If you can't get a measurement today, use the{' '}
            <strong className="font-semibold">"I don't know — measure later"</strong> button on that
            field and it'll stop holding you up.
          </p>
          <ul className="mt-4 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {missing.map((rule) => (
              <li key={rule.field}>
                <Link
                  href={`${base}/${getSection(rule.section).slug}`}
                  className="flex items-center gap-3 px-4 min-h-[60px] py-3 hover:bg-gray-50 active:bg-gray-100"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-base font-medium text-gray-900">{rule.label}</span>
                    <span className="block text-sm text-gray-600">
                      {getSection(rule.section).title}
                    </span>
                  </span>
                  <ChevronRight className="size-5 text-gray-400 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {!canSubmit && missing.length === 0 && (
        <p className="mt-4 text-base text-red-800 bg-red-50 border border-red-200 rounded-xl p-4">
          Everything is filled in, but something doesn't look right — check the email address and
          any "choose one" answers that conflict.
        </p>
      )}

      <div className="mt-7 space-y-3">
        {/* When something is missing, the primary action takes them to it
            rather than a disabled button that explains nothing. */}
        {missing.length > 0 ? (
          <Link
            href={`${base}/${getSection(missing[0].section).slug}`}
            className="flex items-center justify-center w-full min-h-[56px] rounded-xl bg-brand text-white text-lg font-semibold hover:bg-brand-hover active:bg-brand-active"
          >
            Go to "{missing[0].label}"
          </Link>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className={cn(
              'w-full min-h-[56px] rounded-xl text-lg font-semibold transition-colors',
              isSubmitting
                ? 'bg-gray-300 text-gray-600'
                : 'bg-brand text-white hover:bg-brand-hover active:bg-brand-active',
            )}
          >
            {isSubmitting ? 'Saving…' : 'Mark as complete'}
          </button>
        )}
        <Link
          href={base}
          className="flex items-center justify-center w-full min-h-[52px] rounded-xl border border-gray-400 text-gray-800 text-base font-semibold hover:bg-gray-50"
        >
          Back to the checklist
        </Link>
      </div>

      <p className="text-sm text-gray-600 mt-4 text-center">
        Your answers save as you type — marking it complete just flags it as finished.
        You can reopen it any time.
      </p>
    </div>
  )
}
