// A server render of the whole page. The rest of the suite is node-only logic;
// this is the one test that proves the screen still mounts -- that no import,
// hook order, or null-handling mistake takes the tool down to a blank card.
// It is not a substitute for opening it on an iPad.
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BeltElongationHome } from './BeltElongationHome'
import { MeasureGuide } from './MeasureGuide'
import { ElongationGauge } from './ElongationGauge'
import { RulerReference } from './RulerReference'

describe('BeltElongationHome', () => {
  const html = renderToStaticMarkup(<BeltElongationHome />)

  it('opens on Series 900 with a span long enough to be reliable', () => {
    expect(html).toContain('Belt Elongation Check')
    expect(html).toContain('Series 900 · 24 pitches · replace at 3%')
  })

  // 24 pitches x 1.07 in = 25.68 in, which is 25 11/16 on a blade. This is the
  // number a rep compares against without typing anything, so it has to be
  // right end to end -- series table, span, and fraction formatting.
  it('tells the user what the tape should read before they measure', () => {
    expect(html).toContain('25 11/16 in')
  })

  it('asks for a reading instead of showing a made-up zero', () => {
    expect(html).toContain('Enter a tape reading')
    expect(html).not.toContain('0.00%')
  })

  it('renders the guide, the ruler reference and the gauge', () => {
    expect(renderToStaticMarkup(<MeasureGuide recommendedPitches={24} />)).toContain(
      'at least 24 pitches',
    )
    expect(renderToStaticMarkup(<RulerReference />)).toContain('15/16')

    const gauge = renderToStaticMarkup(
      <ElongationGauge elongationPct={2.4} limitPct={3} level="watch" />,
    )
    expect(gauge).toContain('2.40 percent')
    expect(gauge).toContain('Watch it')
  })
})
