import type { SavedCalculation } from './calculator'
import { SAVED_CALCULATIONS_KEY } from './calculator'
import { putRoiCalculation } from './firestoreRoiCalculations'
import type { StoredRoiCalculation } from './roiCalculation'

function migrationKey(uid: string): string {
  return `roi.migrated.v1.${uid}`
}

export async function importLegacyRoiCalculationsForUser(
  uid: string,
  existing: StoredRoiCalculation[],
): Promise<void> {
  if (localStorage.getItem(migrationKey(uid))) return

  const raw = localStorage.getItem(SAVED_CALCULATIONS_KEY)
  const legacy: SavedCalculation[] = raw ? JSON.parse(raw) : []

  for (const calc of legacy) {
    if (existing.some((e) => e.name === calc.name)) continue
    try {
      const now = new Date(calc.savedAt).getTime() || Date.now()
      await putRoiCalculation(uid, {
        id: crypto.randomUUID(),
        name: calc.name,
        data: calc.data,
        createdAt: now,
        updatedAt: now,
      })
    } catch (err) {
      console.error('[importLegacyRoiCalculations] failed for', calc.name, err)
    }
  }

  localStorage.setItem(migrationKey(uid), '1')
}
