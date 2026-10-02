// Technical defaults. These are engineering defaults or manual minimums, not
// application data: nothing here describes a customer's line, so the tool
// never opens showing a throughput built on numbers nobody entered.
import {
  DEFAULT_DYNAMIC_DERATE_DEG,
  DEFAULT_FILL_PCT,
  DEFAULT_HOLD_DOWN_WIDTH_IN,
  DEFAULT_WALL_FRICTION,
  MIN_INDENT_IN,
  MIN_SIDEWALL_GAP_IN,
  MIN_SIDEWALL_INDENT_IN,
  STANDARD_NOTCH_IN,
} from './data/indents'
import type { TdInputs } from './types'

/** A complete input set for tests and for building a run from defaults. */
export function makeInputs(overrides: Partial<TdInputs> = {}): TdInputs {
  return {
    series: 'S8050',
    beltWidthIn: 12,
    inclineDeg: 52,
    inclineLengthFt: null,
    targetLbPerHr: null,
    beltSpeedFpm: null,
    flightType: 'deg90',
    flightHeightIn: 5,
    flightThicknessIn: 0.16,
    flightSpacingIn: 8,
    containment: 'open',
    indentLeftIn: MIN_INDENT_IN,
    indentRightIn: MIN_INDENT_IN,
    holdDownWidthIn: DEFAULT_HOLD_DOWN_WIDTH_IN,
    rollerLimiters: false,
    guardClearanceIn: null,
    notchCount: 0,
    notchWidthIn: STANDARD_NOTCH_IN,
    sidewallPitch: '50mm',
    sidewallHeightIn: 4,
    sidewallIndentIn: MIN_SIDEWALL_INDENT_IN,
    sidewallGapIn: MIN_SIDEWALL_GAP_IN,
    densityLbFt3: 10,
    reposeDeg: 35,
    smallestDimIn: 1,
    fillPct: DEFAULT_FILL_PCT,
    dynamicDerateDeg: DEFAULT_DYNAMIC_DERATE_DEG,
    productMaxSpeedFpm: null,
    wallFrictionMu: DEFAULT_WALL_FRICTION,
    calcLabMode: false,
    profileOverride: null,
    ...overrides,
  }
}
