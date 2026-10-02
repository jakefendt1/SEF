// The single entry point: inputs -> everything the UI, the worker and the PDF
// show. Pure; no UI imports.
import { GRID, computeHeap } from './heap3d'
import { guardDragPerPocket, guardDragTotal, wallLoad } from './loads'
import { computePocket2D } from './pocket2d'
import { buildProfile } from './profiles'
import { buildWarnings } from './rules'
import type { SpillEdge } from './spill'
import { computeThroughput, densityLbIn3, massPerFlight } from './throughput'
import type { GridSize, TdInputs, TdResult } from './types'
import type { UnitSystem } from './units'
import { buildWidthModel, endTreatment, guardActsAsWall } from './width'

export interface TdComputed extends TdResult {
  spillEdges: SpillEdge[]
  /** The inputs this result was computed from. Views draw from these, never
   *  from the live form, so a result arriving a beat late can't be drawn
   *  against geometry it wasn't computed for. */
  inputs: TdInputs
}

export function dynamicRepose(inputs: TdInputs): number {
  if (inputs.calcLabMode) return inputs.reposeDeg
  return Math.max(0, inputs.reposeDeg - inputs.dynamicDerateDeg)
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function computeTdBulkDensity(
  inputs: TdInputs,
  grid: GridSize = 'fine',
  system: UnitSystem = 'imperial',
): TdComputed {
  const t0 = now()
  const gammaD = dynamicRepose(inputs)
  const width = buildWidthModel(inputs)
  const profile = buildProfile(
    inputs.flightType,
    inputs.flightHeightIn,
    inputs.flightThicknessIn,
    inputs.profileOverride,
  )
  const end = endTreatment(inputs)

  const base: TdComputed = {
    status: 'ok',
    statusReason: '',
    warnings: [],
    blocked: false,
    gammaDynamicDeg: gammaD,
    profile,
    width,
    endTreatment: end,
    voidPolygon: [],
    pocketRings: [],
    geometricCase: null,
    pocketAreaIn2: 0,
    pocketVolumeIn3: 0,
    wallsVolumeIn3: 0,
    edgeLossPct: 0,
    heap: null,
    throughput: null,
    wallLoad: null,
    guardDragPerPocketLbf: null,
    guardDragTotalLbf: null,
    computeMs: 0,
    spillEdges: [],
    inputs,
  }

  const finish = (r: TdComputed): TdComputed => {
    r.warnings = buildWarnings(
      inputs,
      {
        width,
        geometricCase: r.geometricCase,
        edgeLossPct: r.heap ? r.edgeLossPct : null,
        minSpeedFpm: r.throughput?.minSpeedFpm ?? null,
        profileVerified: profile.verified,
      },
      system,
    )
    r.blocked = r.warnings.some((w) => w.severity === 'error')
    r.computeMs = now() - t0
    return r
  }

  // Geometry the engine cannot draw at all.
  const geometryProblem =
    !(inputs.beltWidthIn > 0)
      ? 'Enter the belt width.'
      : !(inputs.inclineDeg > 0 && inputs.inclineDeg < 90)
        ? 'Enter an incline angle between 0° and 90°.'
        : !(profile.heightIn > 0)
          ? 'Enter the flight height.'
          : !(inputs.flightSpacingIn > inputs.flightThicknessIn + 1e-6)
            ? 'Flight spacing must be more than the flight thickness.'
            : !(width.carryWidthIn > 0)
              ? 'The indents, sidewalls and notches leave no carry width.'
              : ''
  if (geometryProblem) {
    return finish({ ...base, status: 'invalid-geometry', statusReason: geometryProblem })
  }

  const pocket = computePocket2D(profile, inputs.flightSpacingIn, inputs.inclineDeg, gammaD)
  const withPocket: TdComputed = {
    ...base,
    voidPolygon: pocket.voidPolygon,
    pocketRings: pocket.rings,
    geometricCase: pocket.geometricCase,
    pocketAreaIn2: pocket.areaIn2,
    wallsVolumeIn3: pocket.areaIn2 * width.carryWidthIn,
  }

  if (!end) {
    return finish({
      ...withPocket,
      status: 'needs-input',
      statusReason: 'Enter the frame guard clearance to the flight ends — it decides whether the guards hold product.',
    })
  }

  const g = GRID[grid]
  const heap = computeHeap({
    profile,
    spacingIn: inputs.flightSpacingIn,
    inclineDeg: inputs.inclineDeg,
    gammaDeg: gammaD,
    width,
    end,
    voidPolygon: pocket.voidPolygon,
    ...g,
  })

  const V = heap.volumeIn3
  const Vw = withPocket.wallsVolumeIn3
  const edgeLossPct = Vw > 0 ? Math.max(0, (1 - V / Vw) * 100) : 0

  const m = massPerFlight(inputs.densityLbFt3, inputs.fillPct, V)
  const throughput = computeThroughput({
    massLb: m,
    inclineDeg: inputs.inclineDeg,
    spacingIn: inputs.flightSpacingIn,
    carryWidthIn: width.carryWidthIn,
    beltWidthIn: inputs.beltWidthIn,
    speedFpm: inputs.beltSpeedFpm,
    targetLbPerHr: inputs.targetLbPerHr,
    inclineLengthFt: inputs.inclineLengthFt,
  })

  const load =
    end.kind === 'open'
      ? null
      : wallLoad(gammaD, densityLbIn3(inputs.densityLbFt3), heap.wallDepthAreaIn3, heap.wallMaxDepthIn)

  // Synchronized sidewalls move with the belt: no drag. Only stationary guards
  // that actually hold product drag on it.
  const stationaryGuards =
    inputs.containment === 'guards' && !inputs.calcLabMode && guardActsAsWall(inputs) && load
  const dragPerPocket = stationaryGuards ? guardDragPerPocket(inputs.wallFrictionMu, load.forcePerPocketLbf) : null
  const dragTotal =
    dragPerPocket !== null && inputs.inclineLengthFt !== null && inputs.inclineLengthFt > 0
      ? guardDragTotal(dragPerPocket, inputs.inclineLengthFt, inputs.flightSpacingIn)
      : null

  return finish({
    ...withPocket,
    pocketVolumeIn3: V,
    edgeLossPct,
    heap: heap.field,
    spillEdges: heap.edges,
    throughput,
    wallLoad: load,
    guardDragPerPocketLbf: dragPerPocket,
    guardDragTotalLbf: dragTotal,
  })
}
