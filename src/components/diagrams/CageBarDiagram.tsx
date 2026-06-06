export function CageBarDiagram() {
  return (
    <svg
      viewBox="0 0 220 160"
      className="w-full max-w-[220px] h-auto"
      aria-label="Cage bar cross-section dimensions"
    >
      {/* Bar body */}
      <rect x="60" y="55" width="100" height="50" rx="3" fill="#bfdbfe" stroke="#1e3a5f" strokeWidth="2" />

      {/* Width arrow */}
      <line x1="60" y1="120" x2="160" y2="120" stroke="#dc2626" strokeWidth="1.5"
        markerStart="url(#cbar-arrow-r)" markerEnd="url(#cbar-arrow)" />
      <text x="110" y="136" textAnchor="middle" fontSize="11" fill="#dc2626" fontWeight="bold">W</text>
      <text x="110" y="148" textAnchor="middle" fontSize="9" fill="#6b7280">Width</text>

      {/* Height arrow */}
      <line x1="170" y1="55" x2="170" y2="105" stroke="#1e40af" strokeWidth="1.5"
        markerStart="url(#cbar-arrow-r2)" markerEnd="url(#cbar-arrow2)" />
      <text x="188" y="84" textAnchor="middle" fontSize="11" fill="#1e40af" fontWeight="bold">H</text>
      <text x="188" y="96" textAnchor="middle" fontSize="9" fill="#6b7280">Height</text>

      {/* Cap indicator */}
      <rect x="60" y="45" width="100" height="12" rx="2" fill="#fde68a" stroke="#d97706" strokeWidth="1.5" />
      <text x="110" y="39" textAnchor="middle" fontSize="9" fill="#92400e">Cap Material</text>

      <defs>
        <marker id="cbar-arrow" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 z" fill="#dc2626" />
        </marker>
        <marker id="cbar-arrow-r" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto-start-reverse">
          <path d="M0,0 L0,5 L5,2.5 z" fill="#dc2626" />
        </marker>
        <marker id="cbar-arrow2" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 z" fill="#1e40af" />
        </marker>
        <marker id="cbar-arrow-r2" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto-start-reverse">
          <path d="M0,0 L0,5 L5,2.5 z" fill="#1e40af" />
        </marker>
      </defs>
    </svg>
  )
}
