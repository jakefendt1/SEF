// Side-elevation profile icons showing belt wrap angle around the drum.
// Gap is centered at 6 o'clock so the arc grows upward from the base.

const R = 22
const DRUM_CY = 30
const BASE_Y = DRUM_CY + R + 4   // 56 — base platform
const LABEL_Y = 74

const CONFIGS = [
  { sweep: 360, label: '360°', cx: 40 },
  { sweep: 270, label: '270°', cx: 120 },
  { sweep: 180, label: '180°', cx: 200 },
  { sweep: 90,  label: '90°',  cx: 280 },
]

function beltArc(cx: number, sweep: number): string {
  if (sweep >= 360) {
    return `M ${cx} ${DRUM_CY - R} A ${R} ${R} 0 1 1 ${cx - 0.01} ${DRUM_CY - R} Z`
  }
  const halfGap = (360 - sweep) / 2
  // Angles measured clockwise from 12 o'clock
  const startDeg = 180 + halfGap
  const endDeg   = 180 - halfGap

  const toXY = (deg: number): [number, number] => [
    cx + R * Math.sin((deg * Math.PI) / 180),
    DRUM_CY - R * Math.cos((deg * Math.PI) / 180),
  ]

  const [sx, sy] = toXY(startDeg)
  const [ex, ey] = toXY(endDeg)
  const large = sweep > 180 ? 1 : 0

  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`
}

export function ConfigDiagram() {
  return (
    <svg viewBox="0 0 320 80" className="w-full max-w-md mx-auto" aria-label="Spiral configuration side profiles">
      {CONFIGS.map(({ sweep, label, cx }) => (
        <g key={label}>
          {/* Drum reference outline */}
          <circle cx={cx} cy={DRUM_CY} r={R}
            fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 2" />

          {/* Belt wrap arc */}
          <path d={beltArc(cx, sweep)}
            fill="none" stroke="#1e3a5f" strokeWidth="3.5" strokeLinecap="round" />

          {/* Base platform */}
          <line x1={cx - R - 4} y1={BASE_Y} x2={cx + R + 4} y2={BASE_Y}
            stroke="#475569" strokeWidth="2" />

          <text x={cx} y={LABEL_Y} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e3a5f">
            {label}
          </text>
        </g>
      ))}
    </svg>
  )
}
