'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { FLAVOR_DESCENT, SYSTEM_FLAVORS, type SystemKey } from '@/lib/design/system-flavors'
import type {
  RelationshipFieldData,
  RelationshipFieldEdge,
  RelationshipFieldNode,
} from '@/lib/data/homepage-demo'

export type RelationshipView = 'all' | SystemKey

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

interface RelationshipFieldSceneProps {
  readonly data: RelationshipFieldData
  readonly centerId: string
  readonly peerId: string
  readonly view: RelationshipView
  readonly onSelectPerson: (id: string) => void
}

interface Pulse {
  readonly mesh: THREE.Mesh
  readonly curve: THREE.QuadraticBezierCurve3
  readonly phase: number
}

interface OrbitPlacement {
  readonly position: THREE.Vector3
  readonly radius: number
  readonly rotation: THREE.Euler
  readonly score: number
  readonly rarity: number
}

function otherId(edge: RelationshipFieldEdge, centerId: string): string {
  return edge.a === centerId ? edge.b : edge.a
}

function createTextLabel(
  title: string,
  detail: string,
  accent: string,
  interactive: boolean,
): HTMLButtonElement | HTMLDivElement {
  const element = interactive ? document.createElement('button') : document.createElement('div')
  if (element instanceof HTMLButtonElement) element.type = 'button'
  element.style.cssText = [
    'border:1px solid rgba(255,255,255,.14)',
    'border-radius:10px',
    'background:rgba(11,13,22,.82)',
    'box-shadow:0 10px 30px rgba(0,0,0,.28)',
    'color:white',
    'font:600 11px/1.2 ui-sans-serif,system-ui,sans-serif',
    'padding:7px 9px',
    'text-align:left',
    'white-space:nowrap',
    `border-color:${accent}66`,
    interactive ? 'pointer-events:auto;cursor:pointer' : 'pointer-events:none',
  ].join(';')
  const heading = document.createElement('span')
  heading.textContent = title
  heading.style.display = 'block'
  const subline = document.createElement('span')
  subline.textContent = detail
  subline.style.cssText = `display:block;margin-top:3px;color:${accent};font:500 8px/1.2 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em`
  element.append(heading, subline)
  return element
}

function findEdge(
  edges: readonly RelationshipFieldEdge[],
  firstId: string,
  secondId: string,
): RelationshipFieldEdge | null {
  return edges.find(
    (edge) =>
      (edge.a === firstId && edge.b === secondId) ||
      (edge.a === secondId && edge.b === firstId),
  ) ?? null
}

function connectedPeople(
  data: RelationshipFieldData,
  center: RelationshipFieldNode,
): readonly RelationshipFieldNode[] {
  const people: RelationshipFieldNode[] = []
  for (const edge of data.edges) {
    if (edge.a !== center.id && edge.b !== center.id) continue
    const person = data.nodes.find((candidate) => candidate.id === otherId(edge, center.id))
    if (person) people.push(person)
  }
  return people
}

function orbitPlacements(
  center: RelationshipFieldNode,
  peers: readonly RelationshipFieldNode[],
  edges: readonly RelationshipFieldEdge[],
): ReadonlyMap<string, OrbitPlacement> {
  const placements = new Map<string, OrbitPlacement>()
  placements.set(center.id, {
    position: new THREE.Vector3(0, 0, 0),
    radius: 0,
    rotation: new THREE.Euler(),
    score: 100,
    rarity: 0,
  })
  for (let index = 0; index < peers.length; index++) {
    const peer = peers[index]
    const edge = findEdge(edges, center.id, peer.id)
    const score = edge?.overall ?? 50
    const rarity = edge?.rarity ?? 0
    const radius = 6.7 - score * 0.034
    const phase = -Math.PI / 2 + index * GOLDEN_ANGLE
    const direction = index % 2 === 0 ? 1 : -1
    const rotation = new THREE.Euler(
      direction * (0.08 + rarity * 0.0048),
      0,
      direction * (0.05 + index * 0.055),
    )
    const position = new THREE.Vector3(
      Math.cos(phase) * radius,
      0,
      Math.sin(phase) * radius,
    ).applyEuler(rotation)
    placements.set(peer.id, { position, radius, rotation, score, rarity })
  }
  return placements
}

function addOrbits(
  scene: THREE.Object3D,
  peers: readonly RelationshipFieldNode[],
  placements: ReadonlyMap<string, OrbitPlacement>,
  selectedPeerId: string,
): void {
  for (const peer of peers) {
    const placement = placements.get(peer.id)
    if (!placement) continue
    const selected = peer.id === selectedPeerId
    const points: THREE.Vector3[] = []
    for (let index = 0; index < 128; index++) {
      const angle = (index / 128) * Math.PI * 2
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * placement.radius,
          0,
          Math.sin(angle) * placement.radius,
        ).applyEuler(placement.rotation),
      )
    }
    const orbit = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: selected ? '#CDB2E8' : '#756B91',
        transparent: true,
        opacity: selected ? 0.48 : 0.13,
      }),
    )
    scene.add(orbit)
  }
}

function addPerson(
  scene: THREE.Object3D,
  person: RelationshipFieldNode,
  position: THREE.Vector3,
  role: 'center' | 'peer' | 'other',
  view: RelationshipView,
  onSelectPerson: (id: string) => void,
  pickable: THREE.Mesh[],
): void {
  const selected = role !== 'other'
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(role === 'center' ? 0.48 : selected ? 0.3 : 0.23, 28, 20),
    new THREE.MeshStandardMaterial({
      color: role === 'center' ? '#FFF4CE' : selected ? '#CDB2E8' : '#756B91',
      emissive: role === 'center' ? '#D6A84B' : '#352C51',
      emissiveIntensity: role === 'center' ? 2.4 : selected ? 1.05 : 0.35,
      roughness: role === 'center' ? 0.12 : 0.38,
      metalness: role === 'center' ? 0 : 0.18,
    }),
  )
  core.position.copy(position)
  core.userData.personId = person.id
  scene.add(core)
  pickable.push(core)

  if (role === 'center') {
    for (const radius of [0.63, 0.78, 0.96]) {
      const corona = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 28, 20),
        new THREE.MeshBasicMaterial({
          color: radius < 0.7 ? '#FFD875' : '#B993FF',
          transparent: true,
          opacity: radius < 0.7 ? 0.12 : 0.035,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
        }),
      )
      corona.position.copy(position)
      scene.add(corona)
    }
    const starLight = new THREE.PointLight('#FFD875', 22, 11, 1.7)
    starLight.position.copy(position)
    scene.add(starLight)
  } else {
    for (let index = 0; index < FLAVOR_DESCENT.length; index++) {
      const key = FLAVOR_DESCENT[index]
      const active = view === 'all' || view === key
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.38 + index * 0.026, 0.009, 5, 48),
        new THREE.MeshBasicMaterial({
          color: SYSTEM_FLAVORS[key].accentSoft,
          transparent: true,
          opacity: active ? (selected ? 0.72 : 0.22) : 0.025,
          depthWrite: false,
        }),
      )
      ring.position.copy(position)
      ring.rotation.set(
        Math.PI / 2 + (index - 2) * 0.11,
        index * 0.32,
        index * 0.24,
      )
      scene.add(ring)
    }
  }

  if (role === 'peer') {
    const selectionHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.43, 0.48, 64),
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    selectionHalo.position.copy(position)
    selectionHalo.rotation.x = -Math.PI / 2
    scene.add(selectionHalo)
  }

  const roleLabel = role === 'center' ? 'your star' : role === 'peer' ? 'relationship in focus' : 'select this orbit'
  const labelElement = createTextLabel(person.name, roleLabel, role === 'center' ? '#FFD875' : '#CDB2E8', true)
  labelElement.setAttribute('aria-label', `${person.name}, ${roleLabel}`)
  labelElement.onclick = () => onSelectPerson(person.id)
  const label = new CSS2DObject(labelElement)
  label.position.set(position.x, position.y + (role === 'center' ? 1.25 : 0.72), position.z)
  scene.add(label)
}

function connectionCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  strandIndex: number,
): THREE.QuadraticBezierCurve3 {
  const direction = end.clone().sub(start).normalize()
  const from = start.clone().addScaledVector(direction, 0.62)
  const to = end.clone().addScaledVector(direction, -0.44)
  const midpoint = from.clone().lerp(to, 0.5)
  const offset = strandIndex - (FLAVOR_DESCENT.length - 1) / 2
  const bend = new THREE.Vector3(-direction.z, 0, direction.x)
    .normalize()
    .multiplyScalar(offset * 0.11)
  bend.y = 0.34 + offset * 0.08
  midpoint.add(bend)
  return new THREE.QuadraticBezierCurve3(from, midpoint, to)
}

function addConnections(
  scene: THREE.Object3D,
  center: RelationshipFieldNode,
  peers: readonly RelationshipFieldNode[],
  positions: ReadonlyMap<string, THREE.Vector3>,
  edges: readonly RelationshipFieldEdge[],
  selectedPeerId: string,
  view: RelationshipView,
): readonly Pulse[] {
  const pulses: Pulse[] = []
  const start = positions.get(center.id)
  if (!start) return pulses

  for (let peerIndex = 0; peerIndex < peers.length; peerIndex++) {
    const peer = peers[peerIndex]
    const end = positions.get(peer.id)
    const edge = findEdge(edges, center.id, peer.id)
    if (!end || !edge) continue
    const pairSelected = peer.id === selectedPeerId

    for (let layerIndex = 0; layerIndex < FLAVOR_DESCENT.length; layerIndex++) {
      const key = FLAVOR_DESCENT[layerIndex]
      const layer = edge.layers[key]
      if (layer.score === null && !layer.tie) continue
      const layerActive = view === 'all' || view === key
      const score = layer.score ?? 100
      const radius = (0.018 + score / 1500) * (pairSelected ? 1.2 : 0.82)
      const curve = connectionCurve(start, end, layerIndex)
      const opacity = pairSelected
        ? layerActive ? (layer.tie ? 0.95 : 0.55) : 0.035
        : layerActive ? (layer.tie ? 0.2 : 0.07) : 0.015
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 28, radius, 6, false),
        new THREE.MeshBasicMaterial({
          color: SYSTEM_FLAVORS[key].accentSoft,
          transparent: true,
          opacity,
          depthWrite: false,
        }),
      )
      scene.add(tube)

      if (!pairSelected || !layer.tie || !layerActive) continue
      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.1, radius * 1.9), 14, 10),
        new THREE.MeshBasicMaterial({ color: SYSTEM_FLAVORS[key].accentSoft }),
      )
      pulse.position.copy(curve.getPoint(0.1 + layerIndex * 0.07))
      scene.add(pulse)
      pulses.push({ mesh: pulse, curve, phase: layerIndex / FLAVOR_DESCENT.length })
    }
  }
  return pulses
}

function addGalaxy(scene: THREE.Scene): void {
  const starCount = 360
  const stars = new Float32Array(starCount * 3)
  for (let index = 0; index < starCount; index++) {
    const seed = index + 1
    stars[index * 3] = Math.sin(seed * 21.17) * 14
    stars[index * 3 + 1] = Math.sin(seed * 7.31) * 9
    stars[index * 3 + 2] = Math.cos(seed * 13.73) * 14
  }
  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(stars, 3))
  scene.add(new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: '#D9CEFF', size: 0.045, transparent: true, opacity: 0.52 }),
  ))

  const dustCount = 720
  const dust = new Float32Array(dustCount * 3)
  for (let index = 0; index < dustCount; index++) {
    const progress = (index + 1) / dustCount
    const radius = Math.sqrt(progress) * 8.4
    const arm = index % 3
    const variation = Math.sin(index * 31.73) * 0.42
    const angle = radius * 0.78 + arm * (Math.PI * 2 / 3) + variation
    dust[index * 3] = Math.cos(angle) * radius
    dust[index * 3 + 1] = Math.sin(index * 17.11) * (0.08 + radius * 0.025)
    dust[index * 3 + 2] = Math.sin(angle) * radius
  }
  const dustGeometry = new THREE.BufferGeometry()
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dust, 3))
  scene.add(new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      color: '#9B78D0',
      size: 0.028,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  ))
}

function disposeGraph(scene: THREE.Object3D): void {
  scene.traverse((object) => {
    const disposable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry
      material?: THREE.Material | THREE.Material[]
    }
    disposable.geometry?.dispose()
    if (Array.isArray(disposable.material)) {
      for (const material of disposable.material) material.dispose()
    } else {
      disposable.material?.dispose()
    }
  })
  scene.clear()
}

export function RelationshipFieldScene({
  data,
  centerId,
  peerId,
  view,
  onSelectPerson,
}: RelationshipFieldSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rebuildRef = useRef<(() => void) | null>(null)
  const selectionRef = useRef({ centerId, peerId, view })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2('#0B0D16', 0.018)
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 80)
    camera.position.set(0, 8.8, 13.5)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
    container.appendChild(renderer.domElement)

    const labelRenderer = new CSS2DRenderer()
    labelRenderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden'
    container.appendChild(labelRenderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.055
    controls.enablePan = false
    controls.minDistance = 10
    controls.maxDistance = 23
    controls.minPolarAngle = 0.48
    controls.maxPolarAngle = 1.46
    controls.target.set(0, 0, 0)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotate = !reducedMotion
    controls.autoRotateSpeed = 0.28
    const stopRotation = () => { controls.autoRotate = false }
    controls.addEventListener('start', stopRotation)

    scene.add(new THREE.AmbientLight('#ffffff', 1.4))
    const keyLight = new THREE.PointLight('#CDB2E8', 28, 32)
    keyLight.position.set(2, 8, 5)
    scene.add(keyLight)
    addGalaxy(scene)

    let content: THREE.Group | null = null
    let pickable: THREE.Mesh[] = []
    let pulses: readonly Pulse[] = []
    let signature = ''
    const rebuild = () => {
      const selection = selectionRef.current
      const nextSignature = `${selection.centerId}:${selection.peerId}:${selection.view}`
      if (signature === nextSignature) return
      signature = nextSignature
      if (content) {
        scene.remove(content)
        disposeGraph(content)
      }
      const center = data.nodes.find((person) => person.id === selection.centerId) ?? data.nodes[0]
      if (!center) return
      const peers = connectedPeople(data, center)
      const placements = orbitPlacements(center, peers, data.edges)
      const selectedPeerId = peers.some((person) => person.id === selection.peerId)
        ? selection.peerId
        : peers[0]?.id ?? center.id
      const nextContent = new THREE.Group()
      addOrbits(nextContent, peers, placements, selectedPeerId)
      pickable = []
      addPerson(
        nextContent,
        center,
        placements.get(center.id)?.position ?? new THREE.Vector3(),
        'center',
        selection.view,
        onSelectPerson,
        pickable,
      )
      for (const peer of peers) {
        const placement = placements.get(peer.id)
        if (!placement) continue
        addPerson(
          nextContent,
          peer,
          placement.position,
          peer.id === selectedPeerId ? 'peer' : 'other',
          selection.view,
          onSelectPerson,
          pickable,
        )
      }
      const positions = new Map<string, THREE.Vector3>()
      for (const [id, placement] of placements) positions.set(id, placement.position)
      pulses = addConnections(
        nextContent,
        center,
        peers,
        positions,
        data.edges,
        selectedPeerId,
        selection.view,
      )
      scene.add(nextContent)
      content = nextContent
    }
    rebuildRef.current = rebuild
    rebuild()

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      const pixelRatio = Math.min(window.devicePixelRatio, 1.6)
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(width, height, false)
      labelRenderer.setSize(width, height)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let pointerStartX = 0
    let pointerStartY = 0
    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObjects(pickable, false)
    }
    const handlePointerDown = (event: PointerEvent) => {
      pointerStartX = event.clientX
      pointerStartY = event.clientY
    }
    const handlePointerMove = (event: PointerEvent) => {
      renderer.domElement.style.cursor = updatePointer(event).length > 0 ? 'pointer' : 'grab'
    }
    const handlePointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) > 5) return
      const hit = updatePointer(event)[0]
      const personId = hit?.object.userData.personId
      if (typeof personId === 'string') onSelectPerson(personId)
    }
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerup', handlePointerUp)

    let visible = true
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    visibilityObserver.observe(container)
    let frame = 0
    const clock = new THREE.Clock()
    const render = () => {
      frame = window.requestAnimationFrame(render)
      if (!visible) return
      const elapsed = clock.getElapsedTime()
      if (!reducedMotion) {
        for (const pulse of pulses) {
          const progress = (elapsed * 0.16 + pulse.phase) % 1
          pulse.mesh.position.copy(pulse.curve.getPoint(progress))
          pulse.mesh.scale.setScalar(0.8 + Math.sin(progress * Math.PI) * 0.45)
        }
      }
      controls.update()
      renderer.render(scene, camera)
      labelRenderer.render(scene, camera)
    }
    render()

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      controls.removeEventListener('start', stopRotation)
      controls.dispose()
      rebuildRef.current = null
      disposeGraph(scene)
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      labelRenderer.domElement.remove()
    }
  }, [data, onSelectPerson])

  useEffect(() => {
    selectionRef.current = { centerId, peerId, view }
    rebuildRef.current?.()
  }, [centerId, peerId, view])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      aria-label="Interactive three-dimensional relationship star system"
    />
  )
}
