// One definition of what each verdict looks like.
//
// The big number, the verdict pill and the gauge all read from here. When they
// were styled independently in the prototype, a value could sit in the amber
// band of the gauge while the headline above it was green -- and the user
// believes the colour, not the arithmetic.
import type { VerdictLevel } from '@/lib/beltElongation'

export interface LevelStyle {
  /** Short word for the pill and the gauge legend. */
  label: string
  /** Text colour for the big number and the pill. */
  text: string
  /** Pill background + border. */
  chip: string
  /** Gauge band fill. */
  band: string
  /** Solid swatch for the legend dot. */
  dot: string
}

export const LEVEL_STYLES: Record<VerdictLevel, LevelStyle> = {
  short: {
    label: 'Check measurement',
    text: 'text-metal-gray',
    chip: 'bg-metal-gray/10 border-metal-gray/30 text-metal-gray',
    band: 'bg-metal-gray/20',
    dot: 'bg-metal-gray',
  },
  normal: {
    label: 'Normal',
    text: 'text-savings-green',
    chip: 'bg-savings-green/10 border-savings-green/30 text-savings-green',
    band: 'bg-savings-green/20',
    dot: 'bg-savings-green',
  },
  watch: {
    label: 'Watch it',
    text: 'text-warning-orange',
    chip: 'bg-warning-orange/10 border-warning-orange/30 text-warning-orange',
    band: 'bg-warning-orange/20',
    dot: 'bg-warning-orange',
  },
  replace: {
    label: 'Replace',
    text: 'text-destructive',
    chip: 'bg-destructive/10 border-destructive/30 text-destructive',
    band: 'bg-destructive/20',
    dot: 'bg-destructive',
  },
}
