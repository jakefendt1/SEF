// The OneTrack routes, gated by the beta list: anyone not on it gets the same
// "not found" as a mistyped link, so the tool doesn't exist for them yet.
import { canSeeTool } from '@/lib/betaAccess'
import { useAuthStore } from '@/store/authStore'
import { NotFound } from '../shell/NotFound'
import { OnetrackHome } from './OnetrackHome'

export function OnetrackRoute() {
  const email = useAuthStore((s) => s.user?.email ?? null)
  return canSeeTool('onetrack', email) ? <OnetrackHome /> : <NotFound />
}
