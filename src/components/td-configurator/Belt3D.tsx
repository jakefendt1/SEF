// 3D belt view (plan §6.1). Lazy-loaded like the Bulk Density pocket: three.js
// downloads only when it's opened. A stretch of belt across the splice: the
// end of one loop, the splice, the start of the next. Flights with their
// notches, sidewalls, V-guides and drive lugs underneath; a flight left off at
// the splice is a red ghost. Units are inches; x runs with belt travel, the
// splice at x = 0.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { effective, pitchMm, sidewallFootprint, type TdBelt } from '@/lib/thermodrive/belt'
import { IN, VGUIDE_WIDTH_MM } from '@/lib/thermodrive/data'
import { driveBands, finalSpacingInfo, flightSegments, segHeight, vgPositions } from '@/lib/thermodrive/geometry'
import { COLORS, beltFill } from './colors'

export interface Belt3DLayers {
  flights: boolean
  sidewalls: boolean
  vguides: boolean
  drive: boolean
}

const BELT_TH = 0.3
const FLIGHT_TH = 0.2

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function disposeGroup(g: THREE.Group) {
  g.traverse((o) => {
    const m = o as THREE.Mesh
    m.geometry?.dispose?.()
    const mat = m.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
    else mat?.dispose?.()
  })
  g.clear()
}

function box(w: number, h: number, d: number, color: string, x: number, y: number, z: number, opts: { ghost?: boolean; opacity?: number } = {}) {
  const geo = new THREE.BoxGeometry(w, h, d)
  if (opts.ghost) {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color }))
    geo.dispose()
    edges.position.set(x, y, z)
    return edges
  }
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, transparent: opts.opacity !== undefined, opacity: opts.opacity ?? 1 })
  const m = new THREE.Mesh(geo, mat)
  m.position.set(x, y, z)
  return m
}

/** Flight positions (in, from the splice) per variation, and any ghost left off at the splice. */
function flightPositions(b: TdBelt): { x: number[]; ghost: number | null }[] {
  const p = pitchMm(b) / IN
  return b.vars.map((v) => {
    const S = (Math.max(1, Math.round(b.flightSpacingMm / pitchMm(b))) * pitchMm(b)) / IN
    const after = [0, 1, 2].map((k) => (v.startRow - 0.5) * p + k * S)
    if (!(b.lengthMm > 0)) return { x: after, ghost: null }
    const info = finalSpacingInfo(b, v)
    if (info.count < 1 || info.tailToSeamMm === undefined) return { x: after, ghost: null }
    const tail = info.tailToSeamMm / IN
    const before = [-tail - S, -tail]
    const ghost = info.removed && info.spliceRow !== undefined ? (info.removed.row - info.spliceRow) * p : null
    return { x: [...before, ...after], ghost }
  })
}

function build(group: THREE.Group, belt: TdBelt, layers: Belt3DLayers, warnIds: Set<string>) {
  const b = effective(belt)
  const W = b.widthMm / IN
  const p = pitchMm(b) / IN
  const pos = flightPositions(b)
  const xs = pos.flatMap((q) => [...q.x, ...(q.ghost !== null ? [q.ghost] : [])])
  const x0 = Math.min(-2 * p, ...xs) - p
  const x1 = Math.max(4 * p, ...xs) + p
  const L = x1 - x0

  // Belt slab, top at y = 0.
  group.add(box(L, BELT_TH, W, beltFill(b), x0 + L / 2, -BELT_TH / 2, W / 2))

  // Drive features under the belt, every pitch.
  if (layers.drive) {
    for (let x = Math.ceil(x0 / p) * p; x <= x1; x += p) {
      for (const [a, c] of driveBands(b)) {
        const za = Math.max(0, a / IN)
        const zc = Math.min(W, c / IN)
        if (zc > za) group.add(box(0.25, 0.25, zc - za, COLORS.drive, x, -BELT_TH - 0.125, (za + zc) / 2, { opacity: 0.6 }))
      }
    }
  }

  // The splice: a thin line across the belt.
  group.add(box(0.06, 0.02, W, COLORS.splice, 0, 0.01, W / 2))

  if (layers.flights && b.flightsOn) {
    b.vars.forEach((v, i) => {
      const bad = warnIds.has(`notch-over-${i}`) || warnIds.has(`sidewall-gap-${i}`)
      const color = bad ? COLORS.flag : COLORS.flight[i]
      const segs = flightSegments(b, v).segs
      const place = (x: number, ghost: boolean) =>
        segs.forEach(([a, c], j) => {
          const za = Math.max(0, a / IN)
          const zc = Math.min(W, c / IN)
          const h = segHeight(v, j) / IN
          if (zc > za && h > 0) group.add(box(FLIGHT_TH, h, zc - za, ghost ? COLORS.flag : color, x, h / 2, (za + zc) / 2, { ghost }))
        })
      pos[i].x.forEach((x) => place(x, false))
      if (pos[i].ghost !== null) place(pos[i].ghost!, true)
    })
  }

  if (layers.sidewalls && b.sidewallsOn) {
    const { fp, th } = sidewallFootprint(b)
    const h = b.sidewallHeightIn
    const inset = b.sidewallInsetMm / IN
    const fpIn = fp / IN
    const sides = [inset, ...(b.sidewallsBoth ? [W - inset - fpIn] : [])]
    for (const z0 of sides) {
      group.add(box(L, 0.1, fpIn, COLORS.sidewall, x0 + L / 2, 0.05, z0 + fpIn / 2))
      group.add(box(L, h, Math.max(0.08, th / IN), COLORS.sidewall, x0 + L / 2, h / 2, z0 + fpIn / 2, { opacity: 0.85 }))
    }
  }

  if (layers.vguides && b.vgOn) {
    const w = VGUIDE_WIDTH_MM / IN
    for (const c of vgPositions(b)) group.add(box(L, 0.35, w, COLORS.vguide, x0 + L / 2, -BELT_TH - 0.175, c / IN))
  }
  return { x0, x1, W }
}

export default function Belt3D({
  belt,
  warnIds,
  layers,
  onCanvas,
}: {
  belt: TdBelt
  warnIds: Set<string>
  layers: Belt3DLayers
  onCanvas?: (c: HTMLCanvasElement | null) => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; group: THREE.Group; render: () => void; framed: string } | null>(null)
  const [noGl] = useState(() => !webglAvailable())

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    } catch (err) {
      console.error('[Belt3D]', err)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0xf8fafc)
    host.appendChild(renderer.domElement)
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' })
    renderer.domElement.setAttribute('aria-hidden', 'true')
    onCanvas?.(renderer.domElement)
    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.4)
    sun.position.set(-8, 16, 12)
    scene.add(sun)
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 5000)
    const controls = new OrbitControls(camera, renderer.domElement)
    const group = new THREE.Group()
    scene.add(group)
    const render = () => renderer.render(scene, camera)
    controls.addEventListener('change', render)
    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      render()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    stageRef.current = { renderer, scene, camera, controls, group, render, framed: '' }
    resize()
    return () => {
      ro.disconnect()
      controls.dispose()
      disposeGroup(group)
      renderer.dispose()
      renderer.domElement.remove()
      onCanvas?.(null)
      stageRef.current = null
    }
    // onCanvas is a setter from the parent; the stage is built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const st = stageRef.current
    if (!st || !(belt.widthMm > 0)) return
    disposeGroup(st.group)
    const { x0, x1, W } = build(st.group, belt, layers, warnIds)
    // Frame once per belt size, so a toggle or an edit doesn't throw the view around.
    const key = `${belt.series}:${belt.widthMm.toFixed(0)}:${(x1 - x0).toFixed(0)}`
    if (st.framed !== key) {
      st.framed = key
      const cx = (x0 + x1) / 2
      const span = Math.max(x1 - x0, W)
      st.controls.target.set(cx, 1, W / 2)
      st.camera.position.set(cx - span * 0.45, span * 0.7, W / 2 + span * 1.1)
      st.controls.update()
    }
    st.render()
  }, [belt, layers, warnIds])

  if (noGl) return <p className="text-base text-muted-foreground p-4">This device can't show the 3D view. The top and cross-section views show the same belt.</p>
  // The host stays mounted (hidden) so the stage exists once a width is entered.
  const empty = !(belt.widthMm > 0)
  return (
    <>
      {empty && <p className="rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-10 text-center text-base text-muted-foreground">Enter a belt width to see it in 3D.</p>}
      <div ref={hostRef} className={empty ? 'hidden' : 'w-full h-[min(60vh,26rem)] rounded-lg overflow-hidden border border-border bg-slate-50'} />
    </>
  )
}
