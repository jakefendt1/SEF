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

/**
 * The keyway, two ways: looking at the end of the shaft (width and depth) and
 * from the side (where it starts and how long it runs, including the rounded
 * end the cutter leaves).
 */
export function KeywayDiagram() {
  return (
    <svg viewBox="0 0 520 200" className="w-full h-auto" role="img" aria-label="Keyway width, depth, length and start">
      {/* End view */}
      <text x={100} y={16} className="fill-foreground text-[13px] font-semibold" textAnchor="middle">
        Looking at the shaft end
      </text>
      <circle cx={100} cy={115} r={62} className={BODY} strokeWidth={2} />
      {/* The slot is cut down into the shaft from its top surface. */}
      <rect x={82} y={48} width={36} height={29} className="fill-white" />
      <path d="M82 56 V77 H118 V56" className="fill-none stroke-gray-700" strokeWidth={2} />
      <Dim x1={82} y1={36} x2={118} y2={36} label="W" dy={-10} />
      <Dim x1={140} y1={53} x2={140} y2={77} label="Dp" dx={16} />
      <line x1={118} y1={53} x2={145} y2={53} className="stroke-gray-300" strokeDasharray="3 3" />
      <line x1={118} y1={77} x2={145} y2={77} className="stroke-gray-300" strokeDasharray="3 3" />

      {/* Side view */}
      <text x={360} y={16} className="fill-foreground text-[13px] font-semibold" textAnchor="middle">
        From the side
      </text>
      <rect x={220} y={80} width={270} height={60} className={BODY} strokeWidth={2} />
      <line x1={490} y1={70} x2={490} y2={150} className="stroke-gray-700" strokeWidth={1} strokeDasharray="4 3" />
      <text x={486} y={157} className="fill-foreground text-[12px]" textAnchor="end">
        shaft end
      </text>
      <rect x={300} y={80} width={150} height={14} rx={7} className="fill-white stroke-gray-700" strokeWidth={2} />
      <Dim x1={300} y1={58} x2={450} y2={58} label="Ln (includes the arc)" dy={-10} />
      <Dim x1={450} y1={186} x2={490} y2={186} label="S" dy={-9} />
      <line x1={450} y1={94} x2={450} y2={190} className="stroke-gray-300" strokeDasharray="3 3" />
      <line x1={490} y1={150} x2={490} y2={190} className="stroke-gray-300" strokeDasharray="3 3" />
    </svg>
  )
}

/** A tapped hole in the end of the shaft: how deep, what screw, and which end. */
export function DrillTapDiagram() {
  return (
    <svg viewBox="0 0 520 170" className="w-full h-auto" role="img" aria-label="Drill and tap depth in the shaft end">
      <text x={260} y={16} className="fill-foreground text-[13px] font-semibold" textAnchor="middle">
        Cut through the end of the shaft
      </text>
      <rect x={60} y={50} width={400} height={80} className={BODY} strokeWidth={2} />
      {/* Tapped hole on the shaft's centre line, drilled in from the end face */}
      <rect x={330} y={76} width={130} height={28} className="fill-white stroke-gray-700" strokeWidth={1.5} />
      <path d="M330 76 L316 90 L330 104" className="fill-white stroke-gray-700" strokeWidth={1.5} />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={338 + i * 10} y1={76} x2={334 + i * 10} y2={104} className="stroke-gray-500" strokeWidth={1} />
      ))}
      <line x1={40} y1={90} x2={480} y2={90} className="stroke-gray-400" strokeDasharray="8 4 2 4" />
      <Dim x1={330} y1={150} x2={460} y2={150} label="Depth (from the end face)" dy={-10} />
      <line x1={330} y1={104} x2={330} y2={154} className="stroke-gray-300" strokeDasharray="3 3" />
      <line x1={460} y1={130} x2={460} y2={154} className="stroke-gray-300" strokeDasharray="3 3" />
      <line x1={395} y1={76} x2={395} y2={36} className="stroke-gray-500" />
      <text x={505} y={34} className="fill-foreground text-[12px]" textAnchor="end">Screw size and threads per inch, e.g. 1/2-13</text>
    </svg>
  )
}
