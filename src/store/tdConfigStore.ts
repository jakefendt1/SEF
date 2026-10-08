import { create } from 'zustand'
import type { StoredTdConfig } from '../lib/tdConfigRecord'
import { deleteTdConfigDoc, putTdConfig, subscribeTdConfigs } from '../lib/firestoreTdConfig'
import { raceWrite, type WriteOutcome } from '../lib/writeOutcome'

interface Store {
  uid: string | null
  configs: StoredTdConfig[]
  /** False until the first snapshot arrives. An empty list means "none saved"
   *  only once this is true -- before that it just means "not back yet". */
  loaded: boolean
  /** Set when the list couldn't be read (e.g. the rules aren't deployed yet). */
  error: string | null
  subscribe: (uid: string) => void
  unsubscribe: () => void
  /** Honest result of the write -- see lib/writeOutcome. */
  save: (config: StoredTdConfig) => Promise<{ outcome: WriteOutcome; settled: Promise<WriteOutcome> }>
  remove: (id: string) => Promise<{ outcome: WriteOutcome; settled: Promise<WriteOutcome> }>
}

let unsub: (() => void) | null = null

const NOT_SIGNED_IN: WriteOutcome = { kind: 'failed', message: "You're not signed in." }

export const useTdConfigStore = create<Store>((set, get) => ({
  uid: null,
  configs: [],
  loaded: false,
  error: null,

  subscribe(uid) {
    if (get().uid === uid && unsub) return
    unsub?.()
    set({ uid, configs: [], loaded: false, error: null })
    unsub = subscribeTdConfigs(
      uid,
      (configs) => set({ configs, loaded: true, error: null }),
      // A rules or network error must not leave the list "loading" forever.
      (err) => set({ loaded: true, error: err.message }),
    )
  },

  unsubscribe() {
    unsub?.()
    unsub = null
    set({ uid: null, configs: [], loaded: false, error: null })
  },

  async save(config) {
    const { uid } = get()
    if (!uid) return { outcome: NOT_SIGNED_IN, settled: Promise.resolve(NOT_SIGNED_IN) }
    return raceWrite(putTdConfig(uid, config))
  },

  async remove(id) {
    const { uid } = get()
    if (!uid) return { outcome: NOT_SIGNED_IN, settled: Promise.resolve(NOT_SIGNED_IN) }
    return raceWrite(deleteTdConfigDoc(uid, id))
  },
}))
