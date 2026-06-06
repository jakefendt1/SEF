import { openDB, type IDBPDatabase } from 'idb'
import type { FormValues } from '../schema/formSchema'

export interface StoredAssessment {
  id: string
  data: Partial<FormValues>
  status: 'draft' | 'queued' | 'synced' | 'failed'
  createdAt: number
  updatedAt: number
  syncedAt?: number
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
