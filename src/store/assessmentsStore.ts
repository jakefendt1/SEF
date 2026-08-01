import { create } from 'zustand'
import type { StoredAssessment } from '../lib/db'
import {
  putAssessment,
  deleteAssessmentDoc,
  subscribeAssessments,
  updateAssessmentFields,
} from '../lib/firestoreAssessments'
import { countFilled } from '../lib/autosaveGuard'
import { duplicateTitle } from '../lib/assessmentTitle'
import type { FormValues } from '../schema/formSchema'

interface Store {
  uid: string | null
  assessments: StoredAssessment[]
  loaded: boolean
  subscribe: (uid: string) => void
  unsubscribe: () => void
  upsert: (a: StoredAssessment) => Promise<void>
  saveDraft: (id: string, data: Partial<FormValues>) => Promise<void>
  markComplete: (id: string, data: FormValues) => Promise<void>
  reopenAssessment: (id: string) => Promise<void>
  deleteAssessment: (id: string) => Promise<void>
  renameAssessment: (id: string, title: string) => Promise<void>
  /** Returns the new record's id, or null if the source was not found. */
  duplicateAssessment: (id: string) => Promise<string | null>
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
      ...(existing?.completedAt !== undefined ? { completedAt: existing.completedAt } : {}),
      // This is a whole-document write, so anything not restated here is
      // erased -- the user's chosen name included.
      ...(existing?.title !== undefined ? { title: existing.title } : {}),
    })
  },

  async markComplete(id, data) {
    const { assessments } = get()
    const now = Date.now()
    const existing = assessments.find((a) => a.id === id)

    // Purely a local write. It used to also push a row to a Google Sheet,
    // which is why this once had offline/queued/failed states -- there is
    // nothing left that can fail here. Firestore's offline cache accepts the
    // write with no connection and reconciles it later.
    await get().upsert({
      id,
      data,
      status: 'complete',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      completedAt: now,
      ...(existing?.title !== undefined ? { title: existing.title } : {}),
    })
  },

  async reopenAssessment(id) {
    const { assessments } = get()
    const existing = assessments.find((a) => a.id === id)
    if (!existing || existing.status !== 'complete') return
    // Marking complete must never be a one-way door.
    await get().upsert({
      id: existing.id,
      data: existing.data,
      status: 'draft',
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
      ...(existing.title !== undefined ? { title: existing.title } : {}),
    })
  },

  async deleteAssessment(id) {
    const { uid } = get()
    if (!uid) return
    await deleteAssessmentDoc(uid, id)
  },

  async renameAssessment(id, title) {
    const { uid } = get()
    if (!uid) return
    // A metadata-only patch. Deliberately not saveDraft, which rewrites the
    // whole document and stamps status.
    await updateAssessmentFields(uid, id, { title: title.trim(), updatedAt: Date.now() })
  },

  async duplicateAssessment(id) {
    const { assessments } = get()
    const source = assessments.find((a) => a.id === id)
    if (!source) return null

    const now = Date.now()
    const copy: StoredAssessment = {
      id: crypto.randomUUID(),
      // Structured clone so the copy shares no nested arrays with the source.
      data: structuredClone(source.data),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      title: duplicateTitle(source),
      // completedAt is deliberately NOT carried over. A spread would bring it,
      // and the copy -- which nobody has finished -- would look finished,
      // breaking the "changed since you marked it complete" derivation.
    }
    await get().upsert(copy)
    return copy.id
  },
}))
