// End-on cross-section showing the belt on its support rails.
// Labels inside overhang, outside overhang, and rail spacing.

export function RailsDiagram() {
  // Belt is a wide horizontal band
  const beltY  = 52
  const beltH  = 18
  const beltL  = 30    // left edge of belt (inside overhang extends here)
  const beltR  = 270   // right edge of belt (outside overhang ends here)

  // Two rails under the belt
  const rail1X = 88   // inner rail center x
  const rail2X = 212  // outer rail center x
  const railW  = 10
  const railH  = 30
  const railY  = beltY + beltH

  // Dimension row y
  const dimY = railY + railH + 20

  return (
    <svg viewBox="0 0 300 160" className="w-full max-w-sm mx-auto" aria-label="Rails, overhang, and rail spacing diagram">
      <defs>
        <marker id="rd-ae" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
        </marker>
        <marker id="rd-as" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M6,0 L6,6 L0,3 z" fill="#dc2626" />
        </marker>
        <marker id="rd-ne" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#1e40af" />
        </marker>
        <marker id="rd-ns" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M6,0 L6,6 L0,3 z" fill="#1e40af" />
        </marker>
      </defs>

      {/* Belt */}
      <rect x={beltL} y={beltY} width={beltR - beltL} height={beltH}
        fill="#dbeafe" stroke="#1e3a5f" strokeWidth="1.5" rx="1" />

      {/* Inner rail */}
      <rect x={rail1X - railW / 2} y={railY} width={railW} height={railH}
        fill="#94a3b8" stroke="#475569" strokeWidth="1.5" rx="1" />

      {/* Outer rail */}
      <rect x={rail2X - railW / 2} y={railY} width={railW} height={railH}
        fill="#94a3b8" stroke="#475569" strokeWidth="1.5" rx="1" />

      {/* "DRUM" side marker */}
      <line x1={rail2X + 30} y1={beltY - 4} x2={rail2X + 30} y2={railY + railH + 4}
        stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
      <text x={rail2X + 34} y={beltY + 9} fontSize="8" fill="#64748b" fontWeight="600">DRUM</text>

      {/* "COLUMN" side marker */}
      <line x1={rail1X - 30} y1={beltY - 4} x2={rail1X - 30} y2={railY + railH + 4}
        stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
      <text x={rail1X - 32} y={beltY + 9} fontSize="8" fill="#64748b" fontWeight="600"
        textAnchor="end">COLUMN</text>

      {/* INSIDE OVERHANG: belt left edge → inner rail left edge */}
      <line x1={beltL} y1={dimY} x2={rail1X - railW / 2} y2={dimY}
        stroke="#dc2626" strokeWidth="1.5" markerStart="url(#rd-as)" markerEnd="url(#rd-ae)" />
      <line x1={beltL} y1={beltY + beltH} x2={beltL} y2={dimY + 3} stroke="#dc2626" strokeWidth="0.75" strokeDasharray="2 2" />
      <line x1={rail1X - railW / 2} y1={railY + railH} x2={rail1X - railW / 2} y2={dimY + 3} stroke="#dc2626" strokeWidth="0.75" strokeDasharray="2 2" />
      <text x={(beltL + rail1X - railW / 2) / 2} y={dimY + 13} textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="700">INSIDE</text>
      <text x={(beltL + rail1X - railW / 2) / 2} y={dimY + 22} textAnchor="middle" fontSize="8" fill="#dc2626">OVERHANG</text>

      {/* RAIL SPACING: inner rail right → outer rail left */}
      <line x1={rail1X + railW / 2} y1={dimY} x2={rail2X - railW / 2} y2={dimY}
        stroke="#1e40af" strokeWidth="1.5" markerStart="url(#rd-ns)" markerEnd="url(#rd-ne)" />
      <line x1={rail1X + railW / 2} y1={railY + railH} x2={rail1X + railW / 2} y2={dimY + 3} stroke="#1e40af" strokeWidth="0.75" strokeDasharray="2 2" />
      <line x1={rail2X - railW / 2} y1={railY + railH} x2={rail2X - railW / 2} y2={dimY + 3} stroke="#1e40af" strokeWidth="0.75" strokeDasharray="2 2" />
      <text x={(rail1X + rail2X) / 2} y={dimY + 13} textAnchor="middle" fontSize="8" fill="#1e40af" fontWeight="700">RAIL</text>
      <text x={(rail1X + rail2X) / 2} y={dimY + 22} textAnchor="middle" fontSize="8" fill="#1e40af">SPACING</text>

      {/* OUTSIDE OVERHANG: outer rail right → belt right edge */}
      <line x1={rail2X + railW / 2} y1={dimY} x2={beltR} y2={dimY}
        stroke="#dc2626" strokeWidth="1.5" markerStart="url(#rd-as)" markerEnd="url(#rd-ae)" />
      <line x1={rail2X + railW / 2} y1={railY + railH} x2={rail2X + railW / 2} y2={dimY + 3} stroke="#dc2626" strokeWidth="0.75" strokeDasharray="2 2" />
      <line x1={beltR} y1={beltY + beltH} x2={beltR} y2={dimY + 3} stroke="#dc2626" strokeWidth="0.75" strokeDasharray="2 2" />
      <text x={(rail2X + railW / 2 + beltR) / 2} y={dimY + 13} textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="700">OUTSIDE</text>
      <text x={(rail2X + railW / 2 + beltR) / 2} y={dimY + 22} textAnchor="middle" fontSize="8" fill="#dc2626">OVERHANG</text>
    </svg>
  )
}
