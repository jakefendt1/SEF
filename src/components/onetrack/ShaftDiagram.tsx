// A drive or idle shaft, side on, laid out like the spec sheet: End 1 on the
// left, End 2 on the right, with the letter for each dimension the rep types.
// Schematic, not to scale.

const BODY = 'fill-gray-200 stroke-gray-700'
const DIM = 'stroke-warning-orange'
const LABEL = 'fill-warning-orange text-[14px] font-semibold'

function Dim({ x1, y1, x2, y2, label, dx = 0, dy = 0 }: { x1: number; y1: number; x2: number; y2: number; label: string; dx?: number; dy?: number }) {
  const vertical = x1 === x2
  const t = 5
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className={DIM} strokeWidth={1.5} />
      {vertical ? (
        <>
          <line x1={x1 - t} y1={y1} x2={x1 + t} y2={y1} className={DIM} strokeWidth={1.5} />
          <line x1={x2 - t} y1={y2} x2={x2 + t} y2={y2} className={DIM} strokeWidth={1.5} />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - t} x2={x1} y2={y1 + t} className={DIM} strokeWidth={1.5} />
          <line x1={x2} y1={y2 - t} x2={x2} y2={y2 + t} className={DIM} strokeWidth={1.5} />
        </>
      )}
      <text x={(x1 + x2) / 2 + dx} y={(y1 + y2) / 2 + dy} className={LABEL} textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
    </g>
  )
}

export function ShaftDiagram({
  keywayEnd,
  grooves,
  offCenter,
}: {
  /** Drive shafts can have a keyway on one end. */
  keywayEnd: 1 | 2 | null
  grooves: boolean
  offCenter: boolean
}) {
  const [l, r] = [40, 480]
  const [j1, j2] = [105, 415]
  const [g1, g2] = offCenter ? [170, 290] : [200, 320]
  const kx = keywayEnd === 1 ? l + 8 : j2 + 12
  return (
    <svg viewBox="0 0 520 190" className="w-full h-auto" role="img" aria-label="Shaft with the dimensions to fill in">
      <rect x={l} y={78} width={j1 - l} height={34} className={BODY} strokeWidth={2} />
      <rect x={j2} y={78} width={r - j2} height={34} className={BODY} strokeWidth={2} />
      <rect x={j1} y={60} width={j2 - j1} height={70} className={BODY} strokeWidth={2} />
      {grooves &&
        [g1, g2].map((x) => (
          <g key={x}>
            <line x1={x} y1={60} x2={x} y2={66} className="stroke-gray-700" strokeWidth={4} />
            <line x1={x} y1={124} x2={x} y2={130} className="stroke-gray-700" strokeWidth={4} />
          </g>
        ))}
      {keywayEnd && <rect x={kx} y={89} width={48} height={12} rx={6} className="fill-white stroke-gray-700" strokeWidth={1.5} />}

      <text x={l} y={160} className="fill-foreground text-[13px] font-semibold">END 1</text>
      <text x={r} y={160} className="fill-foreground text-[13px] font-semibold" textAnchor="end">END 2</text>

      <Dim x1={l} y1={18} x2={r} y2={18} label="L" dy={-9} />
      <Dim x1={l} y1={44} x2={j1} y2={44} label="J1" dy={-9} />
      <Dim x1={j2} y1={44} x2={r} y2={44} label="J2" dy={-9} />
      <Dim x1={20} y1={78} x2={20} y2={112} label="D1" dx={-2} dy={-26} />
      <Dim x1={500} y1={78} x2={500} y2={112} label="D2" dx={2} dy={-26} />
      {grooves && <Dim x1={g1} y1={146} x2={g2} y2={146} label="G" dy={13} />}
      {grooves && offCenter && <Dim x1={j1} y1={172} x2={g1} y2={172} label="F" dy={-10} />}
      {keywayEnd && (
        <text x={kx + 24} y={74} className={LABEL} textAnchor="middle">
          K
        </text>
      )}
    </svg>
  )
}
