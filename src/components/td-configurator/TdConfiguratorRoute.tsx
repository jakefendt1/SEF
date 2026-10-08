// Opens the configurator, with a belt handed over from Bulk Density when the
// URL carries one (?belt=...). The parameter is read once and then dropped
// from the address bar, so a refresh starts clean.
import { useState } from 'react'
import { useSearch } from 'wouter'
import { beltFromHandoff, decodeHandoff, HANDOFF_PARAM } from '@/lib/thermodrive/handoff'
import { TdConfiguratorHome, type ConfiguratorInit } from './TdConfiguratorHome'

export function TdConfiguratorRoute() {
  const search = useSearch()
  const [init] = useState<ConfiguratorInit | undefined>(() => {
    const h = decodeHandoff(new URLSearchParams(search).get(HANDOFF_PARAM))
    if (!h) return undefined
    const { belt, notes } = beltFromHandoff(h)
    if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname)
    return {
      belt,
      carry: { flightType: h.flightType, flightThicknessIn: h.flightThicknessIn },
      note: ['Opened the belt from the Bulk Density calculator.', ...notes].join(' '),
    }
  })
  return <TdConfiguratorHome init={init} />
}
