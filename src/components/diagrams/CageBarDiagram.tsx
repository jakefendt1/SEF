// Cage bar cross-section dimensions (A, B, C) and the four cap profile shapes.

function CapShape({ x, y, w, h, label, type }: {
  x: number; y: number; w: number; h: number; label: string
  type: 'trapezoidal' | 'flat' | 'ribbed' | 'winged'
}) {
  const sw = w * 0.6  // bar body width
  const sx = x + (w - sw) / 2
  let shape: string

  if (type === 'trapezoidal') {
    const inset = sw * 0.18
    // Trapezoid: wider at bottom-opening, inner walls angled
    shape = `M ${sx} ${y} L ${sx + sw} ${y} L ${sx + sw} ${y + h * 0.3}
             L ${sx + sw - inset} ${y + h} L ${sx + inset} ${y + h}
             L ${sx} ${y + h * 0.3} Z`
  } else if (type === 'flat') {
    const wall = sw * 0.2
    shape = `M ${sx} ${y} L ${sx + sw} ${y} L ${sx + sw} ${y + h * 0.25}
             L ${sx + sw - wall} ${y + h * 0.25} L ${sx + sw - wall} ${y + h}
             L ${sx + wall} ${y + h} L ${sx + wall} ${y + h * 0.25}
             L ${sx} ${y + h * 0.25} Z`
  } else if (type === 'ribbed') {
    const wall = sw * 0.2
    const ribW = sw * 0.25
    const ribH = h * 0.2
    shape = `M ${sx} ${y} L ${sx + sw} ${y} L ${sx + sw} ${y + h * 0.22}
             L ${sx + sw - wall} ${y + h * 0.22} L ${sx + sw - wall} ${y + h}
             L ${sx + wall} ${y + h} L ${sx + wall} ${y + h * 0.22}
             L ${sx} ${y + h * 0.22} Z
             M ${sx + sw / 2 - ribW / 2} ${y}
             L ${sx + sw / 2 + ribW / 2} ${y}
             L ${sx + sw / 2 + ribW / 2} ${y - ribH}
             L ${sx + sw / 2 - ribW / 2} ${y - ribH} Z`
  } else {
    // winged: wide flat bar with thin caps extending outward
    const capH = h * 0.22
    const wingW = w * 0.15
    shape = `M ${sx} ${y + capH} L ${sx - wingW} ${y + capH} L ${sx - wingW} ${y}
             L ${sx + sw + wingW} ${y} L ${sx + sw + wingW} ${y + capH}
             L ${sx + sw} ${y + capH} L ${sx + sw} ${y + h}
             L ${sx} ${y + h} Z`
  }

  return (
    <g>
      <path d={shape} fill="#bfdbfe" stroke="#1e3a5f" strokeWidth="1.5" strokeLinejoin="round" />
      <text x={x + w / 2} y={y + h + 14} textAnchor="middle" fontSize="8.5" fill="#374151" fontWeight="600">{label}</text>
    </g>
  )
}

export function CageBarDiagram() {
  return (
    <svg viewBox="0 0 300 210" className="w-full max-w-sm mx-auto" aria-label="Cage bar dimensions and cap profiles">
      <defs>
        <marker id="cb-ae" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
        </marker>
        <marker id="cb-as" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M6,0 L6,6 L0,3 z" fill="#dc2626" />
        </marker>
      </defs>

      {/* Section label */}
      <text x="150" y="12" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">CAGE BAR DIMENSIONS</text>

      {/* Show 5 bars in an arc to give spatial context */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = -40 + i * 20
        const rad = (angle * Math.PI) / 180
        const arcR = 78
        const cx = 150 + arcR * Math.sin(rad)
        const cy = 110 - arcR * Math.cos(rad)
        return (
          <rect
            key={i}
            x={cx - 8} y={cy - 8} width={16} height={16}
            fill={i === 2 ? '#bfdbfe' : '#e2e8f0'}
            stroke="#1e3a5f" strokeWidth={i === 2 ? 1.5 : 1}
            transform={`rotate(${angle}, ${cx}, ${cy})`}
          />
        )
      })}

      {/* Center bar detailed with A, B, C labels */}
      {/* A = width */}
      <line x1="142" y1="76" x2="158" y2="76" stroke="#dc2626" strokeWidth="1.5"
        markerStart="url(#cb-as)" markerEnd="url(#cb-ae)" />
      <text x="150" y="71" textAnchor="middle" fontSize="9" fill="#dc2626" fontWeight="700">A</text>

      {/* B = height (right side) */}
      <line x1="164" y1="102" x2="164" y2="118" stroke="#dc2626" strokeWidth="1.5"
        markerStart="url(#cb-as)" markerEnd="url(#cb-ae)" />
      <text x="172" y="112" textAnchor="start" fontSize="9" fill="#dc2626" fontWeight="700">B</text>

      {/* C = diagonal/depth indicator */}
      <line x1="155" y1="118" x2="170" y2="130" stroke="#dc2626" strokeWidth="1.5" markerEnd="url(#cb-ae)" />
      <text x="173" y="132" textAnchor="start" fontSize="9" fill="#dc2626" fontWeight="700">C</text>

      {/* Divider line */}
      <line x1="12" y1="148" x2="288" y2="148" stroke="#e2e8f0" strokeWidth="1" />
      <text x="150" y="160" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">CAP PROFILES</text>

      {/* Cap profiles */}
      <CapShape x={14}  y={168} w={54} h={28} label="Trapezoidal" type="trapezoidal" />
      <CapShape x={82}  y={168} w={54} h={28} label="Flat"         type="flat"         />
      <CapShape x={150} y={168} w={54} h={28} label="Ribbed"       type="ribbed"       />
      <CapShape x={218} y={168} w={54} h={28} label="Winged"       type="winged"       />
    </svg>
  )
}
