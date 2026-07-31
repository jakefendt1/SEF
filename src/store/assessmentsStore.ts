import { create } from 'zustand'
import type { StoredAssessment } from '../lib/db'
import {
  putAssessment,
  deleteAssessmentDoc,
  subscribeAssessments,
} from '../lib/firestoreAssessments'
import { submitToSheets } from '../lib/api'
import { countFilled } from '../lib/autosaveGuard'
import type { FormValues } from '../schema/formSchema'

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: 'offline' | 'error'; message: string }

interface Store {
  uid: string | null
  assessments: StoredAssessment[]
  loaded: boolean
  subscribe: (uid: string) => void
  unsubscribe: () => void
  upsert: (a: StoredAssessment) => Promise<void>
  saveDraft: (id: string, data: Partial<FormValues>) => Promise<void>
  submitAssessment: (id: string, data: FormValues) => Promise<SubmitResult>
  retryFailed: (id: string) => Promise<void>
  flushQueue: () => Promise<void>
  deleteAssessment: (id: string) => Promise<void>
}

let unsub: (() => void) | null = null

export const useAssessmentsStore = create<Store>((set, get) => ({
  uid: null,
  assessments: [],
  loaded: false,

  subscribe(uid) {
    if (get().uid === uid && unsub) return
    unsub?.()
    set({ uid, assessments: [], loaded: false })
    unsub = subscribeAssessments(uid, (assessments) => set({ assessments, loaded: true }))
  },

  unsubscribe() {
    unsub?.()
    unsub = null
    set({ uid: null, assessments: [], loaded: false })
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

    // Backstop against a blank/near-empty payload clobbering a record that
    // already has real data -- independent of whatever guards the caller
    // has, so a future view-layer bug can't reproduce the same data loss.
    if (existing && countFilled(existing.data) > 0 && countFilled(data) === 0) {
      console.error('[saveDraft] refused to overwrite non-empty assessment with empty data', id)
      return
    }

    await get().upsert({
      id,
      data,
      // Preserve whatever status the record already had -- merely opening
      // a submitted assessment to look at it must not silently demote it
      // back to Draft.
      status: existing?.status ?? 'draft',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      ...(existing?.syncedAt !== undefined ? { syncedAt: existing.syncedAt } : {}),
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
      return {
        ok: false,
        reason: 'offline',
        message: "Saved on this device. It'll send to the office when you're back online.",
      }
    }

    try {
      await submitToSheets(id, data)
      await get().upsert({ ...base, status: 'synced', syncedAt: now })
      return { ok: true }
    } catch {
      await get().upsert({ ...base, status: 'failed' })
      return {
        ok: false,
        reason: 'error',
        message: "Couldn't reach the office. Your answers are saved here -- try again.",
      }
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
