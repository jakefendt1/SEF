// Server renders of the configurator: it mounts blank, with a belt, and on
// each tab's view. Not a substitute for an iPad.
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Router } from 'wouter'
import { freshBelt, newVar, type TdBelt } from '@/lib/thermodrive/belt'
import { IN, PITCH_MM } from '@/lib/thermodrive/data'
import { defaultRepair } from '@/lib/thermodrive/repair'
import { RepairView, SectionsView } from './RepairSections'
import { TdConfiguratorHome } from './TdConfiguratorHome'
import { CrossView, SeamView, SummaryTable, TopView } from './views'

const p = PITCH_MM['8140']
const belt: TdBelt = {
  ...freshBelt('8140'),
  widthMm: 30 * IN,
  lengthMm: 400 * p,
  flightSpacingMm: 5 * p,
  vars: [{ ...newVar(2.5), heightMm: 4 * IN, indentLMm: 2 * IN, indentRMm: 2 * IN, notchOn: true, notchCount: 1, notchWMm: 30 }],
  sidewallsOn: true,
  sidewallHeightIn: 2,
  sidewallInsetMm: 12.7,
  vgOn: true,
  vgCount: 3,
}

describe('TdConfiguratorHome', () => {
  it('opens blank: nothing pre-filled, views say what they need', () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/td-configurator">
        <TdConfiguratorHome />
      </Router>,
    )
    expect(html).toContain('ThermoDrive Belt Configurator')
    expect(html).toContain('1. Product')
    expect(html).toContain('Enter a belt width to see the top view')
  })

  it('opens a handed-over belt with its note', () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/td-configurator">
        <TdConfiguratorHome init={{ belt, note: 'Opened the belt from the Bulk Density calculator.' }} />
      </Router>,
    )
    expect(html).toContain('Opened the belt from the Bulk Density calculator.')
    expect(html).toContain('<svg')
  })

  it('every view draws for a full 8140 belt', () => {
    const ids = new Set<string>()
    for (const el of [
      <TopView belt={belt} system="imperial" warnIds={ids} />,
      <SeamView belt={belt} system="metric" />,
      <CrossView belt={belt} system="imperial" warnIds={ids} />,
      <RepairView belt={belt} repair={defaultRepair(belt)} system="imperial" />,
      <SectionsView belt={belt} mode={{ kind: 'count', count: 2 }} system="imperial" />,
    ]) {
      expect(renderToStaticMarkup(el)).toContain('<svg')
    }
    const summary = renderToStaticMarkup(<SummaryTable belt={belt} system="imperial" />)
    expect(summary).toContain('V-guides')
    expect(summary).toContain('Dual lug')
  })
})
