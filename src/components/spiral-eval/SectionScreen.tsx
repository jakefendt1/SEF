import { useEffect, useRef } from 'react'
import { Link } from 'wouter'
import type { Control } from 'react-hook-form'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { FormValues } from '../../schema/formSchema'
import { FORM_SECTIONS, type FormSection } from '../../schema/sectionMap'
import { getSectionProgress } from '../../lib/completeness'
import { PersonalInfoSection } from './sections/PersonalInfoSection'
import { ApplicationSection } from './sections/ApplicationSection'
import { SystemInfoSection } from './sections/SystemInfoSection'
import { SystemDetailsSection } from './sections/SystemDetailsSection'
import { ProjectInfoSection } from './sections/ProjectInfoSection'

interface Props {
  assessmentId: string
  control: Control<FormValues>
  section: FormSection
  values: Partial<FormValues>
  onLeave: () => void
}

const SECTION_COMPONENTS = {
  personal: PersonalInfoSection,
  application: ApplicationSection,
  'system-info': SystemInfoSection,
  'system-details': SystemDetailsSection,
  project: ProjectInfoSection,
} as const

/** One section, one screen. Never blocks the user from leaving. */
export function SectionScreen({ assessmentId, control, section, values, onLeave }: Props) {
  const base = `/spiral-eval/${assessmentId}`
  const index = FORM_SECTIONS.findIndex((s) => s.id === section.id)
  const next = FORM_SECTIONS[index + 1]
  const progress = getSectionProgress(values).find((p) => p.id === section.id)!
  const isQuickMode = values.mode !== 'full'
  const Body = SECTION_COMPONENTS[section.id]

  // Start each section at the top -- arriving mid-page is disorienting when
  // the previous screen was long.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [section.id])

  // Validate on the way out, so errors show up on the screen that can fix
  // them. Held in a ref because `onLeave` is a fresh closure every render --
  // as an effect dependency it would fire the "leaving" logic on every
  // keystroke instead of on actual navigation.
  const onLeaveRef = useRef(onLeave)
  useEffect(() => {
    onLeaveRef.current = onLeave
  }, [onLeave])
  useEffect(() => () => onLeaveRef.current(), [])

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto pb-10">
      <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
      <p className="text-base text-gray-600 mt-1">{section.blurb}</p>

      {progress.total > 0 && (
        <p className="text-sm font-medium text-gray-700 mt-3 bg-gray-100 rounded-lg px-3 py-2 inline-block">
          {progress.filled} of {progress.total} required answered in this section
        </p>
      )}

      <div className="mt-5">
        <Body control={control} isQuickMode={isQuickMode} />
      </div>

      <div className="mt-8 space-y-3">
        {next ? (
          <Link
            href={`${base}/${next.slug}`}
            className="flex items-center justify-center gap-1 w-full min-h-[56px] rounded-xl bg-brand text-white text-lg font-semibold hover:bg-brand-hover active:bg-brand-active"
          >
            Next: {next.title}
            <ChevronRight className="size-5" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            href={`${base}/review`}
            className="flex items-center justify-center w-full min-h-[56px] rounded-xl bg-brand text-white text-lg font-semibold hover:bg-brand-hover"
          >
            Review &amp; finish
          </Link>
        )}
        <Link
          href={base}
          className="flex items-center justify-center gap-1 w-full min-h-[52px] rounded-xl border border-gray-400 text-gray-800 text-base font-semibold hover:bg-gray-50"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          Back to the checklist
        </Link>
      </div>
    </div>
  )
}
