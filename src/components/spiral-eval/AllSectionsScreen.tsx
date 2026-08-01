import { Link } from 'wouter'
import type { Control } from 'react-hook-form'
import type { FormValues } from '../../schema/formSchema'
import { FORM_SECTIONS } from '../../schema/sectionMap'
import type { Completeness } from '../../lib/completeness'
import { cn } from '../../lib/utils'
import { PersonalInfoSection } from './sections/PersonalInfoSection'
import { ApplicationSection } from './sections/ApplicationSection'
import { SystemInfoSection } from './sections/SystemInfoSection'
import { SystemDetailsSection } from './sections/SystemDetailsSection'
import { ProjectInfoSection } from './sections/ProjectInfoSection'
import { LayoutToggle } from './LayoutToggle'

interface Props {
  assessmentId: string
  control: Control<FormValues>
  values: Partial<FormValues>
  completeness: Completeness
  isSubmitting: boolean
  onSubmit: () => void
}

const SECTION_COMPONENTS = {
  personal: PersonalInfoSection,
  application: ApplicationSection,
  'system-info': SystemInfoSection,
  'system-details': SystemDetailsSection,
  project: ProjectInfoSection,
} as const

/**
 * The whole evaluation on one page, for people who would rather scroll than
 * tap between screens.
 *
 * Shares the single `useForm` instance in SpiralEvalFormShell with the
 * section-by-section view, so a rep can switch between the two mid-evaluation
 * and lose nothing.
 */
export function AllSectionsScreen({
  assessmentId,
  control,
  values,
  completeness,
  isSubmitting,
  onSubmit,
}: Props) {
  const isQuickMode = values.mode !== 'full'
  const base = `/spiral-eval/${assessmentId}`

  return (
    <div className="pb-32">
      {/* Progress stays visible on a page this long. Sits below the app
          header using the shared scale, so it can't slide underneath it. */}
      <div className="sticky top-0 z-[var(--z-page-sticky)] bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-gray-800">
              {completeness.filled} of {completeness.total} answered
            </span>
            <span className="font-semibold text-gray-900">{completeness.pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                completeness.canSubmit ? 'bg-green-600' : 'bg-blue-700',
              )}
              style={{ width: `${completeness.pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-8">
        <LayoutToggle current="long" assessmentId={assessmentId} />

        {FORM_SECTIONS.map((section) => {
          const Body = SECTION_COMPONENTS[section.id]
          return (
            <section key={section.id} id={section.slug} className="scroll-mt-28">
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              <p className="text-base text-gray-600 mt-1 mb-4">{section.blurb}</p>
              <Body control={control} isQuickMode={isQuickMode} />
            </section>
          )
        })}

        <div className="space-y-3 pt-2">
          {completeness.missing.length > 0 && (
            <p className="text-base text-gray-700">
              {completeness.missing.length === 1
                ? '1 answer is still missing.'
                : `${completeness.missing.length} answers are still missing.`}{' '}
              <Link href={`${base}/review`} className="text-brand underline font-medium">
                See the list
              </Link>
            </p>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || completeness.missing.length > 0}
            className={cn(
              'w-full min-h-[56px] rounded-xl text-lg font-semibold transition-colors',
              isSubmitting || completeness.missing.length > 0
                ? 'bg-gray-300 text-gray-600'
                : 'bg-brand text-white hover:bg-brand-hover active:bg-brand-active',
            )}
          >
            {isSubmitting ? 'Saving…' : 'Mark as complete'}
          </button>
          <p className="text-sm text-gray-600 text-center">
            Your answers save as you type. Marking it complete just flags it as finished — you can
            reopen it any time.
          </p>
        </div>
      </div>
    </div>
  )
}
