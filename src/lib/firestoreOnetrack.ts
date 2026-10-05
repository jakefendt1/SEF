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
import type { StoredOnetrackBom } from './onetrackRecord'

function bomsCol(uid: string) {
  return collection(db, 'users', uid, 'onetrackBoms')
}

function bomDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'onetrackBoms', id)
}

export function subscribeOnetrackBoms(
  uid: string,
  onChange: (boms: StoredOnetrackBom[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(bomsCol(uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data() as StoredOnetrackBom)),
    (err) => onError?.(err),
  )
}

/**
 * Whole-document write: anything not in `bom` is erased, which is what lets a
 * rep remove a line. Resolves when the server has it; offline it stays
 * pending while Firestore keeps the write queued.
 */
export function putOnetrackBom(uid: string, bom: StoredOnetrackBom): Promise<void> {
  return setDoc(bomDoc(uid, bom.id), bom)
}

export function deleteOnetrackBomDoc(uid: string, id: string): Promise<void> {
  return deleteDoc(bomDoc(uid, id))
}
