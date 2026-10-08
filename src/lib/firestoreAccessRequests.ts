// Firestore for access requests (see accessRequests.ts). Live subscriptions,
// like firestoreAccess.ts: a request shows on the admin's page within a
// second or two, and the requester's tile flips to "Requested" just as fast.
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore'
import { db } from './firebase'
import { accessDocId } from './access'
import { requestDocId, type AccessRequest } from './accessRequests'

const COLLECTION = 'accessRequests'

/** The signed-in person's own requests. The where() is what the rules allow. */
export function subscribeMyRequests(
  email: string,
  onChange: (requests: AccessRequest[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    query(collection(db, COLLECTION), where('email', '==', accessDocId(email))),
    (snap) => onChange(snap.docs.map((d) => d.data() as AccessRequest)),
    (err) => onError?.(err),
  )
}

/** Admin only: every open request. */
export function subscribeAllRequests(
  onChange: (requests: AccessRequest[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => onChange(snap.docs.map((d) => d.data() as AccessRequest)),
    (err) => onError?.(err),
  )
}

export function putRequest(req: AccessRequest): Promise<void> {
  return setDoc(doc(db, COLLECTION, requestDocId(req.email, req.toolId)), req)
}

/** Requester cancels, or the admin approves / declines. */
export function deleteRequest(email: string, toolId: string): Promise<void> {
  return deleteDoc(doc(db, COLLECTION, requestDocId(email, toolId)))
}
