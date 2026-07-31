import type { CalculatorInputs } from './calculator'

export interface StoredRoiCalculation {
  id: string
  name: string
  data: CalculatorInputs
  createdAt: number
  updatedAt: number
}
