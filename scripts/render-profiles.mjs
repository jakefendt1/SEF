// Renders every wearstrip profile tile as the same isometric extrusion, so the
// "What's installed now?" grid reads as one set: same angle, same blue, same
// light. Cross-sections are in inches, traced from the drawings they're sold
// from -- Engineering Manual pp.470-475 and the OneTrack menu pp.15-17.
//
//   node scripts/render-profiles.mjs   ->  public/onetrack/iso/<id>.svg
//
// Re-run it after changing a profile here. The shapes are for recognition on
// a tile, not for manufacture: small radii are left square.
import { mkdirSync, writeFileSync } from 'node:fs'

// ---------------------------------------------------------------- geometry
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a) => {
  const l = Math.hypot(...a)
  return [a[0] / l, a[1] / l, a[2] / l]
}

// Isometric: width (x) runs down-right, length (z) up-right, height (y) up.
// The viewer looks along -(1, 1, -1): top, the near end, and the right side show.
const VIEW = norm([1, 1, -1])
const project = ([x, y, z]) => [(x + z) * 0.866, (x - z) * 0.5 - y]
const LIGHT = norm([-0.35, 1, -0.6])

const BASE = [116, 126, 226] // OneTrack periwinkle
const EDGE = '#262c63'
const shade = (n) => {
  const k = 0.64 + 0.42 * Math.max(0, dot(n, LIGHT))
  return `rgb(${BASE.map((c) => Math.min(255, Math.round(c * k))).join(',')})`
}

/**
 * Faces of a prism: `poly` is the outline in its own plane (3D points), `e`
 * the extrusion vector. Returns visible faces, far to near.
 */
function prism(poly, e) {
  const n = poly.length
  // Newell normal tells us which way the outline winds about e.
  let N = [0, 0, 0]
  for (let i = 0; i < n; i++) N = add(N, cross(poly[i], poly[(i + 1) % n]))
  const ccw = dot(N, e) > 0
  const eHat = norm(e)
  const faces = []
  for (let i = 0; i < n; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % n]
    let nrm = norm(cross(sub(b, a), eHat))
    if (!ccw) nrm = nrm.map((v) => -v)
    const quad = [a, b, add(b, e), add(a, e)]
    faces.push({ pts: quad, n: nrm })
  }
  // A side face on a curve (both neighbours turn by under 25 degrees) gets no
  // drawn edge, so an arc reads as one smooth surface rather than facets.
  const sides = faces.slice()
  sides.forEach((f, i) => {
    const prev = sides[(i - 1 + n) % n].n
    const next = sides[(i + 1) % n].n
    f.smooth = dot(prev, f.n) > 0.9 && dot(next, f.n) > 0.9
  })
  // The cap at the start of the extrusion faces -e; the far cap faces +e.
  const capNear = { pts: poly, n: eHat.map((v) => -v) }
  const capFar = { pts: poly.map((p) => add(p, e)), n: eHat }
  faces.push(capNear, capFar)
  const centroid = (pts) => pts.reduce((s, p) => add(s, p), [0, 0, 0]).map((v) => v / pts.length)
  return faces
    .filter((f) => dot(f.n, VIEW) > 1e-6)
    .map((f) => ({ ...f, depth: dot(centroid(f.pts), VIEW) }))
    .sort((a, b) => a.depth - b.depth)
}

/** A cross-section in the x-y plane, extruded `length` along z. */
const section = (pts2, length) => prism(pts2.map(([x, y]) => [x, y, 0]), [0, 0, length])
/** A top-view outline in the x-z plane, extruded `thick` up y (flat strips). */
const plan = (pts2, thick) => prism(pts2.map(([x, z]) => [x, 0, z]), [0, thick, 0])

function svg(faces) {
  const all = faces.flatMap((f) => f.pts.map(project))
  const xs = all.map((p) => p[0])
  const ys = all.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const pad = Math.max(x1 - x0, y1 - y0) * 0.06
  const vb = [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map((v) => +v.toFixed(3))
  const stroke = +(Math.max(vb[2], vb[3]) * 0.006).toFixed(4)
  const polys = faces
    .map((f) => {
      const d = f.pts.map(project).map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ')
      const fill = shade(f.n)
      return f.smooth
        ? `<polygon points="${d}" fill="${fill}" stroke="${fill}"/>`
        : `<polygon points="${d}" fill="${fill}"/>`
    })
    .join('')
  return (
    // An explicit size (in proportion) so every browser, and the PDF export
    // that rasterises it, reads the right aspect ratio.
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(vb[2] * 120)}" height="${Math.round(vb[3] * 120)}" viewBox="${vb.join(' ')}">` +
    `<g stroke="${EDGE}" stroke-width="${stroke}" stroke-linejoin="round">${polys}</g></svg>`
  )
}

// ------------------------------------------------------------- the profiles
// Each outline is one closed loop (x across, y up), inches.
const arc = (cx, cy, r, a0, a1, steps = 18) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })

const SECTIONS = {
  // Manual p.470-471 / menu p.15
  'onetrack-flat': [[0, 0], [1, 0], [1, 1.5], [0, 1.5]],
  'onetrack-flanged': [[0, 0], [1.25, 0], [1.25, 2.0], [1.0, 2.0], [1.0, 1.5], [0, 1.5]],
  // Manual p.472
  'standard-angle': [[0, 0], [1.5, 0], [1.5, 0.625], [1.25, 0.625], [1.25, 0.25], [0, 0.25]],
  'clip-on': [[0, 0], [0.493, 0.03], [0.53, 0.074], [0.389, 0.222], [0.13, 0.167], [0.13, 0.296], [1, 0.296], [1, 0.419], [0, 0.419]],
  'clip-on-with-leg': [[0, 0], [0.5, 0.071], [0.529, 0.161], [0.364, 0.257], [0.089, 0.179], [0.089, 0.357], [0.946, 0.357], [0.946, 0.589], [0.821, 0.589], [0.821, 0.482], [0, 0.482]],
  'guide-rail-snap-on': [[0, 0], [0.25, 0], [0.25, 0.094], [0.094, 0.094], [0.094, 0.406], [1.906, 0.406], [1.906, 0.094], [1.75, 0.094], [1.75, 0], [2, 0], [2, 0.5], [0, 0.5]],
  'barbed-clip-on': [[0, 0], [0.148, 0], [0.187, 0.247], [0.11, 0.247], [0.11, 0.478], [1.64, 0.478], [1.64, 0.247], [1.563, 0.247], [1.602, 0], [1.75, 0], [1.75, 0.594], [0, 0.594]],
  'barbed-clip-on-with-leg': [[0, 0], [0.148, 0], [0.187, 0.247], [0.11, 0.247], [0.11, 0.478], [1.64, 0.478], [1.64, 0.247], [1.563, 0.247], [1.602, 0], [1.75, 0], [1.75, 0.594], [0.94, 0.594], [0.94, 0.719], [0.815, 0.719], [0.815, 0.594], [0, 0.594]],
  'standard-bar-snap-on': [[0.077, 0], [0.225, 0], [0.1875, 0.5], [0.5625, 0.5], [0.525, 0], [0.673, 0], [0.75, 0.58], [0.705, 0.625], [0.045, 0.625], [0, 0.58]],
  'full-round-snap-on': [...arc(0.406, 0.406, 0.406, -45, 225), ...arc(0.406, 0.406, 0.3125, 225, -45)],
  // Menu p.16-17 / manual p.474-475 (1/8 in frame versions)
  'radius-center-rail': [[0, 1.43], [0.552, 1.43], [0.552, 0.963], [0.724, 0.963], [0.724, 1.43], [0.908, 1.43], [0.908, 0], [1.06, 0], [1.06, 1.43], [1.56, 1.43], [1.56, 1.583], [0, 1.583]],
  'radius-angled': [[0, 0.896], [0.185, 0.896], [0.185, 1.295], [0.364, 1.295], [0.364, 0], [0.503, 0], [0.503, 1.353], [1, 1.353], [1, 1.474], [0, 1.474]],
  'radius-snap-on': [[0.16, 0], [0.22, 0], [0.16, 0.5], [0.54, 0.5], [0.48, 0], [0.54, 0], [0.7, 0.58], [0.66, 0.62], [0.04, 0.62], [0, 0.58]],
  'radius-standard-edge': [[0, 1.017], [0.208, 1.017], [0.208, 1.5], [0.417, 1.5], [0.417, 0], [0.625, 0], [0.625, 0.4], [1.125, 0.4], [1.125, 0.625], [0.625, 0.625], [0.625, 1.433], [1.125, 1.433], [1.125, 1.683], [0, 1.683]],
  'radius-tabbed-edge': [[0, 0.534], [0.166, 0.534], [0.166, 0.948], [0.347, 0.948], [0.347, 0], [0.518, 0], [0.518, 0.534], [1, 0.534], [1, 0.689], [0.518, 0.689], [0.518, 1.0], [1, 1.0], [1, 1.13], [0, 1.13]],
  's2400-hold-down': [[0, 0.612], [0.202, 0.612], [0.202, 1.05], [0.372, 1.05], [0.372, 0], [0.543, 0], [0.543, 0.963], [1.117, 0.963], [1.117, 1.25], [0, 1.25]],
  // Manual p.473: UHMW-PE cap over a stainless channel (drawn as one body)
  'ss-backed-t': [[0.35, 0], [0.9, 0], [0.95, 0.05], [0.9, 0.55], [1.2, 0.6], [1.25, 0.7], [1.21, 0.84], [0.04, 0.84], [0, 0.7], [0.05, 0.6], [0.35, 0.55], [0.3, 0.05]],
  'ss-backed-l': [[0.35, 0], [0.9, 0], [0.95, 0.05], [0.9, 0.55], [1.2, 0.6], [1.25, 0.7], [1.21, 0.84], [0.2, 0.84], [0.2, 1.22], [0, 1.22], [0, 0.62], [0.35, 0.55], [0.3, 0.05]],
}

/** Length shown: long enough to read as a strip, short enough to fill the tile. */
const lengthFor = (pts) => {
  const w = Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0]))
  const h = Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]))
  return Math.max(w, h) * 2.6
}

const out = new URL('../public/onetrack/iso/', import.meta.url)
mkdirSync(out, { recursive: true })
for (const [id, pts] of Object.entries(SECTIONS)) {
  writeFileSync(new URL(`${id}.svg`, out), svg(section(pts, lengthFor(pts))))
}

// Flat strips are thin plates: extrude their top view instead.
// Standard flat: 1/4 x 1-1/4 in (manual p.470).
writeFileSync(new URL('standard-flat.svg', out), svg(plan([[0, 0], [1.25, 0], [1.25, 5], [0, 5]], 0.25)))
// Finger-joint flat: the slotted end that takes the next strip's fastener (fig. 95).
writeFileSync(
  new URL('finger-joint-flat.svg', out),
  svg(plan([[0, 0], [0.475, 0], [0.475, 0.75], [0.775, 0.75], [0.775, 0], [1.25, 0], [1.25, 5], [0, 5]], 0.25)),
)

console.log(`wrote ${Object.keys(SECTIONS).length + 2} profiles to public/onetrack/iso/`)
