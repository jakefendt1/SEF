import { BREAK_IN_PCT, type VerdictLevel } from '@/lib/beltElongation'
import { LEVEL_STYLES } from './levelStyles'
import { cn } from '@/lib/utils'

interface Props {
  /** null before there is anything to show. The bands still render. */
  elongationPct: number | null
  limitPct: number
  level: VerdictLevel | null
}

/**
 * Where this belt sits between "just broken in" and "replace it".
 *
 * A percentage alone doesn't tell a rep anything -- 2.4% is either fine or
 * urgent depending on a limit they set two screens ago. The bands put the
 * number in its context at a glance, from arm's length, which is how this gets
 * read on a plant floor.
 */
export function ElongationGauge({ elongationPct, limitPct, level }: Props) {
  const limit = limitPct > 0 ? limitPct : 3
  // Always leave headroom past the limit so a belt that is genuinely past it
  // doesn't just peg the needle at the end with nowhere to go.
  const max = Math.max(limit * 1.5, 4)
  const pos = (v: number) => `${Math.min(Math.max(v / max, 0), 1) * 100}%`

  const breakIn = Math.min(BREAK_IN_PCT, limit)
  const needleAt = elongationPct === null ? null : Math.min(Math.max(elongationPct, 0), max)
  // A negative result is a measuring mistake, not a reading on this scale --
  // park the needle at zero and let the verdict text explain why.
  const pinnedLow = elongationPct !== null && elongationPct < 0
  const pinnedHigh = elongationPct !== null && elongationPct > max

  const ticks = Array.from({ length: Math.floor(max) + 1 }, (_, i) => i)

  return (
    <div>
      <div
        className="relative h-12 rounded-lg border border-border bg-white overflow-hidden"
        role="img"
        aria-label={
          elongationPct === null
            ? `Elongation scale from 0 to ${max} percent. Normal below ${breakIn} percent, replace at or above ${limit} percent. No reading yet.`
            : `${elongationPct.toFixed(2)} percent elongation on a scale to ${max} percent, against a ${limit} percent replacement limit.`
        }
      >
        {/* Bands, in the same colours as the verdict above them. */}
        <div
          className={cn('absolute inset-y-0 left-0', LEVEL_STYLES.normal.band)}
          style={{ width: pos(breakIn) }}
        />
        <div
          className={cn('absolute inset-y-0', LEVEL_STYLES.watch.band)}
          style={{ left: pos(breakIn), width: `calc(${pos(limit)} - ${pos(breakIn)})` }}
        />
        <div
          className={cn('absolute inset-y-0 right-0', LEVEL_STYLES.replace.band)}
          style={{ left: pos(limit) }}
        />

        {/* Whole-percent ruling, so the bands can be read as values. */}
        {ticks.map((t) => (
          <div
            key={t}
            aria-hidden="true"
            className="absolute top-0 h-2 w-px bg-foreground/25"
            style={{ left: pos(t) }}
          />
        ))}

        {/* The replacement limit is the one line that matters most: mark it. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 bg-destructive/60"
          style={{ left: pos(limit) }}
        />

        {needleAt !== null && (
          <div
            aria-hidden="true"
            className="absolute inset-y-0 w-[3px] bg-foreground transition-[left] duration-200 motion-reduce:transition-none"
            style={{ left: `calc(${pos(needleAt)} - 1.5px)` }}
          >
            <div className="absolute -top-px left-1/2 -translate-x-1/2 size-2.5 rotate-45 bg-foreground" />
          </div>
        )}

        {pinnedLow && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-xs font-semibold text-metal-gray">
            below 0%
          </div>
        )}
        {pinnedHigh && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 text-xs font-semibold text-destructive">
            off the scale
          </div>
        )}
      </div>

      <div
        className="flex justify-between font-mono-num text-xs text-muted-foreground mt-1"
        aria-hidden="true"
      >
        {[0, max / 4, max / 2, (max * 3) / 4, max].map((v) => (
          <span key={v}>{v % 1 === 0 ? v : v.toFixed(1)}%</span>
        ))}
      </div>

      {/* Legend. Labelling the bands in place would be unreadable on a narrow
          band; a legend always fits and never truncates. */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
        {(['normal', 'watch', 'replace'] as const).map((key) => {
          const s = LEVEL_STYLES[key]
          const range =
            key === 'normal'
              ? `under ${breakIn}%`
              : key === 'watch'
                ? `${breakIn}–${limit}%`
                : `${limit}% and up`
          return (
            <li
              key={key}
              className={cn(
                'flex items-center gap-1.5',
                level === key ? `font-semibold ${s.text}` : 'text-muted-foreground',
              )}
            >
              <span className={cn('size-2.5 rounded-full shrink-0', s.dot)} aria-hidden="true" />
              {s.label} <span className="font-mono-num">{range}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
