// A saved ThermoDrive Belt Configurator belt: users/{uid}/tdConfigurations/{id}.
// The whole belt as entered (mm), its repair and section settings, the units
// it was typed in, and who it's for. Reopening merges onto a fresh belt so a
// field added later gets its default instead of breaking an old save.
import { freshBelt, newVar, type TdBelt } from './thermodrive/belt'
import type { SectionMode } from './thermodrive/geometry'
import { defaultRepair, defaultSectionMode, type RepairState } from './thermodrive/repair'
import type { UnitSystem } from './tdBulkDensity/units'

export interface StoredTdConfig {
  id: string
  customer: string
  reference: string
  notes: string
  belt: TdBelt
  repair: RepairState
  sectionMode: SectionMode
  system: UnitSystem
  createdAt: number
  updatedAt: number
}

export function buildConfigRecord(a: Omit<StoredTdConfig, 'updatedAt' | 'createdAt'> & { createdAt?: number; now: number }): StoredTdConfig {
  return {
    id: a.id,
    customer: a.customer.trim(),
    reference: a.reference.trim(),
    notes: a.notes.trim(),
    belt: a.belt,
    repair: a.repair,
    sectionMode: a.sectionMode,
    system: a.system,
    createdAt: a.createdAt ?? a.now,
    updatedAt: a.now,
  }
}

/** A stored record, made whole: anything missing takes today's default. */
export function fromConfigRecord(r: Partial<StoredTdConfig>): Pick<StoredTdConfig, 'belt' | 'repair' | 'sectionMode' | 'system'> {
  const base = freshBelt(r.belt?.series ?? '8050')
  const belt: TdBelt = {
    ...base,
    ...r.belt,
    vars: (r.belt?.vars?.length ? r.belt.vars : base.vars).map((v) => ({ ...newVar(v.startRow ?? 2), ...v })),
  }
  return {
    belt,
    repair: { ...defaultRepair(belt), ...r.repair },
    sectionMode: r.sectionMode ?? defaultSectionMode(),
    system: r.system === 'metric' ? 'metric' : 'imperial',
  }
}

export function configTitle(r: Pick<StoredTdConfig, 'customer' | 'reference'>): string {
  return [r.customer, r.reference].filter((x) => x.trim()).join(' · ') || 'Untitled belt'
}
