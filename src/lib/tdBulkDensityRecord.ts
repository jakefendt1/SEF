// A saved ThermoDrive Bulk Density run: all inputs, the engine version, and a
// snapshot of the headline results, so reopening it can say honestly whether
// the current engine still gives the same answer.
import { computeTdBulkDensity, type TdComputed } from './tdBulkDensity/compute'
import { makeInputs } from './tdBulkDensity/defaults'
import type { Point, TdInputs } from './tdBulkDensity/types'
import type { UnitSystem } from './tdBulkDensity/units'
import { ENGINE_VERSION } from './tdBulkDensity/version'

export interface ResultsSnapshot {
  pocketAreaIn2: number
  pocketVolumeIn3: number
  massPerFlightLb: number
  throughputLbPerHr: number | null
  minSpeedFpm: number | null
  edgeLossPct: number
}

/** Firestore rejects nested arrays, so a CAD face is stored as {u, v} objects. */
type StoredInputs = Omit<TdInputs, 'profileOverride'> & { profileOverride: { u: number; v: number }[] | null }

export interface StoredTdRun {
  id: string
  /** Required, matching CalcLab's fields. */
  customer: string
  reference: string
  notes: string
  inputs: StoredInputs
  /** The units the run was entered in, so it reopens the way it was typed. */
  system: UnitSystem
  productPreset: string
  engineVersion: string
  results: ResultsSnapshot | null
  createdAt: number
  updatedAt: number
}

export function snapshotOf(r: TdComputed | null): ResultsSnapshot | null {
  if (!r || r.status !== 'ok' || !r.throughput) return null
  return {
    pocketAreaIn2: r.pocketAreaIn2,
    pocketVolumeIn3: r.pocketVolumeIn3,
    massPerFlightLb: r.throughput.massPerFlightLb,
    throughputLbPerHr: r.throughput.throughputLbPerHr,
    minSpeedFpm: r.throughput.minSpeedFpm,
    edgeLossPct: r.edgeLossPct,
  }
}

export function toStoredInputs(i: TdInputs): StoredInputs {
  return {
    ...i,
    profileOverride: i.profileOverride ? i.profileOverride.map(([u, v]) => ({ u, v })) : null,
  }
}

/**
 * Inputs from a stored record. Missing fields (a record written by an older
 * version) fall back to the engine defaults. Reading never writes back.
 */
export function fromStoredInputs(s: Partial<StoredInputs>): TdInputs {
  const { profileOverride, ...rest } = s
  return makeInputs({
    ...rest,
    profileOverride: profileOverride ? profileOverride.map((p): Point => [p.u, p.v]) : null,
  })
}

export function buildRun(args: {
  id: string
  customer: string
  reference: string
  notes: string
  inputs: TdInputs
  system: UnitSystem
  productPreset: string
  result: TdComputed | null
  createdAt: number
  now: number
}): StoredTdRun {
  return {
    id: args.id,
    customer: args.customer.trim(),
    reference: args.reference.trim(),
    notes: args.notes.trim(),
    inputs: toStoredInputs(args.inputs),
    system: args.system,
    productPreset: args.productPreset,
    engineVersion: ENGINE_VERSION,
    results: snapshotOf(args.result),
    createdAt: args.createdAt,
    updatedAt: args.now,
  }
}

export function runTitle(r: Pick<StoredTdRun, 'customer' | 'reference'>): string {
  return [r.customer, r.reference].filter(Boolean).join(' · ') || 'Untitled run'
}

const REL_TOL = 0.005

function differs(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return a !== b
  const scale = Math.max(Math.abs(a), Math.abs(b), 1e-9)
  return Math.abs(a - b) / scale > REL_TOL
}

/**
 * Recompute a saved run with the current engine and compare it with what was
 * saved. Results are "changed" when any headline figure moved by more than
 * 0.5% (grid noise is well under that).
 */
export function recheckRun(run: StoredTdRun): {
  inputs: TdInputs
  result: TdComputed
  changed: boolean
  engineChanged: boolean
} {
  const inputs = fromStoredInputs(run.inputs)
  const result = computeTdBulkDensity(inputs, 'fine', run.system)
  const now = snapshotOf(result)
  const then = run.results
  const changed =
    then && now
      ? differs(then.pocketVolumeIn3, now.pocketVolumeIn3) ||
        differs(then.massPerFlightLb, now.massPerFlightLb) ||
        differs(then.throughputLbPerHr, now.throughputLbPerHr) ||
        differs(then.minSpeedFpm, now.minSpeedFpm)
      : !!then !== !!now
  return { inputs, result, changed, engineChanged: run.engineVersion !== ENGINE_VERSION }
}

export function validateRunMeta(customer: string, reference: string): string[] {
  const missing: string[] = []
  if (!customer.trim()) missing.push('Customer')
  if (!reference.trim()) missing.push('Reference')
  return missing
}
