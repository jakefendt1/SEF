import { Link } from 'wouter'
import { ClipboardList, Calculator, ChevronRight } from 'lucide-react'
import { useAssessmentsStore } from '../../store/assessmentsStore'
import { useRoiCalculationsStore } from '../../store/roiCalculationsStore'
import { assessmentTitle } from '../../lib/assessmentTitle'
import { statusLabel } from '../../lib/statusLabels'
import { ROUTES } from '../../lib/navigation'

interface RecentItem {
  key: string
  href: string
  title: string
  meta: string
  updatedAt: number
  icon: typeof ClipboardList
}

function relativeDate(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function RecentActivity() {
  const assessments = useAssessmentsStore((s) => s.assessments)
  const assessmentsLoaded = useAssessmentsStore((s) => s.loaded)
  const calculations = useRoiCalculationsStore((s) => s.calculations)
  const roiLoaded = useRoiCalculationsStore((s) => s.loaded)

  // Don't claim "nothing here yet" before both subscriptions have answered --
  // that reads as data loss to a user who knows they saved something.
  if (!assessmentsLoaded || !roiLoaded) return null

  const items: RecentItem[] = [
    ...assessments.map((a) => ({
      key: `a-${a.id}`,
      href: `${ROUTES.spiralEvalList}/${a.id}`,
      title: assessmentTitle(a),
      meta: `Spiral Eval · ${statusLabel(a.status)}`,
      updatedAt: a.updatedAt,
      icon: ClipboardList,
    })),
    ...calculations.map((c) => ({
      key: `c-${c.id}`,
      href: ROUTES.aimGlide,
      title: c.name,
      meta: 'ROI Calculator',
      updatedAt: c.updatedAt,
      icon: Calculator,
    })),
  ]
    .sort((x, y) => y.updatedAt - x.updatedAt)
    .slice(0, 5)

  if (items.length === 0) return null

  return (
    <section className="mt-10" aria-labelledby="recent-heading">
      <h3 id="recent-heading" className="text-lg font-semibold text-gray-900 mb-3">
        Pick up where you left off
      </h3>
      <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="flex items-center gap-3 px-4 min-h-[64px] py-3 hover:bg-gray-50 active:bg-gray-100"
            >
              <item.icon className="size-5 text-gray-400 shrink-0" aria-hidden="true" />
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-gray-900 truncate">{item.title}</span>
                <span className="block text-sm text-gray-600">
                  {item.meta} · {relativeDate(item.updatedAt)}
                </span>
              </span>
              <ChevronRight className="size-5 text-gray-400 shrink-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
