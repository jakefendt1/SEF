// Web Worker wrapper around the engine, so a fine-grid compute or a set of
// sweeps never stalls the UI (plan §3.4, §7 performance budget).
//
// Stale jobs are dropped: messages that arrive while a job is running replace
// each other in `pending` (one slot per kind), and only the newest runs next.
// Results go out before sweeps, so the headline numbers never wait on charts.
import { computeTdBulkDensity, type TdComputed } from './compute'
import { computeSweeps } from './sweeps'
import type { EngineRequest, EngineResponse } from './workerProtocol'

interface WorkerScope {
  onmessage: ((e: MessageEvent<EngineRequest>) => void) | null
  postMessage(message: EngineResponse, transfer?: Transferable[]): void
}

const scope = self as unknown as WorkerScope
const pending: { compute: EngineRequest | null; sweeps: EngineRequest | null } = { compute: null, sweeps: null }
let scheduled = false

function transferables(r: TdComputed): Transferable[] {
  const out: Transferable[] = []
  for (const h of [r.heap, r.load?.heap]) {
    if (h) out.push(h.bottom.buffer, h.top.buffer, h.governing.buffer, h.count.buffer, h.ghostTop.buffer)
  }
  return out
}

function runOne(job: EngineRequest) {
  try {
    if (job.kind === 'compute') {
      const result = computeTdBulkDensity(job.inputs, job.grid, job.system)
      scope.postMessage({ kind: 'compute', id: job.id, grid: job.grid, result }, transferables(result))
    } else {
      scope.postMessage({ kind: 'sweeps', id: job.id, sweeps: computeSweeps(job.inputs), inputs: job.inputs })
    }
  } catch (err) {
    scope.postMessage({ kind: job.kind, id: job.id, error: err instanceof Error ? err.message : String(err) })
  }
}

function schedule() {
  if (scheduled) return
  scheduled = true
  setTimeout(run, 0)
}

function run() {
  scheduled = false
  const job = pending.compute ?? pending.sweeps
  if (!job) return
  pending[job.kind] = null
  runOne(job)
  if (pending.compute || pending.sweeps) schedule()
}

scope.onmessage = (e) => {
  pending[e.data.kind] = e.data
  schedule()
}
