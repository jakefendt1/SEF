// One inch, blown up, with every mark named.
//
// Reading a tape is the step people quietly get wrong: the marks between the
// quarters have no numbers on them, and "about three quarters" becomes 1/16 of
// an inch of error -- which over a short span is a whole percent of elongation.
import { SIXTEENTHS, MM_PER_IN } from '@/lib/measurement'

const X0 = 40
const STEP = 40 // one sixteenth, magnified
const BLADE_Y1 = 20
const BLADE_Y2 = 84

/** The fraction at mark `k`, unreduced position -> reduced label. */
function markLabel(k: number): string {
  if (k === 0) return '0'
  if (k === 16) return '1 in'
  return SIXTEENTHS[k - 1].label
}

export function RulerReference() {
  const marks = Array.from({ length: 17 }, (_, k) => k)

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto -mx-2 px-2">
        <svg
          viewBox="0 0 720 150"
          className="w-full min-w-[620px] h-auto"
          role="img"
          aria-label="One inch of a tape measure magnified, with all sixteen marks named, from one sixteenth to one inch."
        >
          <defs>
            <linearGradient id="be-ruler-blade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-tape-blade-light)" />
              <stop offset="100%" stopColor="var(--color-tape-blade)" />
            </linearGradient>
          </defs>

          <rect
            x="16"
            y={BLADE_Y1}
            width="688"
            height={BLADE_Y2 - BLADE_Y1}
            rx="3"
            fill="url(#be-ruler-blade)"
            className="stroke-tape-blade-edge"
            strokeWidth="1.5"
          />

          {marks.map((k) => {
            const x = X0 + k * STEP
            const isInch = k % 16 === 0
            const isHalf = k % 8 === 0
            const isQuarter = k % 4 === 0
            const isEighth = k % 2 === 0
            const h = isInch ? 50 : isHalf ? 40 : isQuarter ? 32 : isEighth ? 25 : 18
            // Two rows of labels: the sixteenths would collide with the
            // eighths on one line, and a squeezed label is a misread label.
            const labelY = isEighth ? 106 : 132
            return (
              <g key={k}>
                <line
                  x1={x}
                  y1={BLADE_Y2 - h}
                  x2={x}
                  y2={BLADE_Y2}
                  className={isInch || isHalf ? 'stroke-foreground' : 'stroke-tape-blade-edge'}
                  strokeWidth={isInch ? 2.5 : isHalf ? 2 : 1.4}
                />
                {!isEighth && (
                  <line
                    x1={x}
                    y1={BLADE_Y2}
                    x2={x}
                    y2={labelY - 11}
                    className="stroke-border"
                    strokeWidth="1"
                  />
                )}
                <text
                  x={x}
                  y={labelY}
                  textAnchor="middle"
                  fontSize={isInch || isHalf ? '14' : '12'}
                  fontWeight={isInch || isHalf ? 700 : 400}
                  className={
                    isInch || isHalf
                      ? 'fill-foreground font-mono-num'
                      : 'fill-muted-foreground font-mono-num'
                  }
                >
                  {markLabel(k)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div>
        <h4 className="text-base font-semibold text-foreground mb-2">
          If you'd rather type a decimal
        </h4>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SIXTEENTHS.map(({ label, decimal }) => (
            <li
              key={label}
              className="flex items-baseline justify-between gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2"
            >
              <span className="font-mono-num font-semibold text-foreground">{label}</span>
              <span className="font-mono-num text-sm text-muted-foreground">
                .{decimal.toFixed(4).slice(2)}
                <span className="sr-only"> inches</span>
              </span>
              <span className="font-mono-num text-sm text-muted-foreground">
                {(decimal * MM_PER_IN).toFixed(1)}
                <span aria-hidden="true"> mm</span>
                <span className="sr-only"> millimetres</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          You don't have to convert anything — type the whole inches and pick the fraction from the
          list. This is here for when you'd rather not.
        </p>
      </div>
    </div>
  )
}
