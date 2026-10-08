// Opens the configurator: blank, with a belt handed over from Bulk Density
// (?belt=..., read once and dropped from the address bar), or a saved belt
// (/td-configurator/:id).
import { useEffect, useState } from 'react'
import { useRoute, useSearch } from 'wouter'
import { ROUTES } from '@/lib/navigation'
import { freshBelt } from '@/lib/thermodrive/belt'
import { beltFromHandoff, decodeHandoff, HANDOFF_PARAM } from '@/lib/thermodrive/handoff'
import { useAuthStore } from '@/store/authStore'
import { useTdConfigStore } from '@/store/tdConfigStore'
import { TdConfiguratorHome, type ConfiguratorInit } from './TdConfiguratorHome'

export function TdConfiguratorRoute() {
  const search = useSearch()
  const [, params] = useRoute(ROUTES.tdConfiguratorSaved)
  const id = params?.id ?? null
  const uid = useAuthStore((s) => s.user?.uid ?? null)
  const subscribe = useTdConfigStore((s) => s.subscribe)
  const configs = useTdConfigStore((s) => s.configs)
  const loaded = useTdConfigStore((s) => s.loaded)

  useEffect(() => {
    if (uid) subscribe(uid)
  }, [uid, subscribe])

  const [handed] = useState<ConfiguratorInit | undefined>(() => {
    const h = decodeHandoff(new URLSearchParams(search).get(HANDOFF_PARAM))
    if (!h) return undefined
    const { belt, notes } = beltFromHandoff(h)
    if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname)
    return { belt, note: ['Opened the belt from the Bulk Density calculator.', ...notes].join(' ') }
  })

  if (id) {
    if (!loaded) return <p className="container py-8 text-base text-muted-foreground">Loading the saved belt…</p>
    const saved = configs.find((c) => c.id === id)
    if (!saved) {
      return <TdConfiguratorHome key="missing" init={{ belt: freshBelt(), note: "That saved belt isn't on this account. It may have been deleted." }} />
    }
    return <TdConfiguratorHome key={id} saved={saved} />
  }
  return <TdConfiguratorHome key="new" init={handed} />
}
