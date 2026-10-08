// Single source of truth for the app's routes, tool metadata, and the
// back/breadcrumb chain. The shell, the dashboard, and the page titles all
// read from here so a route can't be renamed in one place and go stale in
// another.
import type { LucideIcon } from 'lucide-react'
import { ClipboardList, Calculator, Layers, Package, Rows3, Ruler } from 'lucide-react'
import { getSectionBySlug } from '../schema/sectionMap'

export const ROUTES = {
  dashboard: '/',
  spiralEvalList: '/spiral-eval',
  /** Hub at :id, one screen per section, plus a "review" screen. */
  spiralEvalForm: '/spiral-eval/:id/:section?',
  aimGlide: '/aim-glide',
  beltElongation: '/belt-elongation',
  tdBulkDensity: '/td-bulk-density',
  /** A saved run, reopened. */
  tdBulkDensityRun: '/td-bulk-density/:id',
  tdConfigurator: '/td-configurator',
  /** A saved belt, reopened. */
  tdConfiguratorSaved: '/td-configurator/:id',
  onetrack: '/onetrack',
  /** A saved BOM, reopened. */
  onetrackBom: '/onetrack/:id',
  /** Manage access: admins only. */
  admin: '/admin',
} as const

export interface ToolDef {
  id: string
  /** Full name, used on the dashboard card and the page header. */
  title: string
  /** Short name, used in the back button where space is tight. */
  shortTitle: string
  description: string
  /** Who built it, shown on the dashboard card. */
  credit: string
  href: string
  icon: LucideIcon
}

export const TOOLS: ToolDef[] = [
  {
    id: 'spiral-eval',
    title: 'Spiral Eval',
    shortTitle: 'Spiral Eval',
    description: 'Fill out a field evaluation for an Intralox spiral conveyor.',
    credit: 'Developed by Jake Fendt',
    href: ROUTES.spiralEvalList,
    icon: ClipboardList,
  },
  {
    id: 'aim-glide',
    title: 'AIM Glide ROI Calculator',
    shortTitle: 'ROI Calculator',
    description: 'Compare cost of ownership and ROI for AIM Glide vs. a traditional slat switch.',
    credit: 'Developed by Jake Fendt and Helen Xi',
    href: ROUTES.aimGlide,
    icon: Calculator,
  },
  {
    id: 'belt-elongation',
    title: 'Belt Elongation Check',
    shortTitle: 'Elongation',
    description:
      "Measure belt stretch with a tape measure when you haven't got the elongation ruler.",
    credit: 'Developed by Jake Fendt',
    href: ROUTES.beltElongation,
    icon: Ruler,
  },
  {
    id: 'td-bulk-density',
    title: 'ThermoDrive Bulk Density Calculator',
    shortTitle: 'Bulk Density',
    description:
      'How much a flighted ThermoDrive incline carries, and what sidewalls or guards add, for a bulk product.',
    credit: 'Developed by Jake Fendt',
    href: ROUTES.tdBulkDensity,
    icon: Layers,
  },
  {
    id: 'td-configurator',
    title: 'ThermoDrive Belt Configurator',
    shortTitle: 'Belt Configurator',
    description:
      "Lay out a ThermoDrive belt (flights, notches, sidewalls, V-guides, splice, repair and sections) and check it against fabrication rules.",
    credit: 'Developed by Patrick Madore',
    href: ROUTES.tdConfigurator,
    icon: Rows3,
  },
  {
    id: 'onetrack',
    title: 'OneTrack BOM Builder',
    shortTitle: 'OneTrack BOM',
    description: 'Pick OneTrack parts on the floor and send CS a part-numbered BOM to quote.',
    credit: 'Developed by Jake Fendt, Jeremy Shall and Adam Richardson',
    href: ROUTES.onetrack,
    icon: Package,
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
        title:
          section === 'review'
            ? 'Review & finish'
            : section === 'all'
              ? 'Full form'
              : (getSectionBySlug(section)?.title ?? 'Evaluation'),
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

  if (p === ROUTES.beltElongation) {
    return {
      title: 'Belt Elongation Check',
      backHref: ROUTES.dashboard,
      backLabel: DASHBOARD_LABEL,
    }
  }

  if (p === ROUTES.tdBulkDensity) {
    return {
      title: 'ThermoDrive Bulk Density Calculator',
      backHref: ROUTES.dashboard,
      backLabel: DASHBOARD_LABEL,
    }
  }

  if (p.startsWith(`${ROUTES.tdBulkDensity}/`)) {
    return { title: 'Saved run', backHref: ROUTES.dashboard, backLabel: DASHBOARD_LABEL }
  }

  if (p === ROUTES.tdConfigurator) {
    return { title: 'ThermoDrive Belt Configurator', backHref: ROUTES.dashboard, backLabel: DASHBOARD_LABEL }
  }

  if (p.startsWith(`${ROUTES.tdConfigurator}/`)) {
    return { title: 'Saved belt', backHref: ROUTES.dashboard, backLabel: DASHBOARD_LABEL }
  }

  if (p === ROUTES.onetrack) {
    return { title: 'OneTrack BOM Builder', backHref: ROUTES.dashboard, backLabel: DASHBOARD_LABEL }
  }

  if (p.startsWith(`${ROUTES.onetrack}/`)) {
    return { title: 'Saved BOM', backHref: ROUTES.dashboard, backLabel: DASHBOARD_LABEL }
  }

  if (p === ROUTES.admin) {
    return { title: 'Manage access', backHref: ROUTES.dashboard, backLabel: DASHBOARD_LABEL }
  }

  // Unknown route: still give the user a way home.
  return { title: 'Not found', backHref: ROUTES.dashboard, backLabel: DASHBOARD_LABEL }
}
