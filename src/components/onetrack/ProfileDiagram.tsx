// End-on cross-sections of the wearstrip profile groups, with the dimensions
// the rep is asked for drawn as labelled callouts. Schematic, not to scale:
// they show *which* edge each letter means, like the Word form's dimension
// guide (Onetrack/assets/reference/form-dimension-guide.png).
import type { ProfileGroup } from '@/lib/onetrack/profiles'

const STRIP = 'fill-blue-100 stroke-brand'
const RAIL = 'fill-gray-400 stroke-gray-600'
const DIM = 'stroke-warning-orange'
const LABEL = 'fill-warning-orange text-[13px] font-semibold'

/** A dimension line with end ticks and a label. */
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
      <text
        x={(x1 + x2) / 2 + dx}
        y={(y1 + y2) / 2 + dy}
        className={LABEL}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  )
}

export function ProfileDiagram({ group }: { group: ProfileGroup }) {
  if (group === 'radius' || group === 'fixed') return null
  return (
    <svg viewBox="0 0 260 180" className="w-full max-w-sm h-auto" role="img" aria-label="Cross-section with the dimensions to measure">
      {group === 'flat' && (
        <>
          <rect x={95} y={40} width={70} height={100} rx={2} className={STRIP} strokeWidth={2} />
          <Dim x1={95} y1={25} x2={165} y2={25} label="W" dy={-9} />
          <Dim x1={185} y1={40} x2={185} y2={140} label="H" dx={14} />
        </>
      )}
      {group === 'flanged' && (
        <>
          {/* Wear surface on the left, flange standing up on the right. */}
          <path d="M80 70 H158 V30 H178 V150 H80 Z" className={STRIP} strokeWidth={2} />
          <text x={119} y={64} className="fill-gray-500 text-[11px]" textAnchor="middle">
            wear surface
          </text>
          <text x={186} y={44} className="fill-gray-500 text-[11px]">
            flange
          </text>
          <Dim x1={80} y1={163} x2={178} y2={163} label="W" dy={11} />
          <Dim x1={60} y1={70} x2={60} y2={150} label="H" dx={-12} />
          <line x1={56} y1={70} x2={80} y2={70} className="stroke-gray-300" strokeDasharray="3 3" />
        </>
      )}
      {group === 'angle' && (
        <>
          <path d="M80 40 H100 V120 H180 V140 H80 Z" className={STRIP} strokeWidth={2} />
          <Dim x1={80} y1={158} x2={180} y2={158} label="W" dy={13} />
          <Dim x1={60} y1={40} x2={60} y2={140} label="H" dx={-14} />
        </>
      )}
      {(group === 'clip' || group === 'other') && (
        <>
          {/* Support rail the strip clips onto */}
          <rect x={90} y={78} width={80} height={22} className={RAIL} strokeWidth={1.5} />
          {/* The wearstrip: a cap over the rail with retaining lips underneath */}
          <path
            d="M75 40 H185 V112 H160 V102 H175 V76 H85 V102 H100 V112 H75 Z"
            className={STRIP}
            strokeWidth={2}
          />
          <Dim x1={75} y1={25} x2={185} y2={25} label="W" dy={-9} />
          <Dim x1={205} y1={40} x2={205} y2={112} label="H" dx={14} />
          <Dim x1={90} y1={150} x2={170} y2={150} label="RW" dy={13} />
          <Dim x1={55} y1={78} x2={55} y2={100} label="RT" dx={-16} />
          <Dim x1={100} y1={126} x2={160} y2={126} label="O" dy={11} />
          <line x1={90} y1={100} x2={90} y2={150} className="stroke-gray-300" strokeDasharray="3 3" />
          <line x1={170} y1={100} x2={170} y2={150} className="stroke-gray-300" strokeDasharray="3 3" />
          <line x1={55} y1={78} x2={90} y2={78} className="stroke-gray-300" strokeDasharray="3 3" />
          <line x1={55} y1={100} x2={90} y2={100} className="stroke-gray-300" strokeDasharray="3 3" />
        </>
      )}
    </svg>
  )
}
