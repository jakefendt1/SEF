// A saved OneTrack BOM: the job, the lines as the rep chose them, and a
// snapshot of the part numbers and quantities they produced -- so reopening it
// can say honestly whether today's catalog gives the same BOM.
//
// Photos are not in the record. They stay on the device (IndexedDB, see
// lib/onetrack/photos.ts): Firestore documents cap at 1 MB.
import { emptyJob, resolveBom, type BomLine, type OnetrackJob } from './onetrack/bom'
import { emptyWorksheet } from './onetrack/wearstrip'
import { emptyDrawing, emptyShaftSpec } from './onetrack/shaft'
import { ONETRACK_VERSION } from './onetrack/version'
import type { Unit } from './measurement'

export interface BomSnapshotRow {
  partNumber: string
  qty: number | null
}

export interface StoredOnetrackBom {
  id: string
  /** Copied from the job for the list and the save dialog. */
  customer: string
  reference: string
  job: OnetrackJob
  unit: Unit
  lines: BomLine[]
  notes: string
  version: string
  snapshot: BomSnapshotRow[]
  createdAt: number
  updatedAt: number
}

export function snapshotOf(lines: readonly BomLine[], unit: Unit): BomSnapshotRow[] {
  return resolveBom(lines, unit).map((r) => ({ partNumber: r.partNumber, qty: r.qty }))
}

/**
 * Firestore rejects `undefined` anywhere in a document. A JSON round trip drops
 * undefined keys and keeps nulls, which is exactly the shape we want stored.
 */
function firestoreSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

export function buildRecord(args: {
  id: string
  job: OnetrackJob
  unit: Unit
  lines: readonly BomLine[]
  notes: string
  createdAt: number
  now: number
}): StoredOnetrackBom {
  const job = { ...args.job, customer: args.job.customer.trim(), line: args.job.line.trim() }
  return firestoreSafe({
    id: args.id,
    customer: job.customer,
    reference: job.line,
    job,
    unit: args.unit,
    lines: [...args.lines],
    notes: args.notes.trim(),
    version: ONETRACK_VERSION,
    snapshot: snapshotOf(args.lines, args.unit),
    createdAt: args.createdAt,
    updatedAt: args.now,
  })
}

/**
 * The editable state from a stored record. Fields a newer version added fall
 * back to their empty values. Reading never writes back.
 */
export function fromRecord(r: Partial<StoredOnetrackBom>): {
  job: OnetrackJob
  unit: Unit
  lines: BomLine[]
  notes: string
} {
  const job = { ...emptyJob('', ''), ...(r.job ?? {}) }
  const lines = (r.lines ?? []).map((l): BomLine => {
    if (l.kind === 'wearstrip') {
      return { ...l, worksheet: { ...emptyWorksheet(), ...l.worksheet, dims: { ...l.worksheet?.dims } } }
    }
    if (l.kind === 'shaft') {
      const base = emptyShaftSpec()
      return {
        ...l,
        spec: {
          ...base,
          ...l.spec,
          drive: { ...emptyDrawing(), ...l.spec?.drive },
          idle: { ...emptyDrawing(), ...l.spec?.idle },
          driveSprockets: { ...base.driveSprockets, ...l.spec?.driveSprockets },
          idleSprockets: { ...base.idleSprockets, ...l.spec?.idleSprockets },
        },
      }
    }
    return l
  })
  return { job, unit: r.unit === 'mm' ? 'mm' : 'in', lines, notes: r.notes ?? '' }
}

/** Recompute a saved BOM with today's catalog and say whether it moved. */
export function recheckRecord(r: StoredOnetrackBom): { changed: boolean; versionChanged: boolean } {
  const { lines, unit } = fromRecord(r)
  const now = snapshotOf(lines, unit)
  const then = r.snapshot ?? []
  const changed =
    now.length !== then.length || now.some((row, i) => row.partNumber !== then[i].partNumber || row.qty !== then[i].qty)
  return { changed, versionChanged: r.version !== ONETRACK_VERSION }
}

export function recordTitle(r: Pick<StoredOnetrackBom, 'customer' | 'reference'>): string {
  return [r.customer, r.reference].filter(Boolean).join(' · ') || 'Untitled BOM'
}
