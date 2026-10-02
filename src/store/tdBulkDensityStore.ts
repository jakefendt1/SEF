import { create } from 'zustand'
import type { StoredTdRun } from '../lib/tdBulkDensityRecord'
import { deleteTdRunDoc, putTdRun, subscribeTdRuns } from '../lib/firestoreTdBulkDensity'
import { raceWrite, type WriteOutcome } from '../lib/writeOutcome'

interface Store {
  uid: string | null
  runs: StoredTdRun[]
  /** False until the first snapshot arrives. An empty list means "none saved"
   *  only once this is true -- before that it just means "not back yet". */
  loaded: boolean
  subscribe: (uid: string) => void
  unsubscribe: () => void
  /** Honest result of the write -- see lib/writeOutcome. */
  save: (run: StoredTdRun) => Promise<{ outcome: WriteOutcome; settled: Promise<WriteOutcome> }>
  remove: (id: string) => Promise<{ outcome: WriteOutcome; settled: Promise<WriteOutcome> }>
}

let unsub: (() => void) | null = null

const NOT_SIGNED_IN: WriteOutcome = { kind: 'failed', message: "You're not signed in." }

export const useTdBulkDensityStore = create<Store>((set, get) => ({
  uid: null,
  runs: [],
  loaded: false,

  subscribe(uid) {
    if (get().uid === uid && unsub) return
    unsub?.()
    set({ uid, runs: [], loaded: false })
    unsub = subscribeTdRuns(
      uid,
      (runs) => set({ runs, loaded: true }),
      // A rules or network error must not leave the list "loading" forever.
      () => set({ loaded: true }),
    )
  },

  unsubscribe() {
    unsub?.()
    unsub = null
    set({ uid: null, runs: [], loaded: false })
  },

  async save(run) {
    const { uid } = get()
    if (!uid) return { outcome: NOT_SIGNED_IN, settled: Promise.resolve(NOT_SIGNED_IN) }
    return raceWrite(putTdRun(uid, run))
  },

  async remove(id) {
    const { uid } = get()
    if (!uid) return { outcome: NOT_SIGNED_IN, settled: Promise.resolve(NOT_SIGNED_IN) }
    return raceWrite(deleteTdRunDoc(uid, id))
  },
}))
