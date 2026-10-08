// Browser side of the PDF export: draw the views into images, build the
// document, save it. Loaded on demand (jsPDF and react-dom/server only
// download when someone actually exports).
import { renderToStaticMarkup } from 'react-dom/server'
import type { TdComputed } from '@/lib/tdBulkDensity/compute'
import type { UnitSystem } from '@/lib/tdBulkDensity/units'
import { buildTdPdf, type PdfImage, type PdfVersion, type TdPdfResult } from '@/lib/tdBulkDensityPdf'
import { EndSection } from './EndSection'
import { SideSection } from './SideSection'

const noop = () => {}

/**
 * The 3D view as a JPEG at no more than 1400 px wide. A retina-size PNG of a
 * WebGL canvas made a 10 MB PDF -- too big to email to a customer.
 */
function canvasImage(c: HTMLCanvasElement | null | undefined): PdfImage | undefined {
  if (!c || !c.width || !c.height) return undefined
  try {
    const scale = Math.min(1, 1400 / c.width)
    const out = document.createElement('canvas')
    out.width = Math.round(c.width * scale)
    out.height = Math.round(c.height * scale)
    const ctx = out.getContext('2d')
    if (!ctx) return undefined
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(c, 0, 0, out.width, out.height)
    return { data: out.toDataURL('image/jpeg', 0.85), w: out.width, h: out.height }
  } catch {
    return undefined
  }
}

/** Render a section view's SVG off-screen and rasterise it at print size. */
async function svgImage(markup: string, widthPx = 1100): Promise<PdfImage | undefined> {
  const m = /<svg[\s\S]*<\/svg>/.exec(markup)
  if (!m) return undefined
  const svg = m[0]
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg)
  if (!vb) return undefined
  const vw = Number(vb[3])
  const vh = Number(vb[4])
  const w = widthPx
  const h = Math.round((widthPx * vh) / vw)
  const sized = svg.replace('<svg', `<svg width="${w}" height="${h}"`)
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized)
  await img.decode()
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return undefined
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return { data: c.toDataURL('image/png'), w, h }
}

export async function exportTdPdf(args: {
  version: PdfVersion
  customer: string
  reference: string
  result: TdComputed
  system: UnitSystem
  densitySource: string
  cutX: number
  cutZ: number
  canvas3d?: HTMLCanvasElement | null
  compare?: { a: TdComputed; b: TdComputed; canvasA?: HTMLCanvasElement | null; canvasB?: HTMLCanvasElement | null }
}): Promise<TdPdfResult & { viewsMissing: boolean }> {
  const { result, system } = args
  const viewProps = { result, inputs: result.inputs, cutX: args.cutX, cutZ: args.cutZ, onCutX: noop, onCutZ: noop, system }
  const [side, end] = await Promise.all([
    svgImage(renderToStaticMarkup(<SideSection {...viewProps} />)).catch(() => undefined),
    svgImage(renderToStaticMarkup(<EndSection {...viewProps} />)).catch(() => undefined),
  ])
  const pocket3d = canvasImage(args.canvas3d)
  const { pdf, fileName, logoRendered } = buildTdPdf({
    version: args.version,
    customer: args.customer,
    reference: args.reference,
    result,
    system,
    densitySource: args.densitySource,
    images: { pocket3d, side, end },
    compare: args.compare
      ? { a: args.compare.a, b: args.compare.b, images: { a: canvasImage(args.compare.canvasA), b: canvasImage(args.compare.canvasB) } }
      : undefined,
  })
  pdf.save(fileName)
  return { fileName, logoRendered, viewsMissing: !side || !end }
}
