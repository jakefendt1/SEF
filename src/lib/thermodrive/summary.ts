// The belt in one table, the way CS reads it: the configurator's Summary,
// the build sheet PDF and Copy for email all use these rows.
import { effective, flightMult, pitchMm, sidewallPitch, type TdBelt } from './belt'
import { fmtBeltLen, fmtMm } from './format'
import { finalSpacingInfo, flightSegments, maxSectionInfo, segHeight, vgChannels, vgPositions } from './geometry'
import type { UnitSystem } from '../tdBulkDensity/units'

export function summaryRows(belt: TdBelt, system: UnitSystem): [string, string][] {
  const b = effective(belt)
  const p = pitchMm(b)
  const msi = maxSectionInfo(b)
  const rows: [string, string][] = [
    ['Series', `${b.series} (${fmtMm(p, system)} pitch)`],
    ['Style', b.style],
    ['Material', b.material],
    ['Color', b.color],
    ['Belt width', b.widthMm > 0 ? fmtMm(b.widthMm, system) : '—'],
    ['Belt length', b.lengthMm > 0 ? `${fmtBeltLen(b.lengthMm, system)}, ${(b.lengthMm / p).toFixed(Number.isInteger(+(b.lengthMm / p).toFixed(3)) ? 0 : 2)} rows` : '—'],
    ['Max section length', msi.ft !== null ? `${msi.ft} ft / ${msi.m} m (${msi.label})` : msi.label],
  ]
  if (b.flightsOn) {
    rows.push(['Flight spacing', `${fmtMm(b.flightSpacingMm, system)} (${flightMult(b)} rows)`])
    b.vars.forEach((v, i) => {
      const seg = flightSegments(b, v)
      const hs = seg.segs.map((_, j) => segHeight(v, j))
      const h = Math.min(...hs) === Math.max(...hs) ? fmtMm(hs[0] ?? v.heightMm, system) : `${fmtMm(Math.min(...hs), system)}–${fmtMm(Math.max(...hs), system)}`
      const notch = !v.notchOn
        ? 'no notches'
        : v.notchMode === 'even'
          ? `${v.notchCount} even notch${v.notchCount === 1 ? '' : 'es'} of ${fmtMm(v.notchWMm, system)}${seg.computedFlightWMm !== undefined && seg.computedFlightWMm >= 0 ? ` (pieces ${fmtMm(seg.computedFlightWMm, system)})` : ''}`
          : v.notchMode === 'manual'
            ? `${v.notchCount} notch${v.notchCount === 1 ? '' : 'es'}, manual widths`
            : `${v.notchCount} notch${v.notchCount === 1 ? '' : 'es'} by position`
      const info = b.lengthMm > 0 ? finalSpacingInfo(b, v) : null
      rows.push([
        b.vars.length > 1 ? `Flights, variation ${i + 1}` : 'Flights',
        `${h} high, start row ${v.startRow}, indents ${fmtMm(v.indentLMm, system)} / ${fmtMm(v.indentRMm, system)}, ${notch}` +
          (info ? `; ${info.count} on the belt${info.removed ? ' (1 left off at the splice)' : ''}, ${info.finalGapMm !== undefined ? `${fmtMm(info.finalGapMm, system)} across the splice` : ''}` : ''),
      ])
    })
  } else rows.push(['Flights', 'None'])
  rows.push([
    'Sidewalls',
    b.sidewallsOn
      ? `${b.sidewallHeightIn} in, ${sidewallPitch(b)} mm pitch, inset ${fmtMm(b.sidewallInsetMm, system)}, ${b.sidewallsBoth ? 'both edges' : 'one edge'}`
      : 'None',
  ])
  if (b.series === '8140') {
    rows.push([
      'V-guides',
      b.vgOn
        ? `${b.vgCount} × K13 at ${vgPositions(b).map((c) => fmtMm(c, system)).join(', ')} from the left edge${vgChannels(b).length ? `; channels ${vgChannels(b).map((c) => fmtMm(c, system)).join(' / ')}` : ''}`
        : 'None',
    ])
    rows.push(['Drive', /DUAL LUG/i.test(b.style) ? 'Dual lug' : 'Single lug'])
  }
  return rows
}
