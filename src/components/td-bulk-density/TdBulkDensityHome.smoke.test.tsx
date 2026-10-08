// Server renders of the page and its pieces. The rest of the suite is
// node-only logic; this proves the screens still mount -- that no import,
// hook order or null-handling mistake takes the tool down to a blank card.
// It is not a substitute for opening it on an iPad (the 3D view needs WebGL
// and is not rendered here).
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Router } from 'wouter'
import { computeTdBulkDensity } from '@/lib/tdBulkDensity/compute'
import { initialForm, type TdForm } from '@/lib/tdBulkDensity/form'
import { makeInputs } from '@/lib/tdBulkDensity/defaults'
import { CompareStrip } from './CompareStrip'
import { ConveyorStep } from './ConveyorStep'
import { EdgeStep } from './EdgeStep'
import { EndSection } from './EndSection'
import { FlightStep } from './FlightStep'
import { ProductStep } from './ProductStep'
import { ResultsCard } from './ResultsCard'
import { ResultsStep } from './ResultsStep'
import { SideSection } from './SideSection'
import { TdBulkDensityHome } from './TdBulkDensityHome'
import { LayerPanel } from './LayerPanel'
import { DEFAULT_LAYERS } from './layers'

const noop = () => {}

describe('TdBulkDensityHome', () => {
  const html = renderToStaticMarkup(
    <Router ssrPath="/td-bulk-density">
      <TdBulkDensityHome />
    </Router>,
  )

  it('opens on the conveyor step with nothing invented', () => {
    expect(html).toContain('ThermoDrive Bulk Density Calculator')
    expect(html).toContain('1. Conveyor')
    expect(html).toContain('Enter these to see results')
    expect(html).toContain('Belt width')
    expect(html).not.toContain('lb/h</p>')
  })

  it('says plainly that the run is not saved yet', () => {
    expect(html).toContain('Not saved')
  })
})

describe('steps and views', () => {
  const form: TdForm = {
    ...initialForm(),
    beltWidth: '12',
    incline: '52',
    flightHeightText: '5',
    flightSpacing: '8',
    density: '7.9',
    repose: '35',
    smallestDim: '1',
    speed: '60',
    target: '2625',
  }
  const result = computeTdBulkDensity(makeInputs({ containment: 'open' }), 'coarse')

  it('renders every step', () => {
    for (const Step of [ConveyorStep, FlightStep, EdgeStep, ProductStep, ResultsStep]) {
      expect(renderToStaticMarkup(<Step form={form} set={noop} result={result} />).length).toBeGreaterThan(100)
    }
    expect(renderToStaticMarkup(<EdgeStep form={form} set={noop} result={null} />)).toContain('Flight width = 9.5 in')
    expect(renderToStaticMarkup(<EdgeStep form={{ ...form, containment: 'guards' }} set={noop} result={null} />)).toContain(
      'there is no default',
    )
  })

  it('renders the headline numbers, or says what is missing', () => {
    const r = computeTdBulkDensity(makeInputs({ beltSpeedFpm: 60, targetLbPerHr: 1000 }), 'coarse')
    const out = renderToStaticMarkup(<ResultsCard result={r} missing={[]} refining={false} system="imperial" />)
    expect(out).toContain('Minimum belt speed')
    expect(out).toContain('ft/min')
    const none = renderToStaticMarkup(
      <ResultsCard result={r} missing={['Belt speed']} refining={false} system="imperial" />,
    )
    expect(none).toContain('Belt speed')
  })

  it('draws the side and end sections from the field', () => {
    const side = renderToStaticMarkup(
      <SideSection result={result} inputs={result.inputs} cutX={0.4} cutZ={0.5} onCutX={noop} onCutZ={noop} system="imperial" />,
    )
    expect(side).toContain('<svg')
    expect(side).toContain('polygon')
    const end = renderToStaticMarkup(
      <EndSection result={result} inputs={result.inputs} cutX={0.4} cutZ={0.5} onCutX={noop} onCutZ={noop} system="metric" />,
    )
    expect(end).toContain('flight (carry)')
    expect(end).toContain('mm')
  })
})

describe('3D layers panel', () => {
  it('has a show/hide box and a see-through slider for each layer that is on', () => {
    const html = renderToStaticMarkup(
      <LayerPanel layers={{ ...DEFAULT_LAYERS, capacity: true }} onChange={noop} edgeKinds={[0, 3]} hasWalls />,
    )
    expect(html).toContain('id="opacity-product"')
    expect(html).toContain('id="opacity-capacity"')
    expect(html).toContain('id="opacity-walls"')
    // Layers that are off have no slider.
    expect(html).not.toContain('id="opacity-ghost"')
    expect(html).toContain('35% solid')
    expect(html).toContain('Reset layers')
  })
})

describe('CompareStrip', () => {
  it('shows A and B side by side, named by the one input that differs', () => {
    const inputs = makeInputs({ beltWidthIn: 24, flightHeightIn: 4, flightSpacingIn: 8, inclineDeg: 45, reposeDeg: 35, beltSpeedFpm: 60, densityLbFt3: 20 })
    const a = computeTdBulkDensity(inputs, 'coarse')
    const b = computeTdBulkDensity({ ...inputs, beltWidthIn: 30 }, 'coarse')
    const html = renderToStaticMarkup(<CompareStrip a={a} b={b} editing="B" system="imperial" onEdit={noop} onRemove={noop} />)
    expect(html).toContain('A · 24 in')
    expect(html).toContain('B · 30 in')
    expect(html).toContain('Throughput at belt speed')
    expect(html).toContain('Belt width')
    expect(html).toContain('Edit A')
    expect(html).toContain('Remove A')
    const waiting = renderToStaticMarkup(<CompareStrip a={a} b={null} editing="B" system="imperial" onEdit={noop} onRemove={noop} />)
    expect(waiting).toContain('updates as you go')
  })
})
