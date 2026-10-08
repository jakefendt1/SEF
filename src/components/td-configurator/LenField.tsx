// A length field bound to a value in mm. Keeps what you type while you type;
// takes a new value from outside (a snap, a unit switch) when it changes.
import { useState } from 'react'
import { mmText, parseMm } from '@/lib/thermodrive/format'
import { unitLabel, type UnitSystem } from '@/lib/tdBulkDensity/units'
import { NumberField } from '../td-bulk-density/fields'

export function LenField({
  id,
  title,
  mm,
  system,
  onChange,
  helper,
  problem,
  placeholder,
}: {
  id: string
  title: string
  mm: number
  system: UnitSystem
  onChange: (mm: number) => void
  helper?: React.ReactNode
  problem?: React.ReactNode
  placeholder?: string
}) {
  const [text, setText] = useState(() => mmText(mm, system))
  const [seen, setSeen] = useState({ mm, system })
  // Sync from outside only when the value differs from what the text means.
  if (seen.mm !== mm || seen.system !== system) {
    setSeen({ mm, system })
    const typed = parseMm(text, system)
    if (seen.system !== system || typed === null || Math.abs(typed - mm) > 1e-6) setText(mmText(mm, system))
  }
  return (
    <NumberField
      id={id}
      title={title}
      unit={unitLabel('length', system)}
      value={text}
      placeholder={placeholder}
      helper={helper}
      problem={problem}
      onChange={(t) => {
        setText(t)
        const v = parseMm(t, system)
        const next = v !== null && v >= 0 ? v : 0
        setSeen({ mm: next, system })
        onChange(next)
      }}
    />
  )
}
