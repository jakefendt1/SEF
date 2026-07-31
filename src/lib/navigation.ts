// Single source of truth for the app's routes, tool metadata, and the
// back/breadcrumb chain. The shell, the dashboard, and the page titles all
// read from here so a route can't be renamed in one place and go stale in
// another.
import type { LucideIcon } from 'lucide-react'
import { ClipboardList, Calculator } from 'lucide-react'
import { getSectionBySlug } from '../schema/sectionMap'

export const ROUTES = {
  dashboard: '/',
  spiralEvalList: '/spiral-eval',
  /** Hub at :id, one screen per section, plus a "review" screen. */
  spiralEvalForm: '/spiral-eval/:id/:section?',
  aimGlide: '/aim-glide',
} as const

export interface ToolDef {
  id: string
  /** Full name, used on the dashboard card and the page header. */
  title: string
  /** Short name, used in the back button where space is tight. */
  shortTitle: string
  description: string
  href: string
  icon: LucideIcon
}

export const TOOLS: ToolDef[] = [
  {
    id: 'spiral-eval',
    title: 'Spiral Eval',
    shortTitle: 'Spiral Eval',
    description: 'Fill out a field evaluation for an Intralox spiral conveyor.',
    href: ROUTES.spiralEvalList,
    icon: ClipboardList,
  },
  {
    id: 'aim-glide',
    title: 'AIM Glide ROI Calculator',
    shortTitle: 'ROI Calculator',
    description: 'Compare cost of ownership and ROI for AIM Glide vs. a traditional slat switch.',
    href: ROUTES.aimGlide,
    icon: Calculator,
  },
]

export interface NavContext {
  /** Title of the current screen, shown in the shell sub-header. */
  title: string
  /** Where the back button goes, or null on the dashboard (nothing above it). */
  backHref: string | null
  /** Label for the back button, e.g. "Tools". */
  backLabel: string | null
}

const DASHBOARD_LABEL = 'Tools'

/**
 * Resolve the current screen's title and its parent, from the raw path.
 * Kept as a pure function of the path so it is testable without a router.
 */
export function resolveNav(path: string): NavContext {
  // Normalise: strip a trailing slash (but keep the root itself).
  const p = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path

  if (p === ROUTES.dashboard) {
    return { title: DASHBOARD_LABEL, backHref: null, backLabel: null }
  }

  if (p === ROUTES.spiralEvalList) {
    return { title: 'Spiral Eval', backHref: ROUTES.dashboard, backLabel: DASHBOARD_LABEL }
  }

  if (p.startsWith(`${ROUTES.spiralEvalList}/`)) {
    const [, , id, section] = p.split('/')

    // A section or review screen sits under the evaluation's own checklist,
    // so back goes to the checklist -- not all the way out to the list.
    if (section) {
      return {
        title: section === 'review' ? 'Review & send' : (getSectionBySlug(section)?.title ?? 'Evaluation'),
        backHref: `${ROUTES.spiralEvalList}/${id}`,
        backLabel: 'Checklist',
      }
    }

    return {
      title: 'Evaluation',
      backHref: ROUTES.spiralEvalList,
      backLabel: 'Spiral Eval',
    }
  }

  if (p === ROUTES.aimGlide) {
    return {
      title: 'AIM Glide ROI Calculator',
      backHref: ROUTES.dashboard,
      backLabel: DASHBOARD_LABEL,
    }
  }

  // Unknown route: still give the user a way home.
  return { title: 'Not found', backHref: ROUTES.dashboard, backLabel: DASHBOARD_LABEL }
}
