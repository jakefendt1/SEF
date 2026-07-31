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
import type { StoredRoiCalculation } from './roiCalculation'

function roiCalculationsCol(uid: string) {
  return collection(db, 'users', uid, 'roiCalculations')
}

function roiCalculationDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'roiCalculations', id)
}

export function subscribeRoiCalculations(
  uid: string,
  onChange: (calculations: StoredRoiCalculation[]) => void,
): () => void {
  const q = query(roiCalculationsCol(uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => d.data() as StoredRoiCalculation))
  })
}

export async function putRoiCalculation(uid: string, calc: StoredRoiCalculation): Promise<void> {
  await setDoc(roiCalculationDoc(uid, calc.id), calc)
}

export async function deleteRoiCalculationDoc(uid: string, id: string): Promise<void> {
  await deleteDoc(roiCalculationDoc(uid, id))
}
