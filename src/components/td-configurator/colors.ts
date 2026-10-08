// Drawing colors for the configurator's views and 3D belt.
import type { TdBelt } from '@/lib/thermodrive/belt'

export const COLORS = {
  beltFill: { BLUE: '#4f86c6', WHITE: '#dbe3ea', NATURAL: '#e6d9b8' } as Record<string, string>,
  beltEdge: { BLUE: '#1c4d80', WHITE: '#8a98a6', NATURAL: '#a8956a' } as Record<string, string>,
  flight: ['#d97706', '#7c3aed'],
  sidewall: '#15803d',
  vguide: '#be123c',
  drive: '#1e3a5f',
  splice: '#0e7490',
  flag: '#dc2626',
  dim: '#475569',
}

export const beltFill = (b: TdBelt) => COLORS.beltFill[b.color] ?? COLORS.beltFill.BLUE
export const beltEdge = (b: TdBelt) => COLORS.beltEdge[b.color] ?? COLORS.beltEdge.BLUE
