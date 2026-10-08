// Browser side of the build sheet, loaded on demand so jsPDF and the server
// renderer only download when someone exports. The 2D views are drawn
// off-screen from the engine, so they're in the PDF whichever tab is open.
import { renderToStaticMarkup } from 'react-dom/server'
import type { TdBelt } from '@/lib/thermodrive/belt'
import type { BuildSheet } from '@/lib/thermodrive/buildSheet'
import type { PdfImage } from '@/lib/onetrackPdf'
import { buildThermodrivePdf } from '@/lib/thermodrivePdf'
import type { UnitSystem } from '@/lib/tdBulkDensity/units'
import { CrossView, SeamView, TopView } from './views'

async function svgImage(markup: string): Promise<PdfImage | undefined> {
  if (!markup.startsWith('<svg')) return undefined
  const vb = markup.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/)
  if (!vb) return undefined
  const w = Number(vb[1]) * 2
  const h = Number(vb[2]) * 2
  const svg = markup.replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"`)
  try {
    const img = new Image()
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    return { data: canvas.toDataURL('image/png'), w, h }
  } catch {
    return undefined
  }
}

function canvasImage(c: HTMLCanvasElement | null): PdfImage | undefined {
  if (!c || !c.width || !c.height) return undefined
  try {
    return { data: c.toDataURL('image/png'), w: c.width, h: c.height }
  } catch {
    return undefined
  }
}

export async function exportBuildSheetPdf(args: {
  sheet: BuildSheet
  belt: TdBelt
  system: UnitSystem
  warnIds: Set<string>
  canvas3d: HTMLCanvasElement | null
}): Promise<{ blob: Blob; fileName: string; logoRendered: boolean }> {
  const { belt, system, warnIds } = args
  const [top, cross, splice] = await Promise.all([
    svgImage(renderToStaticMarkup(<TopView belt={belt} system={system} warnIds={warnIds} />)),
    svgImage(renderToStaticMarkup(<CrossView belt={belt} system={system} warnIds={warnIds} />)),
    svgImage(renderToStaticMarkup(<SeamView belt={belt} system={system} />)),
  ])
  const { pdf, fileName, logoRendered } = buildThermodrivePdf(args.sheet, { belt3d: canvasImage(args.canvas3d), top, cross, splice })
  return { blob: pdf.output('blob'), fileName, logoRendered }
}
