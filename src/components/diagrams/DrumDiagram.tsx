// Cross-section view explaining the three drum measurement options and infeed/discharge legs.

const CX = 120
const CY = 82
const DR = 50   // drum radius
const OR = 63   // overall system radius (drum + belt thickness)

function Arrow({ x1, y1, x2, y2, id, color }: { x1: number; y1: number; x2: number; y2: number; id: string; color: string }) {
  return (
    <>
      <defs>
        <marker id={id + 'e'} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={color} />
        </marker>
        <marker id={id + 's'} markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M6,0 L6,6 L0,3 z" fill={color} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5"
        markerStart={`url(#${id}s)`} markerEnd={`url(#${id}e)`} />
    </>
  )
}

export function DrumDiagram() {
  const platY = CY + OR + 16    // top of base platform
  const leftX  = CX - OR        // left edge of belt ring
  const rightX = CX + OR        // right edge of belt ring
  const legH   = 22             // platform leg height

  return (
    <svg viewBox="0 0 280 210" className="w-full max-w-sm mx-auto" aria-label="Drum measurement diagram">
      {/* Belt ring (overall system diameter) */}
      <circle cx={CX} cy={CY} r={OR} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 3" />

      {/* Drum */}
      <circle cx={CX} cy={CY} r={DR} fill="#dbeafe" stroke="#1e3a5f" strokeWidth="2" />

      {/* Center dot */}
      <circle cx={CX} cy={CY} r="3" fill="#1e3a5f" />

      {/* RADIUS: center → drum right edge */}
      <line x1={CX} y1={CY} x2={CX + DR} y2={CY} stroke="#dc2626" strokeWidth="1.5" />
      <polygon points={`${CX + DR},${CY - 3} ${CX + DR + 6},${CY} ${CX + DR},${CY + 3}`} fill="#dc2626" />
      <text x={CX + DR / 2 + 2} y={CY - 6} textAnchor="middle" fontSize="8.5" fill="#dc2626" fontWeight="700">RADIUS</text>

      {/* DRUM DIAMETER annotation: horizontal line below center */}
      <Arrow x1={CX - DR} y1={CY + 22} x2={CX + DR} y2={CY + 22} id="dd-diam" color="#1e40af" />
      <text x={CX} y={CY + 34} textAnchor="middle" fontSize="8" fill="#1e40af" fontWeight="700">DRUM DIAMETER</text>

      {/* OVERALL SYSTEM DIAMETER annotation */}
      <Arrow x1={CX - OR} y1={CY + 42} x2={CX + OR} y2={CY + 42} id="dd-over" color="#475569" />
      <text x={CX} y={CY + 53} textAnchor="middle" fontSize="7.5" fill="#475569" fontWeight="600">OVERALL SYSTEM DIAMETER (incl. belt)</text>

      {/* Base platform */}
      <rect x={leftX} y={platY} width={OR * 2} height={4} fill="#1e3a5f" rx="1" />

      {/* Left leg */}
      <rect x={leftX} y={platY + 4} width={4} height={legH} fill="#1e3a5f" rx="1" />
      {/* Right leg */}
      <rect x={rightX - 4} y={platY + 4} width={4} height={legH} fill="#1e3a5f" rx="1" />
      {/* Center divider */}
      <rect x={CX - 2} y={platY} width={4} height={legH + 4} fill="#475569" rx="1" />

      {/* A label */}
      <text x={(leftX + CX) / 2} y={platY + legH + 16} textAnchor="middle" fontSize="11" fontWeight="700" fill="#374151">(A)</text>
      <text x={(leftX + CX) / 2} y={platY + legH + 26} textAnchor="middle" fontSize="7.5" fill="#6b7280">Infeed Length</text>

      {/* B label */}
      <text x={(CX + rightX) / 2} y={platY + legH + 16} textAnchor="middle" fontSize="11" fontWeight="700" fill="#374151">(B)</text>
      <text x={(CX + rightX) / 2} y={platY + legH + 26} textAnchor="middle" fontSize="7.5" fill="#6b7280">Discharge Length</text>

      {/* BELT WIDTH: right edge bracket */}
      <Arrow x1={rightX + 10} y1={platY} x2={rightX + 10} y2={platY + legH + 4} id="dd-bw" color="#64748b" />
      <text x={rightX + 20} y={platY + (legH / 2) + 4} fontSize="7" fill="#64748b" fontWeight="600"
        transform={`rotate(90, ${rightX + 20}, ${platY + (legH / 2) + 4})`}
        textAnchor="middle">BELT WIDTH</text>
    </svg>
  )
}
