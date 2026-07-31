import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { StoredAssessment } from './db'

function assessmentsCol(uid: string) {
  return collection(db, 'users', uid, 'assessments')
}

function assessmentDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'assessments', id)
}

export function subscribeAssessments(
  uid: string,
  onChange: (assessments: StoredAssessment[]) => void,
): () => void {
  const q = query(assessmentsCol(uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => d.data() as StoredAssessment))
  })
}

export async function putAssessment(uid: string, a: StoredAssessment): Promise<void> {
  await setDoc(assessmentDoc(uid, a.id), a)
}

/**
 * Patch metadata on an existing record without touching `data`.
 *
 * Deliberately `updateDoc`, not `setDoc({merge:true})`: merge is deep for
 * maps, so a merged write against `data` could never *clear* an answer. This
 * helper is only for top-level metadata (title, status), never the answers.
 */
export async function updateAssessmentFields(
  uid: string,
  id: string,
  patch: Partial<Pick<StoredAssessment, 'title' | 'updatedAt'>>,
): Promise<void> {
  await updateDoc(assessmentDoc(uid, id), patch)
}

export async function deleteAssessmentDoc(uid: string, id: string): Promise<void> {
  await deleteDoc(assessmentDoc(uid, id))
}
