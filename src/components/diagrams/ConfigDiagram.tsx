interface Props {
  value: string | undefined  // e.g. '360°', '270°', '180°', etc.
}

// Map configuration label to sweep angle in degrees
const SWEEP: Record<string, number> = {
  '360°': 360,
  '270°': 270,
  '180°': 180,
  '90°': 90,
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, sweep: number) {
  if (sweep >= 360) {
    // Full circle — two semicircles
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
  }
  const start = polarToCartesian(cx, cy, r, 0)
  const end = polarToCartesian(cx, cy, r, sweep)
  const large = sweep > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`
}

export function ConfigDiagram({ value }: Props) {
  const sweep: number = (value ? (SWEEP[value] ?? 360) : 360)
  const cx = 90
  const cy = 75
  const r = 52

  return (
    <svg
      viewBox="0 0 180 150"
      className="w-full max-w-[180px] h-auto"
      aria-label={`Configuration: ${value ?? '360°'}`}
    >
      {/* Background circle outline */}
      <circle cx={cx} cy={cy} r={r} fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 2" />
      {/* Filled arc */}
      <path d={arcPath(cx, cy, r, sweep)} fill="#bfdbfe" stroke="#1e3a5f" strokeWidth="2" />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="3" fill="#1e3a5f" />
      {/* Label */}
      <text x={cx} y={cy + r + 20} textAnchor="middle" fontSize="13" fill="#374151" fontWeight="600">
        {value ?? '—'}
      </text>
    </svg>
  )
}
