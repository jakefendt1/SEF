import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { StoredTdRun } from './tdBulkDensityRecord'

function runsCol(uid: string) {
  return collection(db, 'users', uid, 'tdBulkDensityRuns')
}

function runDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'tdBulkDensityRuns', id)
}

export function subscribeTdRuns(
  uid: string,
  onChange: (runs: StoredTdRun[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(runsCol(uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data() as StoredTdRun)),
    (err) => onError?.(err),
  )
}

/**
 * Whole-document write: anything not in `run` is erased, which is what lets a
 * user clear a field. The returned promise resolves when the server has the
 * write; offline it stays pending while Firestore keeps the write queued.
 */
export function putTdRun(uid: string, run: StoredTdRun): Promise<void> {
  return setDoc(runDoc(uid, run.id), run)
}

export function deleteTdRunDoc(uid: string, id: string): Promise<void> {
  return deleteDoc(runDoc(uid, id))
}
