// Side view of the spiral showing stacked tiers, tier pitch, and take-up travel.

const TIERS = 8
const TIER_SPACING = 18
const TOP_Y = 24
const TIER_LEFT = 70
const TIER_RIGHT = 232
const ROLLER_X = 38
const ROLLER_R = 9
const BOTTOM_Y = TOP_Y + (TIERS - 1) * TIER_SPACING
const PITCH_TIER = 3

export function TakeUpLoopDiagram() {
  return (
    <svg viewBox="0 0 300 210" className="w-full max-w-sm mx-auto" aria-label="Tier pitch and take-up travel diagram">
      <defs>
        <marker id="tu-ae" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
        </marker>
        <marker id="tu-as" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M6,0 L6,6 L0,3 z" fill="#dc2626" />
        </marker>
        <marker id="tu-ne" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#1e40af" />
        </marker>
        <marker id="tu-ns" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M6,0 L6,6 L0,3 z" fill="#1e40af" />
        </marker>
        <marker id="tu-ge" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#475569" />
        </marker>
        <marker id="tu-gs" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M6,0 L6,6 L0,3 z" fill="#475569" />
        </marker>
      </defs>

      {/* Tier lines */}
      {Array.from({ length: TIERS }, (_, i) => (
        <line key={i} x1={TIER_LEFT} y1={TOP_Y + i * TIER_SPACING} x2={TIER_RIGHT} y2={TOP_Y + i * TIER_SPACING}
          stroke="#1e3a5f" strokeWidth="1.5" />
      ))}

      {/* Right-side boundary */}
      <line x1={TIER_RIGHT} y1={TOP_Y} x2={TIER_RIGHT} y2={BOTTOM_Y} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />

      {/* Take-up rollers */}
      <circle cx={ROLLER_X} cy={TOP_Y} r={ROLLER_R} fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
      <circle cx={ROLLER_X} cy={BOTTOM_Y} r={ROLLER_R} fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />

      {/* Vertical belt sections */}
      <line x1={ROLLER_X - ROLLER_R} y1={TOP_Y} x2={ROLLER_X - ROLLER_R} y2={BOTTOM_Y} stroke="#475569" strokeWidth="1.5" />
      <line x1={ROLLER_X + ROLLER_R} y1={TOP_Y} x2={ROLLER_X + ROLLER_R} y2={BOTTOM_Y} stroke="#475569" strokeWidth="1.5" />

      {/* Connect top and bottom tiers to rollers */}
      <line x1={ROLLER_X + ROLLER_R} y1={TOP_Y} x2={TIER_LEFT} y2={TOP_Y} stroke="#1e3a5f" strokeWidth="1.5" />
      <line x1={ROLLER_X + ROLLER_R} y1={BOTTOM_Y} x2={TIER_LEFT} y2={BOTTOM_Y} stroke="#1e3a5f" strokeWidth="1.5" />

      {/* TAKE UP TRAVEL: left bracket */}
      <line x1={10} y1={TOP_Y} x2={10} y2={BOTTOM_Y}
        stroke="#dc2626" strokeWidth="1.5" markerStart="url(#tu-as)" markerEnd="url(#tu-ae)" />
      <text
        x={5} y={(TOP_Y + BOTTOM_Y) / 2}
        textAnchor="middle" fontSize="7.5" fill="#dc2626" fontWeight="700"
        transform={`rotate(-90 5 ${(TOP_Y + BOTTOM_Y) / 2})`}
      >TAKE UP TRAVEL (MAX)</text>

      {/* TIER PITCH: right-side bracket between two adjacent tiers */}
      <line
        x1={TIER_RIGHT + 14} y1={TOP_Y + PITCH_TIER * TIER_SPACING}
        x2={TIER_RIGHT + 14} y2={TOP_Y + (PITCH_TIER + 1) * TIER_SPACING}
        stroke="#1e40af" strokeWidth="1.5" markerStart="url(#tu-ns)" markerEnd="url(#tu-ne)" />
      <line x1={TIER_RIGHT} y1={TOP_Y + PITCH_TIER * TIER_SPACING} x2={TIER_RIGHT + 16} y2={TOP_Y + PITCH_TIER * TIER_SPACING} stroke="#1e40af" strokeWidth="0.75" />
      <line x1={TIER_RIGHT} y1={TOP_Y + (PITCH_TIER + 1) * TIER_SPACING} x2={TIER_RIGHT + 16} y2={TOP_Y + (PITCH_TIER + 1) * TIER_SPACING} stroke="#1e40af" strokeWidth="0.75" />
      <text x={TIER_RIGHT + 22} y={TOP_Y + PITCH_TIER * TIER_SPACING + TIER_SPACING / 2 + 3}
        fontSize="8" fill="#1e40af" fontWeight="700">TIER PITCH</text>

      {/* NUMBER OF TIERS: far-right bracket */}
      <line x1={TIER_RIGHT + 50} y1={TOP_Y} x2={TIER_RIGHT + 50} y2={BOTTOM_Y}
        stroke="#475569" strokeWidth="1.5" markerStart="url(#tu-gs)" markerEnd="url(#tu-ge)" />
      <line x1={TIER_RIGHT + 14} y1={TOP_Y}    x2={TIER_RIGHT + 52} y2={TOP_Y}    stroke="#475569" strokeWidth="0.75" />
      <line x1={TIER_RIGHT + 14} y1={BOTTOM_Y} x2={TIER_RIGHT + 52} y2={BOTTOM_Y} stroke="#475569" strokeWidth="0.75" />
      <text
        x={TIER_RIGHT + 58} y={(TOP_Y + BOTTOM_Y) / 2}
        textAnchor="middle" fontSize="7.5" fill="#475569" fontWeight="700"
        transform={`rotate(90 ${TIER_RIGHT + 58} ${(TOP_Y + BOTTOM_Y) / 2})`}
      >NUMBER OF TIERS</text>

      {/* Labels */}
      <text x={TIER_LEFT + (TIER_RIGHT - TIER_LEFT) / 2} y={TOP_Y - 7} textAnchor="middle" fontSize="7.5" fill="#64748b">Tier 1 (Top)</text>
      <text x={TIER_LEFT + (TIER_RIGHT - TIER_LEFT) / 2} y={BOTTOM_Y + 13} textAnchor="middle" fontSize="7.5" fill="#64748b">Last Tier</text>
    </svg>
  )
}
