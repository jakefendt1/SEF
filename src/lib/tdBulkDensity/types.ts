// Types for the ThermoDrive Bulk Density calculator engine.
//
// Coordinates (plan §2): the belt frame. x runs along the belt surface,
// positive uphill; y is normal to the belt, positive away from it; z runs
// across the flight width. Canonical units are inches, pounds, ft/min and
// lb/h -- conversion happens at the UI edge, never in here.

export type Series = 'S8026' | 'S8050' | 'S8140'
export type FlightType = 'deg90' | 'deg75' | 'scoop' | 'shortTopScoop'
export type Containment = 'open' | 'guards' | 'sidewalls' | 'sealed'
export type SidewallPitch = '25mm' | '40mm' | '50mm'

export type Point = readonly [number, number]

export interface FlightProfile {
  type: FlightType
  /** Nominal height: the tip's normal height above the belt. */
  heightIn: number
  thicknessIn: number
  /** Product-side (uphill) face, base -> tip, in local (u, v). */
  face: Point[]
  tip: Point
  /** False until the profile is confirmed against Intralox CAD. */
  verified: boolean
}

/** Everything the engine needs, in canonical units. */
export interface TdInputs {
  series: Series
  beltWidthIn: number
  inclineDeg: number
  /** Optional: length of the incline, ft. */
  inclineLengthFt: number | null
  /** Optional: throughput the line needs, lb/h. */
  targetLbPerHr: number | null
  /** Optional: belt speed, ft/min. */
  beltSpeedFpm: number | null

  flightType: FlightType
  flightHeightIn: number
  flightThicknessIn: number
  flightSpacingIn: number

  containment: Containment
  /** Indents per side when there are no sidewalls. */
  indentLeftIn: number
  indentRightIn: number
  /** Hold-down / limiter contact width per side. */
  holdDownWidthIn: number
  rollerLimiters: boolean
  /** Frame guard clearance to the flight end. Null = not entered. */
  guardClearanceIn: number | null
  notchCount: number
  notchWidthIn: number
  sidewallPitch: SidewallPitch
  sidewallHeightIn: number
  sidewallIndentIn: number
  sidewallGapIn: number

  densityLbFt3: number
  /** Static angle of repose, degrees. */
  reposeDeg: number
  smallestDimIn: number
  fillPct: number
  /** Dynamic derate subtracted from the static repose, degrees. */
  dynamicDerateDeg: number
  /** Optional product max belt speed, ft/min. */
  productMaxSpeedFpm: number | null
  /** Product-on-guard friction coefficient (UHMW default 0.3). */
  wallFrictionMu: number

  /** Walls at both flight ends and no dynamic derate, for legacy comparison. */
  calcLabMode: boolean

  /** Dev-only: a CAD-verified face replacing the parametric profile. */
  profileOverride?: Point[] | null
}

export type Severity = 'error' | 'warning' | 'info'

export interface Warning {
  id: string
  severity: Severity
  message: string
  /** Manual page, e.g. "p.75". Empty when the rule is the tool's own. */
  cite: string
  fix: string
}

/** Which spill edge set the surface. Index into EDGE_KINDS. */
export const EDGE_KINDS = ['trailing', 'leading', 'open', 'sidewall', 'notch'] as const
export type EdgeKind = (typeof EDGE_KINDS)[number]
/** Governing-edge value for a column with no flight behind it (a notch). */
export const EDGE_NONE = 255

export type GeometricCase = 'clears' | 'meets' | 'level'

/** How the outer flight ends are treated by the heap model. */
export type EndTreatment =
  | { kind: 'wall' }
  | { kind: 'open' }
  | { kind: 'sidewall'; heightIn: number }

export interface Segment {
  z0: number
  z1: number
}

export interface WidthModel {
  /** Flight width W_f -- the carry width before notches. */
  flightWidthIn: number
  /** Distance from the belt's left edge to the flight's left end. */
  flightOffsetIn: number
  /** Flight segments between notches, in flight coordinates (z = 0 at left end). */
  segments: Segment[]
  notches: Segment[]
  /** Sum of segment widths: what actually carries product. */
  carryWidthIn: number
  /** Per side, for drawing the end section. */
  left: SideBand
  right: SideBand
}

export interface SideBand {
  /** Indent from the belt edge (sidewall indent when sidewalls are fitted). */
  indentIn: number
  /** Sidewall footprint, 0 without sidewalls. */
  footprintIn: number
  /** Sidewall-to-flight gap, 0 without sidewalls. */
  gapIn: number
}

/**
 * The heap as columns over the (x, z) footprint. Every visual reads this;
 * nothing is drawn from separate math (plan §7).
 */
export interface HeapField {
  nx: number
  ny: number
  nz: number
  /** Cell sizes, in. */
  dx: number
  dy: number
  dz: number
  /** x of the first cell's lower edge (always 0: the trailing flight base). */
  x0: number
  /** Lowest and highest filled y per column (in), NaN where empty. Index ix * nz + iz. */
  bottom: Float32Array
  top: Float32Array
  /** EDGE_KINDS index governing the surface at each column, or EDGE_NONE. */
  governing: Uint8Array
  /** Retained cell count per column. */
  count: Uint16Array
  /** Same, for walls at both flight ends -- the ghost "full containment" heap. */
  ghostTop: Float32Array
}

export interface WallLoad {
  /** Max lateral pressure on the wall, psi. */
  maxPressurePsi: number
  /** Resultant force per pocket per side, lbf. */
  forcePerPocketLbf: number
}

export interface ThroughputResult {
  massPerFlightLb: number
  flightsPerMin: number | null
  throughputLbPerHr: number | null
  minSpeedFpm: number | null
  flightLoadLbf: number
  flightLoadLbfPerIn: number
  /** Flight load with the pocket brim-full (a surge), lbf and lbf/in. */
  flightLoadSurgeLbf: number | null
  flightLoadSurgeLbfPerIn: number | null
  beltLoadLbPerFt: number
  areaLoadLbPerFt2: number
  inclineProductLb: number | null
  inclineLiftLbf: number | null
}

/**
 * What each pocket actually carries for the application (not its capacity):
 * the product needed to hit the target throughput at the entered belt speed,
 * or, without both, the pocket filled to the fill factor.
 */
export interface PocketLoad {
  /** Share of the pocket's capacity this load needs (can exceed 1). */
  fraction: number
  source: 'target' | 'fill'
  /** Product per flight this load is, lb. */
  massLb: number
  overCapacity: boolean
  /** Height on the trailing flight face where the load's surface starts, in. Null when full. */
  crestIn: number | null
  volumeIn3: number
  /** The load as a heap field. Null when it fills the pocket (draw the capacity heap). */
  heap: HeapField | null
  /** Belt speed at which the target would fill pockets to capacity, ft/min. */
  speedForFullFpm: number | null
}

export type ComputeStatus = 'ok' | 'needs-input' | 'invalid-geometry'

export interface TdResult {
  status: ComputeStatus
  /** Human-readable reason when status is not ok. */
  statusReason: string
  warnings: Warning[]
  /** True when any warning is an error: results are not shown. */
  blocked: boolean
  gammaDynamicDeg: number
  profile: FlightProfile | null
  width: WidthModel | null
  endTreatment: EndTreatment | null
  voidPolygon: Point[]
  /** The clipped 2D pocket, as rings (outer rings and holes). */
  pocketRings: Point[][]
  geometricCase: GeometricCase | null
  pocketAreaIn2: number
  pocketVolumeIn3: number
  /** A_pocket x carry width: walls at both flight ends. */
  wallsVolumeIn3: number
  edgeLossPct: number
  heap: HeapField | null
  /** The application's actual load per pocket (see PocketLoad). */
  load: PocketLoad | null
  throughput: ThroughputResult | null
  wallLoad: WallLoad | null
  /** Stationary guards only: drag per pocket per side, lbf. */
  guardDragPerPocketLbf: number | null
  /** Total guard drag on the incline, lbf (both sides), when length is given. */
  guardDragTotalLbf: number | null
  /** Ms spent computing, for the performance budget. */
  computeMs: number
}

/** fine: final results · coarse: while editing · sweep: the ~25-point charts. */
export type GridSize = 'fine' | 'coarse' | 'sweep'
