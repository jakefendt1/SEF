// Progress reporting for the Spiral Eval form.
//
// Everything here is derived from REQUIRED_RULES in formSchema.ts. It used to
// be a separate hand-maintained list, which had drifted: the bar could read a
// satisfying 100% while Submit still bounced the user for eight fields the bar
// had never heard of.
import {
  activeRequiredRules,
  missingRequiredRules,
  isDeferred,
  isFilled,
  formSchema,
  type FormValues,
  type RequiredRule,
  type SectionId,
} from '../schema/formSchema'
import { FORM_SECTIONS } from '../schema/sectionMap'

export interface Completeness {
  filled: number
  total: number
  pct: number
  /** Required fields still needing an answer, with human labels. */
  missing: RequiredRule[]
  /** Fields the user explicitly deferred; counted as answered, tracked here. */
  deferredCount: number
  /**
   * True only when the form would actually pass validation. The bar reaching
   * 100% is necessary but not sufficient -- format rules (a valid email) and
   * exclusivity rules can still fail.
   */
  canSubmit: boolean
}

export function getCompleteness(values: Partial<FormValues>): Completeness {
  const active = activeRequiredRules(values)
  const missing = missingRequiredRules(values)
  const total = active.length
  const filled = total - missing.length
  const deferredCount = active.filter((rule) => isDeferred(values, rule.field)).length

  return {
    filled,
    total,
    pct: total > 0 ? Math.round((filled / total) * 100) : 0,
    missing,
    deferredCount,
    canSubmit: formSchema.safeParse(values).success,
  }
}

export interface SectionProgress {
  id: SectionId
  filled: number
  total: number
  /** True when this section has no required fields left unanswered. */
  complete: boolean
  /** True when the user has answered nothing at all here yet. */
  untouched: boolean
}

/** Per-section progress, for the checklist hub and the jump navigation. */
export function getSectionProgress(values: Partial<FormValues>): SectionProgress[] {
  const active = activeRequiredRules(values)
  const missing = new Set(missingRequiredRules(values).map((r) => r.field))

  return FORM_SECTIONS.map((section) => {
    const required = active.filter((r) => r.section === section.id)
    const filled = required.filter((r) => !missing.has(r.field)).length
    const anyAnswered = section.fields.some((f) => isFilled(values[f]))

    return {
      id: section.id,
      filled,
      total: required.length,
      complete: required.length > 0 && filled === required.length,
      untouched: !anyAnswered,
    }
  })
}
