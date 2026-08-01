// Which way a rep prefers to fill in the evaluation.
//
// The section-by-section checklist is the default because it's far easier on a
// tablet, but some people are faster on one long page they can scroll and
// tab through -- particularly anyone used to the original paper form. Neither
// is "the right one"; the preference is remembered per device.

export type FormLayout = 'sections' | 'long'

export const DEFAULT_LAYOUT: FormLayout = 'sections'

const STORAGE_KEY = 'spiralEval.formLayout'

export function isFormLayout(value: unknown): value is FormLayout {
  return value === 'sections' || value === 'long'
}

export function getFormLayout(): FormLayout {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isFormLayout(stored) ? stored : DEFAULT_LAYOUT
  } catch {
    // Private browsing or a blocked storage API must not break the form.
    return DEFAULT_LAYOUT
  }
}

export function setFormLayout(layout: FormLayout): void {
  try {
    localStorage.setItem(STORAGE_KEY, layout)
  } catch {
    // Preference simply won't persist; the app still works.
  }
}

/** Where opening an evaluation should land, given the saved preference. */
export function evaluationHref(id: string, layout: FormLayout = getFormLayout()): string {
  return layout === 'long' ? `/spiral-eval/${id}/all` : `/spiral-eval/${id}`
}
