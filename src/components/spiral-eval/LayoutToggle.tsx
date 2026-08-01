import { useLocation } from 'wouter'
import { List, FileText } from 'lucide-react'
import { setFormLayout, type FormLayout } from '../../lib/formLayout'
import { cn } from '../../lib/utils'

interface Props {
  current: FormLayout
  assessmentId: string
}

/**
 * Switch between the section-by-section checklist and the whole form on one
 * page. The choice is remembered, so whichever a rep prefers is what opening
 * an evaluation gives them next time.
 */
export function LayoutToggle({ current, assessmentId }: Props) {
  const [, navigate] = useLocation()

  function choose(layout: FormLayout) {
    if (layout === current) return
    setFormLayout(layout)
    navigate(layout === 'long' ? `/spiral-eval/${assessmentId}/all` : `/spiral-eval/${assessmentId}`)
  }

  const options: { value: FormLayout; label: string; icon: typeof List }[] = [
    { value: 'sections', label: 'One section at a time', icon: List },
    { value: 'long', label: 'All on one page', icon: FileText },
  ]

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">How do you want to fill this in?</p>
      <div className="flex gap-2" role="group" aria-label="Form layout">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => choose(o.value)}
            aria-pressed={current === o.value}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-3 rounded-lg border text-base font-medium',
              current === o.value
                ? 'border-brand bg-blue-50 text-brand ring-1 ring-brand'
                : 'border-gray-400 bg-white text-gray-800 hover:bg-gray-50',
            )}
          >
            <o.icon className="size-4 shrink-0" aria-hidden="true" />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
