import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { parsePointList } from '@/lib/tdBulkDensity/profiles'
import { unitLabel } from '@/lib/tdBulkDensity/units'
import { CheckField, NumberField } from './fields'
import type { StepProps } from './stepProps'
import { WarningsPanel } from './WarningsPanel'

export function ResultsStep({ form, set, result }: StepProps) {
  const sys = form.system
  return (
    <div className="space-y-5">
      {result ? (
        <WarningsPanel warnings={result.warnings} />
      ) : (
        <p className="text-base text-muted-foreground">Warnings appear once the inputs are complete.</p>
      )}

      <CheckField
        id="td-calclab"
        title="CalcLab-equivalent mode"
        checked={form.calcLabMode}
        onChange={(calcLabMode) => set({ calcLabMode })}
        helper="Walls at both flight ends and no dynamic derate — for comparing with old CalcLab numbers. Not a real line."
      />
      <NumberField
        id="td-max-speed"
        title="Product max belt speed"
        unit={unitLabel('speed', sys)}
        value={form.maxSpeed}
        onChange={(maxSpeed) => set({ maxSpeed })}
        optional
        helper="Flags a minimum speed the product can't take."
      />
      {form.containment === 'guards' && (
        <NumberField
          id="td-mu"
          title="Product-on-guard friction"
          value={form.wallFriction}
          onChange={(wallFriction) => set({ wallFriction })}
          helper="0.3 is a typical product on UHMW. Used for guard drag."
        />
      )}
      {import.meta.env.DEV && <ProfileImport form={form} set={set} result={result} />}
    </div>
  )
}

/** Dev-only: paste a CAD point list to replace the parametric profile. */
function ProfileImport({ form, set }: StepProps) {
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  return (
    <details className="rounded-lg border border-dashed border-border p-3">
      <summary className="cursor-pointer text-sm font-semibold min-h-[32px]">
        Dev: import a flight profile {form.profileOverride ? '(active)' : ''}
      </summary>
      <p className="text-sm text-muted-foreground mt-2">
        Product-side face as u,v pairs in inches, base (0,0) first, tip last.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full mt-2 rounded-lg border border-gray-400 p-2 font-mono text-base"
      />
      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          onClick={() => {
            const r = parsePointList(text)
            if ('error' in r) setMsg(r.error)
            else {
              set({ profileOverride: r.face })
              setMsg(`Using ${r.face.length} points.`)
            }
          }}
        >
          Use profile
        </Button>
        <Button variant="outline" onClick={() => { set({ profileOverride: null }); setMsg('Back to the parametric profile.') }}>
          Clear
        </Button>
      </div>
      {msg && <p className="text-sm mt-1">{msg}</p>}
    </details>
  )
}
