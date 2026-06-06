import { create } from 'zustand'
import { dbGetAll, dbPut, dbGet, dbDelete, type StoredAssessment } from '../lib/db'
import { submitToSheets } from '../lib/api'
import type { FormValues } from '../schema/formSchema'

interface Store {
  assessments: StoredAssessment[]
  load: () => Promise<void>
  upsert: (a: StoredAssessment) => Promise<void>
  saveDraft: (id: string, data: Partial<FormValues>) => Promise<void>
  submitAssessment: (id: string, data: FormValues) => Promise<'synced' | 'queued'>
  retryFailed: (id: string) => Promise<void>
  flushQueue: () => Promise<void>
  deleteAssessment: (id: string) => Promise<void>
}

export const useAssessmentsStore = create<Store>((set, get) => ({
  assessments: [],

  async load() {
    const all = await dbGetAll()
    set({ assessments: all.sort((a, b) => b.updatedAt - a.updatedAt) })
  },

  async upsert(a) {
    await dbPut(a)
    await get().load()
  },

  async saveDraft(id, data) {
    const now = Date.now()
    const existing = await dbGet(id)
    await get().upsert({
      id,
      data,
      status: 'draft',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
  },

  async submitAssessment(id, data) {
    const now = Date.now()
    const existing = await dbGet(id)
    // Always save locally first
    await get().upsert({
      id,
      data,
      status: 'synced',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      syncedAt: now,
    })
    // Fire-and-forget background sync to Google Sheets
    if (navigator.onLine) {
      submitToSheets(id, data).catch(() => undefined)
    }
    return 'synced'
  },

  async retryFailed(id) {
    const a = await dbGet(id)
    if (!a || a.status !== 'failed') return
    try {
      await submitToSheets(a.id, a.data as FormValues)
      await get().upsert({ ...a, status: 'synced', syncedAt: Date.now(), updatedAt: Date.now() })
    } catch {
      await get().upsert({ ...a, status: 'failed', updatedAt: Date.now() })
    }
  },

  async flushQueue() {
    const queued = get().assessments.filter((a) => a.status === 'queued')
    for (const a of queued) {
      try {
        await submitToSheets(a.id, a.data as FormValues)
        await get().upsert({ ...a, status: 'synced', syncedAt: Date.now(), updatedAt: Date.now() })
      } catch {
        await get().upsert({ ...a, status: 'failed', updatedAt: Date.now() })
      }
    }
  },

  async deleteAssessment(id) {
    await dbDelete(id)
    await get().load()
  },
}))
