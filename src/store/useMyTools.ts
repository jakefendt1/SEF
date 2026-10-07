import { isAdmin, toolsFor } from '../lib/access'
import { useAccessStore } from './accessStore'
import { useAuthStore } from './authStore'

/** The signed-in person's tools, live. `loaded` is false until Firestore answers. */
export function useMyTools(): { tools: string[]; loaded: boolean; admin: boolean } {
  const email = useAuthStore((s) => s.user?.email ?? null)
  const grant = useAccessStore((s) => s.grant)
  const loaded = useAccessStore((s) => s.loaded)
  const admin = isAdmin(email)
  return { tools: toolsFor(email, grant), loaded: loaded || admin, admin }
}
