import { openDB, type IDBPDatabase } from 'idb'
import type { FormValues } from '../schema/formSchema'

/**
 * An evaluation is either still being worked on, or the rep has said they're
 * done with it.
 *
 * There used to be four states -- draft/queued/synced/failed -- because
 * finishing an evaluation also pushed a row to a Google Sheet that could fail.
 * That Sheet was never read by anyone, so the whole delivery mechanism was
 * removed along with the three states that only existed to describe it.
 * See `normalizeAssessment` for how records written under the old model are
 * read back.
 */
export type AssessmentStatus = 'draft' | 'complete'

export interface StoredAssessment {
  id: string
  data: Partial<FormValues>
  status: AssessmentStatus
  createdAt: number
  updatedAt: number
  /** When the rep marked it complete. */
  completedAt?: number
  /** User-chosen name. Optional and backward compatible: records saved before
   *  rename existed fall back to a title derived from the form data. */
  title?: string
}

/** Shape of a record as it may exist in Firestore, including pre-2026-08 ones. */
interface RawAssessment extends Omit<StoredAssessment, 'status'> {
  status: string
  /** Old name for completedAt, from when finishing meant pushing to a Sheet. */
  syncedAt?: number
}

/**
 * Read a stored record under the current model, whatever model wrote it.
 *
 * Applied at the Firestore boundary so nothing downstream has to know the old
 * states ever existed. Records are not rewritten -- a read must never trigger
 * a write, which is the bug class that once destroyed completed evaluations.
 */
export function normalizeAssessment(raw: RawAssessment): StoredAssessment {
  // 'synced' was delivered; 'queued' and 'failed' were both "the rep pressed
  // Submit and we couldn't deliver". All three mean the rep considered it
  // finished, and delivery no longer exists, so all three are 'complete'.
  const status: AssessmentStatus = raw.status === 'draft' ? 'draft' : 'complete'
  const completedAt = raw.completedAt ?? raw.syncedAt

  const out: StoredAssessment = {
    id: raw.id,
    data: raw.data,
    status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
  if (completedAt !== undefined) out.completedAt = completedAt
  if (raw.title !== undefined) out.title = raw.title
  return out
}

let _db: IDBPDatabase | null = null

async function getDb() {
  if (!_db) {
    _db = await openDB('spiral-eval', 1, {
      upgrade(db) {
        db.createObjectStore('assessments', { keyPath: 'id' })
      },
    })
  }
  return _db
}

export async function dbGetAll(): Promise<StoredAssessment[]> {
  const db = await getDb()
  return db.getAll('assessments')
}

export async function dbGet(id: string): Promise<StoredAssessment | undefined> {
  const db = await getDb()
  return db.get('assessments', id)
}

export async function dbPut(a: StoredAssessment): Promise<void> {
  const db = await getDb()
  await db.put('assessments', a)
}

export async function dbDelete(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('assessments', id)
}
