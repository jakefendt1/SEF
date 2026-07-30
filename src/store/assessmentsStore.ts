import { create } from 'zustand'
import type { StoredAssessment } from '../lib/db'
import {
  putAssessment,
  deleteAssessmentDoc,
  subscribeAssessments,
} from '../lib/firestoreAssessments'
import { submitToSheets } from '../lib/api'
import type { FormValues } from '../schema/formSchema'

interface Store {
  uid: string | null
  assessments: StoredAssessment[]
  subscribe: (uid: string) => void
  unsubscribe: () => void
  upsert: (a: StoredAssessment) => Promise<void>
  saveDraft: (id: string, data: Partial<FormValues>) => Promise<void>
  submitAssessment: (id: string, data: FormValues) => Promise<'synced' | 'queued'>
  retryFailed: (id: string) => Promise<void>
  flushQueue: () => Promise<void>
  deleteAssessment: (id: string) => Promise<void>
}

let unsub: (() => void) | null = null

export const useAssessmentsStore = create<Store>((set, get) => ({
  uid: null,
  assessments: [],

  subscribe(uid) {
    if (get().uid === uid && unsub) return
    unsub?.()
    set({ uid, assessments: [] })
    unsub = subscribeAssessments(uid, (assessments) => set({ assessments }))
  },

  unsubscribe() {
    unsub?.()
    unsub = null
    set({ uid: null, assessments: [] })
  },

  async upsert(a) {
    const { uid } = get()
    if (!uid) return
    await putAssessment(uid, a)
  },

  async saveDraft(id, data) {
    const { assessments } = get()
    const now = Date.now()
    const existing = assessments.find((a) => a.id === id)
    await get().upsert({
      id,
      data,
      status: 'draft',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
  },

  async submitAssessment(id, data) {
    const { assessments } = get()
    const now = Date.now()
    const existing = assessments.find((a) => a.id === id)
    const base: StoredAssessment = {
      id,
      data,
      status: 'queued',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }

    if (!navigator.onLine) {
      await get().upsert(base)
      return 'queued'
    }

    try {
      await submitToSheets(id, data)
      await get().upsert({ ...base, status: 'synced', syncedAt: now })
      return 'synced'
    } catch {
      await get().upsert({ ...base, status: 'failed' })
      return 'queued'
    }
  },

  async retryFailed(id) {
    const { assessments } = get()
    const a = assessments.find((x) => x.id === id)
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
    const { uid } = get()
    if (!uid) return
    await deleteAssessmentDoc(uid, id)
  },
}))
