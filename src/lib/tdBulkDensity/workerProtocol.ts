import type { TdComputed } from './compute'
import type { Sweep } from './sweeps'
import type { GridSize, TdInputs } from './types'
import type { UnitSystem } from './units'

export type EngineRequest =
  | { kind: 'compute'; id: number; inputs: TdInputs; grid: GridSize; system: UnitSystem }
  | { kind: 'sweeps'; id: number; inputs: TdInputs }

export type EngineResponse =
  | { kind: 'compute'; id: number; grid: GridSize; result: TdComputed }
  | { kind: 'sweeps'; id: number; sweeps: Sweep[]; inputs: TdInputs }
  | { kind: 'compute' | 'sweeps'; id: number; error: string }
