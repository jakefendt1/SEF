// Indent, clearance and containment constants, 2026 ThermoDrive Engineering
// Manual p.75, p.78, p.114-115, p.123-124, p.130.

/** Minimum manufacturable flight indent; below is a special order (p.75). */
export const MIN_INDENT_IN = 1.25
/** Minimum clearance from a limiter edge to the flight or sidewall edge (p.114, p.123). */
export const LIMITER_CLEARANCE_IN = 0.25
/** Minimum clearance between belt and containment components (p.114, p.124). */
export const CONTAINMENT_CLEARANCE_IN = 0.125
/**
 * Hold-down / limiter contact width default. Not a manual figure -- an open
 * item (plan §12) until a typical value is confirmed. Editable.
 */
export const DEFAULT_HOLD_DOWN_WIDTH_IN = 1.0
/**
 * Flighted roller limiters (end drive): indents and notches at least this.
 * From the build plan §4.3; not found on the manual pages in refs/, so it is
 * surfaced as a warning without a page cite until confirmed.
 */
export const ROLLER_LIMITER_MIN_IN = 2.5

/** Standard notch width (p.75). */
export const STANDARD_NOTCH_IN = 2
/** Above this flight width, ask Customer Service about a center notch (p.75). */
export const CENTER_NOTCH_ADVICE_WIDTH_IN = 24
/** Gussets: S8050/S8140 only, flights at least this wide (p.77). */
export const GUSSET_MIN_WIDTH_IN = 7

/** Synchronized sidewalls (p.78). */
export const MIN_SIDEWALL_INDENT_IN = 1.25
export const MIN_SIDEWALL_GAP_IN = 0.2
export const MAX_SIDEWALL_BELT_WIDTH_IN = 42
/** Space between flights needed at sidewall field-splice locations (p.75). */
export const SIDEWALL_SPLICE_SPACE_IN = 9.33

/** Ribbed V-Top carries bulk product to this incline without flights (p.13). */
export const RVT_MAX_INCLINE_DEG = 30

/** Engineering defaults (not manual figures). */
export const DEFAULT_FILL_PCT = 75
export const DEFAULT_DYNAMIC_DERATE_DEG = 5
export const MAX_DYNAMIC_DERATE_DEG = 15
export const DEFAULT_WALL_FRICTION = 0.3
