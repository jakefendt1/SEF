import { create } from 'zustand'
import type { StoredOnetrackBom } from '../lib/onetrackRecord'
import { deleteOnetrackBomDoc, putOnetrackBom, subscribeOnetrackBoms } from '../lib/firestoreOnetrack'
import { raceWrite, type WriteOutcome } from '../lib/writeOutcome'

interface Store {
  uid: string | null
  boms: StoredOnetrackBom[]
  /** False until the first snapshot arrives. An empty list means "none saved"
   *  only once this is true -- before that it just means "not back yet". */
  loaded: boolean
  /** Set when the list couldn't be read (e.g. the rules aren't deployed yet). */
  error: string | null
  subscribe: (uid: string) => void
  unsubscribe: () => void
  /** Honest result of the write -- see lib/writeOutcome. */
  save: (bom: StoredOnetrackBom) => Promise<{ outcome: WriteOutcome; settled: Promise<WriteOutcome> }>
  remove: (id: string) => Promise<{ outcome: WriteOutcome; settled: Promise<WriteOutcome> }>
}

let unsub: (() => void) | null = null

const NOT_SIGNED_IN: WriteOutcome = { kind: 'failed', message: "You're not signed in." }

export const useOnetrackStore = create<Store>((set, get) => ({
  uid: null,
  boms: [],
  loaded: false,
  error: null,

  subscribe(uid) {
    if (get().uid === uid && unsub) return
    unsub?.()
    set({ uid, boms: [], loaded: false, error: null })
    unsub = subscribeOnetrackBoms(
      uid,
      (boms) => set({ boms, loaded: true, error: null }),
      // A rules or network error must not leave the list "loading" forever.
      (err) => set({ loaded: true, error: err.message }),
    )
  },

  unsubscribe() {
    unsub?.()
    unsub = null
    set({ uid: null, boms: [], loaded: false, error: null })
  },

  async save(bom) {
    const { uid } = get()
    if (!uid) return { outcome: NOT_SIGNED_IN, settled: Promise.resolve(NOT_SIGNED_IN) }
    return raceWrite(putOnetrackBom(uid, bom))
  },

  async remove(id) {
    const { uid } = get()
    if (!uid) return { outcome: NOT_SIGNED_IN, settled: Promise.resolve(NOT_SIGNED_IN) }
    return raceWrite(deleteOnetrackBomDoc(uid, id))
  },
}))
