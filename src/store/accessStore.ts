import { create } from 'zustand'
import type { AccessGrant } from '../lib/access'
import { subscribeMyAccess } from '../lib/firestoreAccess'

interface Store {
  email: string | null
  grant: AccessGrant | null
  /** False until Firestore has answered. Until then, don't say "no access". */
  loaded: boolean
  subscribe: (email: string) => void
  unsubscribe: () => void
}

let unsub: (() => void) | null = null

/** The signed-in person's own grant, kept live. */
export const useAccessStore = create<Store>((set, get) => ({
  email: null,
  grant: null,
  loaded: false,

  subscribe(email) {
    if (get().email === email && unsub) return
    unsub?.()
    set({ email, grant: null, loaded: false })
    unsub = subscribeMyAccess(
      email,
      (grant) => set({ grant, loaded: true }),
      // Refused (e.g. email not verified yet) reads as no tools, not as loading forever.
      () => set({ grant: null, loaded: true }),
    )
  },

  unsubscribe() {
    unsub?.()
    unsub = null
    set({ email: null, grant: null, loaded: false })
  },
}))
