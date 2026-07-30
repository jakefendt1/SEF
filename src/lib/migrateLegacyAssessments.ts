import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { dbGetAll } from './db'
import { putAssessment } from './firestoreAssessments'

function migrationKey(uid: string): string {
  return `sef.migrated.v1.${uid}`
}

export async function migrateLegacyAssessmentsForUser(uid: string): Promise<void> {
  if (localStorage.getItem(migrationKey(uid))) return

  const legacy = await dbGetAll()

  for (const a of legacy) {
    try {
      const remoteRef = doc(db, 'users', uid, 'assessments', a.id)
      const remoteSnap = await getDoc(remoteRef)
      if (remoteSnap.exists()) {
        const remote = remoteSnap.data() as { updatedAt?: number }
        if ((remote.updatedAt ?? 0) >= a.updatedAt) continue
      }
      await putAssessment(uid, a)
    } catch (err) {
      console.error('[migrateLegacyAssessments] failed for', a.id, err)
    }
  }

  localStorage.setItem(migrationKey(uid), '1')
}
