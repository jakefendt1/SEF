import { create } from 'zustand'
import type { StoredRoiCalculation } from '../lib/roiCalculation'
import {
  putRoiCalculation,
  deleteRoiCalculationDoc,
  subscribeRoiCalculations,
} from '../lib/firestoreRoiCalculations'

interface Store {
  uid: string | null
  calculations: StoredRoiCalculation[]
  /** False until the first snapshot arrives. An empty list means "none saved"
   *  only once this is true -- before that it just means "not back yet". */
  loaded: boolean
  subscribe: (uid: string) => void
  unsubscribe: () => void
  save: (calc: StoredRoiCalculation) => Promise<void>
  remove: (id: string) => Promise<void>
}

let unsub: (() => void) | null = null

export const useRoiCalculationsStore = create<Store>((set, get) => ({
  uid: null,
  calculations: [],
  loaded: false,

  subscribe(uid) {
    if (get().uid === uid && unsub) return
    unsub?.()
    set({ uid, calculations: [], loaded: false })
    unsub = subscribeRoiCalculations(uid, (calculations) =>
      set({ calculations, loaded: true }),
    )
  },

  unsubscribe() {
    unsub?.()
    unsub = null
    set({ uid: null, calculations: [], loaded: false })
  },

  async save(calc) {
    const { uid } = get()
    if (!uid) return
    await putRoiCalculation(uid, calc)
  },

  async remove(id) {
    const { uid } = get()
    if (!uid) return
    await deleteRoiCalculationDoc(uid, id)
  },
}))
