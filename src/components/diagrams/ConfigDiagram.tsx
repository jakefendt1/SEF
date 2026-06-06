// Side-profile schematic icons showing how far the belt wraps around the drum.

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, sweep: number): string {
  if (sweep >= 360) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
  }
  const s = polar(cx, cy, r, 0)
  const e = polar(cx, cy, r, sweep)
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`
}

const CONFIGS = [
  { sweep: 360, label: '360°' },
  { sweep: 90,  label: '90°'  },
  { sweep: 180, label: '180°' },
  { sweep: 270, label: '270°' },
]
const R = 26
const CY = 34

export function ConfigDiagram() {
  return (
    <svg viewBox="0 0 320 80" className="w-full max-w-md mx-auto" aria-label="Spiral configurations">
      {CONFIGS.map(({ sweep, label }, i) => {
        const cx = 40 + i * 80
        return (
          <g key={label}>
            {/* Ghost drum outline */}
            <circle cx={cx} cy={CY} r={R} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 2" />
            {/* Belt wrap arc */}
            <path d={arcPath(cx, CY, R, sweep)} fill="#bfdbfe" stroke="#1e3a5f" strokeWidth="1.5" />
            {/* Center dot */}
            <circle cx={cx} cy={CY} r="2.5" fill="#1e3a5f" />
            {/* Label */}
            <text x={cx} y={72} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e3a5f">{label}</text>
          </g>
        )
      })}
    </svg>
  )
}
