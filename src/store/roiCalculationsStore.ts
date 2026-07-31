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
  subscribe: (uid: string) => void
  unsubscribe: () => void
  save: (calc: StoredRoiCalculation) => Promise<void>
  remove: (id: string) => Promise<void>
}

let unsub: (() => void) | null = null

export const useRoiCalculationsStore = create<Store>((set, get) => ({
  uid: null,
  calculations: [],

  subscribe(uid) {
    if (get().uid === uid && unsub) return
    unsub?.()
    set({ uid, calculations: [] })
    unsub = subscribeRoiCalculations(uid, (calculations) => set({ calculations }))
  },

  unsubscribe() {
    unsub?.()
    unsub = null
    set({ uid: null, calculations: [] })
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
