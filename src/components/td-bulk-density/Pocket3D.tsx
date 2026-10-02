// 3D pocket view (plan §7.1). Lazy-loaded: three.js only downloads when this
// view is opened.
//
// Three consecutive pockets on the inclined belt, flights at their true
// profile, sidewalls or guards when fitted, and the heap surface built from
// the engine's column tops, coloured by the spill edge that governs it. The
// ghost is the walls-at-both-ends heap: the gap between ghost and heap is the
// edge loss. Everything is drawn from the worker's field -- no separate math.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { TdComputed } from '@/lib/tdBulkDensity/compute'
import { EDGE_KINDS, EDGE_NONE, type HeapField, type TdInputs } from '@/lib/tdBulkDensity/types'
import { guardActsAsWall } from '@/lib/tdBulkDensity/width'
import { EDGE_COLORS, TD_COLORS } from './palette'

const DEG = Math.PI / 180
const TWEEN_MS = 300
/** Empty columns sink just under the belt surface, out of sight. */
const SUNK = -0.05

interface Props {
  result: TdComputed
  inputs: TdInputs
  cutX: number
  cutZ: number
  /** Called with the canvas so the PDF export can capture it. */
  onCanvas?: (canvas: HTMLCanvasElement | null) => void
}

interface Stage {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  world: THREE.Group
  content: THREE.Group
  cuts: THREE.Group
  heapGeo: THREE.BufferGeometry | null
  heapKey: string
  heights: Float32Array | null
  framedKey: string
  render: () => void
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

function heightsOf(field: HeapField): Float32Array {
  const h = new Float32Array(field.nx * field.nz)
  for (let i = 0; i < h.length; i++) h[i] = Number.isNaN(field.top[i]) ? SUNK : field.top[i]
  return h
}

function buildHeapGeometry(field: HeapField, heights: Float32Array): THREE.BufferGeometry {
  const { nx, nz, dx, dz, x0 } = field
  const pos = new Float32Array(nx * nz * 3)
  const col = new Float32Array(nx * nz * 3)
  const c = new THREE.Color()
  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      const i = ix * nz + iz
      pos[i * 3] = x0 + (ix + 0.5) * dx
      pos[i * 3 + 1] = heights[i]
      pos[i * 3 + 2] = (iz + 0.5) * dz
      const g = field.governing[i]
      c.set(g === EDGE_NONE ? TD_COLORS.product : blend(EDGE_COLORS[EDGE_KINDS[g]]))
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
  }
  const idx: number[] = []
  const inSeg = (i: number) => field.governing[i] !== EDGE_NONE
  for (let ix = 0; ix < nx - 1; ix++) {
    for (let iz = 0; iz < nz - 1; iz++) {
      const a = ix * nz + iz
      const b = a + nz
      const cc = b + 1
      const d = a + 1
      if (!(inSeg(a) && inSeg(b) && inSeg(cc) && inSeg(d))) continue
      // Skip quads that are entirely sunk -- nothing to see.
      if (heights[a] === SUNK && heights[b] === SUNK && heights[cc] === SUNK && heights[d] === SUNK) continue
      idx.push(a, b, d, b, cc, d)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

/** Mix the edge colour toward product amber so the heap still reads as product. */
function blend(hex: string): THREE.Color {
  return new THREE.Color(TD_COLORS.product).lerp(new THREE.Color(hex), 0.55)
}

function buildGhostGeometry(field: HeapField): THREE.BufferGeometry {
  const h = new Float32Array(field.nx * field.nz)
  for (let i = 0; i < h.length; i++) h[i] = Number.isNaN(field.ghostTop[i]) ? SUNK : field.ghostTop[i]
  return buildHeapGeometry({ ...field, governing: field.governing }, h)
}

function flightMesh(result: TdComputed, offsetX: number, z0: number, z1: number, mat: THREE.Material) {
  const p = result.profile!
  const t = Math.max(p.thicknessIn, 0.06)
  const shape = new THREE.Shape()
  p.face.forEach(([u, v], i) => (i === 0 ? shape.moveTo(u, v) : shape.lineTo(u, v)))
  ;[...p.face].reverse().forEach(([u, v]) => shape.lineTo(u - t, v))
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false })
  const m = new THREE.Mesh(geo, mat)
  m.position.set(offsetX, 0, z0)
  return m
}

function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: THREE.Material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat)
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  return m
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Pocket3D({ result, inputs, cutX, cutZ, onCanvas }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Stage | null>(null)
  const [noGl] = useState(() => !webglAvailable())

  // One-time stage setup.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    } catch (err) {
      // getContext succeeded but three couldn't start: leave the empty frame;
      // the section views below still show the pocket.
      console.error('[Pocket3D]', err)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0xf8fafc)
    host.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    onCanvas?.(renderer.domElement)

    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.4)
    sun.position.set(-6, 14, 10)
    scene.add(sun)

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = false

    const world = new THREE.Group()
    const content = new THREE.Group()
    const cuts = new THREE.Group()
    world.add(content, cuts)
    scene.add(world)

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

    stageRef.current = {
      renderer,
      scene,
      camera,
      controls,
      world,
      content,
      cuts,
      heapGeo: null,
      heapKey: '',
      heights: null,
      framedKey: '',
      render,
    }
    resize()

    return () => {
      ro.disconnect()
      controls.dispose()
      disposeGroup(content)
      disposeGroup(cuts)
      renderer.dispose()
      renderer.domElement.remove()
      onCanvas?.(null)
      stageRef.current = null
    }
    // onCanvas is a setter from the parent; the stage is built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rebuild the scene contents when the result changes.
  useEffect(() => {
    const st = stageRef.current
    const field = result.heap
    if (!st || !field || !result.profile || !result.width) return
    const s = inputs.flightSpacingIn
    const W = result.width.flightWidthIn
    const H = result.profile.heightIn
    const width = result.width

    // The heap geometry is kept between results with the same grid and
    // segments so heights can tween instead of jumping.
    const key = `${field.nx}x${field.nz}:${width.segments.map((g) => g.z0.toFixed(3)).join(',')}:${result.profile.face.length}`
    const next = heightsOf(field)
    const canTween = st.heapGeo && st.heapKey === key && st.heights
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    disposeGroup(st.content)
    st.world.rotation.z = inputs.inclineDeg * DEG

    const beltMat = new THREE.MeshStandardMaterial({ color: TD_COLORS.belt, roughness: 0.6, metalness: 0 })
    const flightMat = new THREE.MeshStandardMaterial({ color: TD_COLORS.flight, roughness: 0.6, metalness: 0 })
    const off = width.flightOffsetIn
    st.content.add(box(-1.4 * s, 2.4 * s, -0.3, 0, -off, inputs.beltWidthIn - off, beltMat))
    for (const k of [-1, 0, 1, 2]) {
      for (const sg of width.segments) st.content.add(flightMesh(result, k * s, sg.z0, sg.z1, flightMat))
    }

    if (inputs.containment === 'sidewalls' || inputs.containment === 'sealed') {
      const swH = inputs.containment === 'sealed' ? H : inputs.sidewallHeightIn
      const swMat = new THREE.MeshStandardMaterial({ color: TD_COLORS.sidewall, roughness: 0.6, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false })
      const g = width.left.gapIn
      const f = width.left.footprintIn
      st.content.add(box(-1.4 * s, 2.4 * s, 0, swH, -g - f, -g, swMat))
      st.content.add(box(-1.4 * s, 2.4 * s, 0, swH, W + g, W + g + f, swMat))
    }
    if (inputs.containment === 'guards' && inputs.guardClearanceIn !== null) {
      const c = inputs.guardClearanceIn
      const gMat = new THREE.MeshStandardMaterial({
        color: TD_COLORS.guard,
        roughness: 0.8,
        transparent: true,
        opacity: guardActsAsWall(inputs) ? 0.55 : 0.3,
      })
      st.content.add(box(-1.4 * s, 2.4 * s, 0.15, H + 0.4, -c - 0.12, -c, gMat))
      st.content.add(box(-1.4 * s, 2.4 * s, 0.15, H + 0.4, W + c, W + c + 0.12, gMat))
    }

    // Heap: one geometry shared by the three pockets.
    let heapGeo: THREE.BufferGeometry
    if (canTween && st.heapGeo) {
      heapGeo = st.heapGeo
      // Re-colour for the new governing map; positions tween below.
      const fresh = buildHeapGeometry(field, next)
      heapGeo.setAttribute('color', fresh.getAttribute('color'))
      heapGeo.setIndex(fresh.getIndex())
      fresh.dispose()
    } else {
      st.heapGeo?.dispose()
      heapGeo = buildHeapGeometry(field, next)
    }
    const heapMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide })
    const ghostGeo = buildGhostGeometry(field)
    const ghostMat = new THREE.MeshBasicMaterial({ color: TD_COLORS.ghost, wireframe: true, transparent: true, opacity: 0.05, depthWrite: false })
    for (const k of [-1, 0, 1]) {
      const m = new THREE.Mesh(heapGeo, heapMat)
      m.position.x = k * s
      st.content.add(m)
      const gm = new THREE.Mesh(ghostGeo, ghostMat)
      gm.position.x = k * s
      st.content.add(gm)
    }

    // Frame the camera on first build and whenever the geometry changes size.
    const frameKey = `${s.toFixed(2)}:${inputs.beltWidthIn.toFixed(2)}:${H.toFixed(2)}`
    if (st.framedKey !== frameKey) {
      st.framedKey = frameKey
      const span = Math.max(3 * s, inputs.beltWidthIn, H * 2)
      const center = new THREE.Vector3(0.5 * s, H / 2, W / 2).applyMatrix4(
        new THREE.Matrix4().makeRotationZ(inputs.inclineDeg * DEG),
      )
      st.controls.target.copy(center)
      // Mostly side-on, a little above and downhill: the heap reads like the
      // side section, and orbiting reveals the ends.
      st.camera.position.set(center.x - span * 0.35, center.y + span * 0.45, center.z + span * 1.45)
      st.camera.near = span / 200
      st.camera.far = span * 20
      st.camera.updateProjectionMatrix()
      st.controls.update()
    }

    const prev = st.heights
    st.heapGeo = heapGeo
    st.heapKey = key
    st.heights = next

    const pos = heapGeo.getAttribute('position') as THREE.BufferAttribute
    if (canTween && prev && !reduced) {
      const start = performance.now()
      let raf = 0
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / TWEEN_MS)
        const e = t * (2 - t)
        for (let i = 0; i < next.length; i++) pos.setY(i, prev[i] + (next[i] - prev[i]) * e)
        pos.needsUpdate = true
        heapGeo.computeVertexNormals()
        st.render()
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      return () => cancelAnimationFrame(raf)
    }
    for (let i = 0; i < next.length; i++) pos.setY(i, next[i])
    pos.needsUpdate = true
    heapGeo.computeVertexNormals()
    st.render()
  }, [result, inputs])

  // Section cut planes.
  useEffect(() => {
    const st = stageRef.current
    const field = result.heap
    if (!st || !field || !result.profile || !result.width) return
    disposeGroup(st.cuts)
    const H = result.profile.heightIn
    const W = result.width.flightWidthIn
    const xMax = field.x0 + field.nx * field.dx
    const mat = new THREE.MeshBasicMaterial({ color: TD_COLORS.ink, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
    const x = cutX * xMax
    const z = cutZ * W
    const endCut = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.6, H + 0.6), mat)
    endCut.rotation.y = Math.PI / 2
    endCut.position.set(x, (H + 0.6) / 2, W / 2)
    const sideCut = new THREE.Mesh(new THREE.PlaneGeometry(xMax + 0.6, H + 0.6), mat)
    sideCut.position.set(xMax / 2, (H + 0.6) / 2, z)
    st.cuts.add(endCut, sideCut)
    st.render()
  }, [result, cutX, cutZ])

  if (noGl) {
    return (
      <p className="text-base text-muted-foreground p-4">
        This device can't show the 3D view. The side and end sections below show the same pocket.
      </p>
    )
  }
  return <div ref={hostRef} className="w-full h-[min(60vh,26rem)] rounded-lg overflow-hidden border border-border bg-slate-50" />
}
