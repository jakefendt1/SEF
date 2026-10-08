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
import type { StoredTdConfig } from './tdConfigRecord'

function configsCol(uid: string) {
  return collection(db, 'users', uid, 'tdConfigurations')
}

function configDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'tdConfigurations', id)
}

export function subscribeTdConfigs(
  uid: string,
  onChange: (configs: StoredTdConfig[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(configsCol(uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data() as StoredTdConfig)),
    (err) => onError?.(err),
  )
}

/**
 * Whole-document write: anything not in `config` is erased, which is what lets a
 * rep remove a field. Resolves when the server has it; offline it stays
 * pending while Firestore keeps the write queued.
 */
export function putTdConfig(uid: string, config: StoredTdConfig): Promise<void> {
  return setDoc(configDoc(uid, config.id), config)
}

export function deleteTdConfigDoc(uid: string, id: string): Promise<void> {
  return deleteDoc(configDoc(uid, id))
}
