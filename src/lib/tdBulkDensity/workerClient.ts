// Main-thread side of the engine worker.
//
// Latest-wins, per job kind: a response is shown only if it is newer than the
// last one of its kind that was shown. That keeps results flowing while an
// input is being edited (each finished coarse job is newer than what's on
// screen) without an old fine result ever landing on top of a newer edit.
import { computeTdBulkDensity, type TdComputed } from './compute'
import { computeSweeps, type Sweep } from './sweeps'
import type { GridSize, TdInputs } from './types'
import type { UnitSystem } from './units'
import type { EngineRequest, EngineResponse } from './workerProtocol'

export type EngineListener = (
  r:
    | { kind: 'compute'; result: TdComputed; grid: GridSize }
    | { kind: 'sweeps'; sweeps: Sweep[]; inputs: TdInputs }
    | { kind: 'compute' | 'sweeps'; error: string },
) => void

export class TdEngineClient {
  private worker: Worker | null = null
  private nextId = 1
  private shown = { compute: 0, sweeps: 0 }
  private listener: EngineListener
  private failed = false

  constructor(listener: EngineListener) {
    this.listener = listener
  }

  private ensureWorker(): Worker | null {
    if (this.worker || this.failed) return this.worker
    try {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
      this.worker.onmessage = (e: MessageEvent<EngineResponse>) => this.receive(e.data)
      this.worker.onerror = () => {
        // A worker that can't load (very old browser, blocked script) falls
        // back to computing on the main thread rather than showing nothing.
        this.failed = true
        this.worker?.terminate()
        this.worker = null
      }
    } catch {
      this.failed = true
      this.worker = null
    }
    return this.worker
  }

  private receive(msg: EngineResponse) {
    if (msg.id <= this.shown[msg.kind]) return
    this.shown[msg.kind] = msg.id
    if ('error' in msg) this.listener({ kind: msg.kind, error: msg.error })
    else if (msg.kind === 'compute') this.listener({ kind: 'compute', result: msg.result, grid: msg.grid })
    else this.listener({ kind: 'sweeps', sweeps: msg.sweeps, inputs: msg.inputs })
  }

  private send(req: EngineRequest) {
    const worker = this.ensureWorker()
    if (worker) {
      worker.postMessage(req)
      return
    }
    try {
      if (req.kind === 'compute') {
        this.receive({ kind: 'compute', id: req.id, grid: req.grid, result: computeTdBulkDensity(req.inputs, req.grid, req.system) })
      } else {
        this.receive({ kind: 'sweeps', id: req.id, sweeps: computeSweeps(req.inputs), inputs: req.inputs })
      }
    } catch (err) {
      this.receive({ kind: req.kind, id: req.id, error: err instanceof Error ? err.message : String(err) })
    }
  }

  request(inputs: TdInputs, grid: GridSize, system: UnitSystem) {
    this.send({ kind: 'compute', id: this.nextId++, inputs, grid, system })
  }

  requestSweeps(inputs: TdInputs) {
    this.send({ kind: 'sweeps', id: this.nextId++, inputs })
  }

  dispose() {
    this.worker?.terminate()
    this.worker = null
  }
}
