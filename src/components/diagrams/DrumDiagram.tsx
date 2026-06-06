// Front-elevation cross-section of the drum showing measurement options.

const CX = 118
const CY = 72
const DR = 46    // drum radius
const OR = 58    // overall system radius (drum + belt thickness)

export function DrumDiagram() {
  const platY  = CY + OR + 20   // 150 — top of base platform
  const legH   = 22
  const leftX  = CX - OR        // 60
  const rightX = CX + OR        // 176

  return (
    <svg viewBox="0 0 290 220" className="w-full max-w-sm mx-auto" aria-label="Drum measurement diagram">
      <defs>
        <marker id="dr-re" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
        </marker>
        <marker id="dr-be" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#1e40af" />
        </marker>
        <marker id="dr-bs" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M6,0 L6,6 L0,3 z" fill="#1e40af" />
        </marker>
        <marker id="dr-ge" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#475569" />
        </marker>
        <marker id="dr-gs" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M6,0 L6,6 L0,3 z" fill="#475569" />
        </marker>
        <marker id="dr-we" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
        </marker>
        <marker id="dr-ws" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M6,0 L6,6 L0,3 z" fill="#64748b" />
        </marker>
      </defs>

      {/* Overall system ring (dashed) */}
      <circle cx={CX} cy={CY} r={OR} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 3" />

      {/* Drum — filled blue */}
      <circle cx={CX} cy={CY} r={DR} fill="#dbeafe" stroke="#1e3a5f" strokeWidth="2" />

      {/* Center dot */}
      <circle cx={CX} cy={CY} r="3" fill="#1e3a5f" />

      {/* RADIUS: center → right drum edge */}
      <line x1={CX} y1={CY} x2={CX + DR} y2={CY}
        stroke="#dc2626" strokeWidth="1.5" markerEnd="url(#dr-re)" />
      <text x={CX + DR / 2} y={CY - 7}
        textAnchor="middle" fontSize="8.5" fill="#dc2626" fontWeight="700">RADIUS</text>

      {/* DRUM DIAMETER: double-headed arrow inside drum, lower third */}
      <line x1={CX - DR} y1={CY + 26} x2={CX + DR} y2={CY + 26}
        stroke="#1e40af" strokeWidth="1.5" markerStart="url(#dr-bs)" markerEnd="url(#dr-be)" />
      <text x={CX} y={CY + 38}
        textAnchor="middle" fontSize="8" fill="#1e40af" fontWeight="700">DRUM DIAMETER</text>

      {/* OVERALL SYSTEM DIAMETER: below outer ring */}
      <line x1={CX - OR} y1={CY + OR + 10} x2={CX + OR} y2={CY + OR + 10}
        stroke="#475569" strokeWidth="1.5" markerStart="url(#dr-gs)" markerEnd="url(#dr-ge)" />
      <line x1={CX - OR} y1={CY + OR} x2={CX - OR} y2={CY + OR + 12} stroke="#475569" strokeWidth="0.75" />
      <line x1={CX + OR} y1={CY + OR} x2={CX + OR} y2={CY + OR + 12} stroke="#475569" strokeWidth="0.75" />
      <text x={CX} y={CY + OR + 21}
        textAnchor="middle" fontSize="7.5" fill="#475569" fontWeight="600">OVERALL SYSTEM DIAMETER</text>

      {/* Base platform */}
      <rect x={leftX} y={platY} width={OR * 2} height={4} fill="#1e3a5f" rx="1" />
      {/* Left leg */}
      <rect x={leftX} y={platY + 4} width={4} height={legH} fill="#1e3a5f" rx="1" />
      {/* Right leg */}
      <rect x={rightX - 4} y={platY + 4} width={4} height={legH} fill="#1e3a5f" rx="1" />
      {/* Center divider post */}
      <rect x={CX - 2} y={platY} width={4} height={legH + 4} fill="#475569" rx="1" />

      {/* (A) Infeed label */}
      <text x={(leftX + CX) / 2} y={platY + legH + 14}
        textAnchor="middle" fontSize="10" fontWeight="700" fill="#374151">(A)</text>
      <text x={(leftX + CX) / 2} y={platY + legH + 24}
        textAnchor="middle" fontSize="7" fill="#6b7280">Infeed</text>

      {/* (B) Discharge label */}
      <text x={(CX + rightX) / 2} y={platY + legH + 14}
        textAnchor="middle" fontSize="10" fontWeight="700" fill="#374151">(B)</text>
      <text x={(CX + rightX) / 2} y={platY + legH + 24}
        textAnchor="middle" fontSize="7" fill="#6b7280">Discharge</text>

      {/* BELT WIDTH: right-side vertical bracket spanning drum diameter */}
      <line x1={rightX + 12} y1={CY - DR} x2={rightX + 12} y2={CY + DR}
        stroke="#64748b" strokeWidth="1.5" markerStart="url(#dr-ws)" markerEnd="url(#dr-we)" />
      <line x1={rightX} y1={CY - DR} x2={rightX + 14} y2={CY - DR} stroke="#64748b" strokeWidth="0.75" />
      <line x1={rightX} y1={CY + DR} x2={rightX + 14} y2={CY + DR} stroke="#64748b" strokeWidth="0.75" />
      <text
        x={rightX + 22} y={CY}
        textAnchor="middle" fontSize="7.5" fill="#64748b" fontWeight="600"
        transform={`rotate(90 ${rightX + 22} ${CY})`}
      >BELT WIDTH</text>
    </svg>
  )
}
