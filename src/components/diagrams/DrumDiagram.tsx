interface Props {
  basis: 'Diameter' | 'Radius' | undefined
}

export function DrumDiagram({ basis }: Props) {
  const isDiam = basis !== 'Radius'
  return (
    <svg
      viewBox="0 0 200 140"
      className="w-full max-w-[200px] h-auto"
      aria-label={`Drum measurement: ${isDiam ? 'Diameter' : 'Radius'}`}
    >
      {/* Drum circle */}
      <circle cx="100" cy="70" r="50" fill="#dbeafe" stroke="#1e3a5f" strokeWidth="2.5" />
      {/* Center dot */}
      <circle cx="100" cy="70" r="3" fill="#1e3a5f" />

      {isDiam ? (
        <>
          {/* Diameter line */}
          <line x1="50" y1="70" x2="150" y2="70" stroke="#dc2626" strokeWidth="2" markerEnd="url(#arrow)" markerStart="url(#arrow-r)" />
          {/* Label */}
          <text x="100" y="58" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">D</text>
          <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#374151">Diameter</text>
        </>
      ) : (
        <>
          {/* Radius line */}
          <line x1="100" y1="70" x2="150" y2="70" stroke="#dc2626" strokeWidth="2" markerEnd="url(#arrow)" />
          {/* Label */}
          <text x="127" y="64" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">R</text>
          <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#374151">Radius</text>
        </>
      )}

      {/* Arrow markers */}
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
        </marker>
        <marker id="arrow-r" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
        </marker>
      </defs>
    </svg>
  )
}
