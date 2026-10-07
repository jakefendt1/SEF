// Firestore for access grants and the admin's user list. Every read is a live
// subscription (onSnapshot): Firebase pushes changes as they happen, so a new
// sign-up or a flipped switch shows up without anyone refreshing or polling.
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { accessDocId, type AccessGrant } from './access'

export function subscribeMyAccess(
  email: string,
  onChange: (grant: AccessGrant | null) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'access', accessDocId(email)),
    (snap) => onChange(snap.exists() ? (snap.data() as AccessGrant) : null),
    (err) => onError?.(err),
  )
}

/** Admin only: every grant. */
export function subscribeAllAccess(
  onChange: (grants: AccessGrant[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, 'access'),
    (snap) => onChange(snap.docs.map((d) => d.data() as AccessGrant)),
    (err) => onError?.(err),
  )
}

export interface ProfileRow {
  email: string
  displayName?: string
}

/** Admin only: everyone who has signed in (each gets a users/{uid} profile on first sign-in). */
export function subscribeAllProfiles(
  onChange: (profiles: ProfileRow[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => onChange(snap.docs.map((d) => d.data() as ProfileRow)),
    (err) => onError?.(err),
  )
}

/** Admin only. Whole-document write: the tools list is the grant. */
export function putAccess(email: string, tools: string[], adminEmail: string): Promise<void> {
  const grant: AccessGrant = { email: accessDocId(email), tools, updatedAt: Date.now(), updatedBy: adminEmail }
  return setDoc(doc(db, 'access', accessDocId(email)), grant)
}
