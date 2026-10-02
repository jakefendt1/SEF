// Runs the engine off the main thread. Every change gets a fast coarse-grid
// answer at once and a fine-grid answer once the inputs settle; the debounce
// lives here, at the worker boundary, and nowhere else. Sweeps run only while
// the sweeps view is open, after the inputs settle.
import { useEffect, useRef, useState } from 'react'
import type { TdComputed } from '@/lib/tdBulkDensity/compute'
import type { Sweep } from '@/lib/tdBulkDensity/sweeps'
import type { GridSize, TdInputs } from '@/lib/tdBulkDensity/types'
import type { UnitSystem } from '@/lib/tdBulkDensity/units'
import { TdEngineClient } from '@/lib/tdBulkDensity/workerClient'

const SETTLE_MS = 180
const SWEEP_SETTLE_MS = 450

export interface EngineState {
  result: TdComputed | null
  grid: GridSize | null
  /** True while a fine result for the current inputs is still on its way. */
  refining: boolean
  error: string | null
  sweeps: Sweep[] | null
  /** The inputs the shown sweeps were computed from. */
  sweepsFor: TdInputs | null
  sweepsBusy: boolean
}

const EMPTY: EngineState = {
  result: null,
  grid: null,
  refining: false,
  error: null,
  sweeps: null,
  sweepsFor: null,
  sweepsBusy: false,
}

export function useTdEngine(inputs: TdInputs | null, system: UnitSystem, wantSweeps: boolean): EngineState {
  const [state, setState] = useState<EngineState>(EMPTY)
  const clientRef = useRef<TdEngineClient | null>(null)

  useEffect(() => {
    const client = new TdEngineClient((msg) => {
      if ('error' in msg) {
        setState((s) =>
          msg.kind === 'compute' ? { ...s, refining: false, error: msg.error } : { ...s, sweepsBusy: false },
        )
      } else if (msg.kind === 'compute') {
        setState((s) => ({ ...s, result: msg.result, grid: msg.grid, refining: msg.grid === 'coarse', error: null }))
      } else {
        setState((s) => ({ ...s, sweeps: msg.sweeps, sweepsFor: msg.inputs, sweepsBusy: false }))
      }
    })
    clientRef.current = client
    return () => {
      client.dispose()
      clientRef.current = null
    }
  }, [])

  useEffect(() => {
    const client = clientRef.current
    if (!client || !inputs) return
    client.request(inputs, 'coarse', system)
    const t = setTimeout(() => client.request(inputs, 'fine', system), SETTLE_MS)
    return () => clearTimeout(t)
  }, [inputs, system])

  useEffect(() => {
    const client = clientRef.current
    if (!client || !inputs || !wantSweeps) return
    const t = setTimeout(() => {
      setState((s) => ({ ...s, sweepsBusy: true }))
      client.requestSweeps(inputs)
    }, SWEEP_SETTLE_MS)
    return () => clearTimeout(t)
  }, [inputs, wantSweeps])

  // With no complete inputs there is nothing to show -- not a stale result.
  return inputs ? state : EMPTY
}
