// How to measure a span of pitches with a tape measure.
//
// Drawn rather than photographed so it stays legible at any size and needs no
// asset pipeline. The geometry is to scale for the example it labels -- 12
// pitches of Series 900, 1.07 in pitch, which a new belt reads as 12 13/16 in
// on the blade. If you change the example, change all three: the pitch, the
// count, and the label under the dimension line.

import { toFractionalInches } from '@/lib/measurement'

const PX_PER_IN = 36

const EXAMPLE = {
  series: '900',
  pitchIn: 1.07,
  pitches: 12,
} as const

const NOMINAL_IN = EXAMPLE.pitchIn * EXAMPLE.pitches // 12.84 in -> 12 13/16 on a tape

const X0 = 72 // the hook, and the first hinge rod
const PITCH_PX = EXAMPLE.pitchIn * PX_PER_IN
const READ_X = X0 + EXAMPLE.pitches * PITCH_PX

const BLADE_Y1 = 96
const BLADE_Y2 = 134
const BLADE_X2 = 620

const BELT_X1 = 52
const BELT_X2 = 624
const BELT_Y1 = 158
const BELT_Y2 = 228
const BELT_H = BELT_Y2 - BELT_Y1

const DIM_Y = 250

/** Horizontal module seams, staggered pitch to pitch — the bricklay pattern. */
function laneSeams(index: number): number[] {
  return index % 2 === 0
    ? [BELT_Y1 + BELT_H / 3, BELT_Y1 + (2 * BELT_H) / 3]
    : [BELT_Y1 + BELT_H / 6, BELT_Y1 + BELT_H / 2, BELT_Y1 + (5 * BELT_H) / 6]
}

export function MeasureDiagram() {
  // Enough cells to run past both cut edges of the belt; the clip path trims them.
  const firstCell = -1
  const lastCell = Math.ceil((BELT_X2 - X0) / PITCH_PX)
  const cells: number[] = []
  for (let i = firstCell; i <= lastCell; i += 1) cells.push(i)

  const inchTicks = Array.from({ length: 15 }, (_, k) => k)

  return (
    // Below about 640px the labels stop being readable, so the diagram scrolls
    // rather than shrinking. Every instruction on it is also written out as
    // text underneath.
    <div className="overflow-x-auto -mx-2 px-2">
      <svg
        viewBox="0 0 700 304"
        className="w-full min-w-[620px] h-auto"
        role="img"
        aria-label="A tape measure hooked on a hinge rod at the start of a span of belt, its blade running across twelve numbered pitches, with the reading taken at the same point on the last hinge rod."
      >
        <defs>
          <linearGradient id="be-blade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-tape-blade-light)" />
            <stop offset="100%" stopColor="var(--color-tape-blade)" />
          </linearGradient>
          <clipPath id="be-belt-clip">
            <rect x={BELT_X1} y={BELT_Y1} width={BELT_X2 - BELT_X1} height={BELT_H} rx="5" />
          </clipPath>
          <marker id="be-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,1 L10,5 L0,9 z" className="fill-foreground/70" />
          </marker>
        </defs>

        {/* ---- The belt, seen from above, travelling left to right ---- */}
        <rect
          x={BELT_X1}
          y={BELT_Y1}
          width={BELT_X2 - BELT_X1}
          height={BELT_H}
          rx="5"
          className="fill-muted stroke-border"
          strokeWidth="1.5"
        />
        <g clipPath="url(#be-belt-clip)">
          {cells.map((i) => {
            const x = X0 + i * PITCH_PX
            return (
              <g key={i}>
                {/* One pitch = one row of modules. Drawn as a discrete block
                    with a gap at each end, because the whole lesson of this
                    picture is that a pitch is a thing you can point at and
                    count. Alternating fills make counting to twenty-four
                    possible without losing your place. */}
                <rect
                  x={x + 2.5}
                  y={BELT_Y1 + 3}
                  width={PITCH_PX - 5}
                  height={BELT_H - 6}
                  rx="3"
                  className={
                    i % 2 === 0
                      ? 'fill-white stroke-metal-gray/50'
                      : 'fill-metal-gray/12 stroke-metal-gray/50'
                  }
                  strokeWidth="1"
                />
                {/* Module joints across the width, staggered row to row --
                    the bricklay pattern of a real belt. */}
                {laneSeams(i).map((y) => (
                  <line
                    key={y}
                    x1={x + 2.5}
                    y1={y}
                    x2={x + PITCH_PX - 2.5}
                    y2={y}
                    className="stroke-metal-gray/30"
                    strokeWidth="1.1"
                  />
                ))}
                {/* The hinge rod, in the gap between rows. */}
                <line
                  x1={x}
                  y1={BELT_Y1 + 4}
                  x2={x}
                  y2={BELT_Y2 - 4}
                  className="stroke-metal-gray"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )
          })}
        </g>

        {/* Pitch numbers, centred in each pitch — you count the gaps between
            hinge rods, not the rods. */}
        {Array.from({ length: EXAMPLE.pitches }, (_, i) => (
          <text
            key={i}
            x={X0 + (i + 0.5) * PITCH_PX}
            y={BELT_Y1 - 6}
            textAnchor="middle"
            className="fill-brand font-mono-num"
            fontSize="11"
            fontWeight="700"
          >
            {i + 1}
          </text>
        ))}

        {/* ---- The tape ---- */}
        <rect
          x={X0}
          y={BLADE_Y1}
          width={BLADE_X2 - X0}
          height={BLADE_Y2 - BLADE_Y1}
          rx="2"
          fill="url(#be-blade)"
          className="stroke-tape-blade-edge"
          strokeWidth="1.5"
        />
        {/* Graduations, read off the bottom edge of the blade. */}
        {Array.from({ length: Math.floor((BLADE_X2 - X0) / (PX_PER_IN / 8)) + 1 }, (_, k) => {
          const x = X0 + (k * PX_PER_IN) / 8
          if (x > BLADE_X2 - 1) return null
          const h = k % 8 === 0 ? 17 : k % 4 === 0 ? 11 : k % 2 === 0 ? 8 : 5
          return (
            <line
              key={k}
              x1={x}
              y1={BLADE_Y2 - h}
              x2={x}
              y2={BLADE_Y2}
              className="stroke-tape-blade-edge"
              strokeWidth={k % 8 === 0 ? 1.6 : 1}
            />
          )
        })}
        {inchTicks.map((k) => (
          <text
            key={k}
            x={X0 + k * PX_PER_IN + 3}
            y={BLADE_Y1 + 14}
            className="fill-foreground/70 font-mono-num"
            fontSize="11"
          >
            {k}
          </text>
        ))}

        {/* The case sits at the far end from the hook, where you hold it. */}
        <rect x="616" y="78" width="76" height="74" rx="10" className="fill-intralox-red" />
        <rect x="624" y="86" width="60" height="30" rx="5" className="fill-intralox-dark-red" />
        <rect x="630" y="92" width="48" height="18" rx="3" className="fill-white/85" />
        <rect x="624" y="124" width="60" height="7" rx="3.5" className="fill-white/70" />
        <rect x="638" y="136" width="32" height="8" rx="4" className="fill-intralox-dark-red" />
        <rect
          x="612"
          y={BLADE_Y1 - 2}
          width="10"
          height={BLADE_Y2 - BLADE_Y1 + 4}
          rx="2"
          className="fill-intralox-dark-red"
        />

        {/* The hook, over the first hinge rod. */}
        <path
          d={`M ${X0 - 16} ${BLADE_Y1 - 4} H ${X0} V ${BELT_Y1 + 12} H ${X0 - 8} V ${BLADE_Y1 + 4} H ${X0 - 16} Z`}
          className="fill-foreground"
        />

        {/* ---- Where to read ---- */}
        <line
          x1={READ_X}
          y1={BLADE_Y2 - 2}
          x2={READ_X}
          y2={BELT_Y2 + 6}
          className="stroke-intralox-red"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <circle cx={READ_X} cy={BLADE_Y2} r="4.5" className="fill-intralox-red" />

        {/* ---- Callouts. The words are repeated as real text below. ---- */}
        <g className="fill-foreground" fontSize="13" fontWeight="600">
          <circle cx={X0 - 4} cy="70" r="10" className="fill-brand" />
          <text x={X0 - 4} y="74.5" textAnchor="middle" className="fill-white" fontSize="12">
            1
          </text>
          <text x={X0 + 12} y="75">
            Hook a hinge rod
          </text>

          <circle cx={READ_X} cy="70" r="10" className="fill-brand" />
          <text x={READ_X} y="74.5" textAnchor="middle" className="fill-white" fontSize="12">
            3
          </text>
          <text x={READ_X - 16} y="75" textAnchor="end">
            Read the same point here
          </text>
        </g>

        {/* ---- Dimension line ---- */}
        <line
          x1={X0}
          y1={DIM_Y}
          x2={READ_X}
          y2={DIM_Y}
          className="stroke-foreground/70"
          strokeWidth="1.5"
          markerStart="url(#be-arrow)"
          markerEnd="url(#be-arrow)"
        />
        <line x1={X0} y1={BELT_Y2 + 4} x2={X0} y2={DIM_Y + 6} className="stroke-foreground/30" strokeWidth="1" />
        <line x1={READ_X} y1={BELT_Y2 + 4} x2={READ_X} y2={DIM_Y + 6} className="stroke-foreground/30" strokeWidth="1" />
        <g fontSize="13">
          <circle cx={X0 + (READ_X - X0) / 2 - 116} cy={DIM_Y + 18} r="10" className="fill-brand" />
          <text
            x={X0 + (READ_X - X0) / 2 - 116}
            y={DIM_Y + 22.5}
            textAnchor="middle"
            className="fill-white"
            fontSize="12"
            fontWeight="600"
          >
            2
          </text>
          <text
            x={X0 + (READ_X - X0) / 2 - 100}
            y={DIM_Y + 23}
            className="fill-foreground"
            fontWeight="600"
          >
            Count the pitches in between
          </text>
        </g>
        <text
          x={BELT_X2}
          y={DIM_Y + 46}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize="12"
        >
          Example: {EXAMPLE.pitches} pitches of Series {EXAMPLE.series} — a new belt reads{' '}
          {NOMINAL_IN.toFixed(2)} in, so {toFractionalInches(NOMINAL_IN)} on the blade
        </text>
      </svg>
    </div>
  )
}
