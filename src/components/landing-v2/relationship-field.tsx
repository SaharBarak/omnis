'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RelationshipView } from './relationship-field-scene'
import { FLAVOR_DESCENT, SYSTEM_FLAVORS, type SystemKey } from '@/lib/design/system-flavors'
import { COLORS } from '@/lib/design/landing-tokens'
import type {
  RelationshipFieldData,
  RelationshipFieldEdge,
  RelationshipFieldLayer,
  RelationshipFieldNode,
} from '@/lib/data/homepage-demo'

const RelationshipFieldScene = dynamic(
  () => import('./relationship-field-scene').then((module) => module.RelationshipFieldScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center font-mono text-[10px] uppercase tracking-widest text-white/35">
        Building relationship space…
      </div>
    ),
  },
)

const VIEW_SEQUENCE: readonly RelationshipView[] = ['all', ...FLAVOR_DESCENT]

const SYSTEM_SHORT_NAME: Readonly<Record<SystemKey, string>> = Object.freeze({
  astrology: 'Astrology',
  dreamspell: 'Dreamspell',
  tzolkin: 'Tzolkin',
  humanDesign: 'Human Design',
  gematria: 'Gematria',
})

function edgeFor(
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
    const peerId = edge.a === center.id ? edge.b : edge.a
    const peer = data.nodes.find((person) => person.id === peerId)
    if (peer) people.push(peer)
  }
  return people
}

function layerLabel(layer: RelationshipFieldLayer, key: SystemKey): string {
  if (layer.tie) {
    const channel = layer.tie.channel ? ` · channel ${layer.tie.channel}` : ''
    return `${layer.tie.type.replace(/-/g, ' ')}${channel}`
  }
  if (key === 'gematria') return 'No exact name-value match'
  return 'Compatibility score · no named signal'
}

function layerValue(layer: RelationshipFieldLayer, key: SystemKey): string {
  if (key === 'gematria') return layer.tie ? 'Exact' : '—'
  return String(layer.score ?? '—')
}

function ConnectionLedger({
  center,
  peer,
  edge,
  view,
  onFocus,
  onRecenter,
}: {
  readonly center: RelationshipFieldNode
  readonly peer: RelationshipFieldNode
  readonly edge: RelationshipFieldEdge
  readonly view: RelationshipView
  readonly onFocus: (key: SystemKey) => void
  readonly onRecenter: () => void
}) {
  return (
    <aside className="rounded-xl border border-white/10 bg-ground/80 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">Relationship in focus</p>
          <h3 className="mt-1 font-display text-lg font-medium text-white">
            {center.name} + {peer.name}
          </h3>
        </div>
        <div className="text-right font-mono text-[10px]">
          <p className="text-brand-soft">{edge.overall} combined</p>
          <p className="mt-1 text-white/35">rarity {edge.rarity}</p>
        </div>
      </div>

      {view !== 'all' && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/[0.025] p-2">
          <div>
            <p className="text-[9px] font-medium text-white/70">{center.name}</p>
            <p className="mt-1 text-[9px] leading-snug text-white/40">{center.profiles[view]}</p>
          </div>
          <div>
            <p className="text-[9px] font-medium text-white/70">{peer.name}</p>
            <p className="mt-1 text-[9px] leading-snug text-white/40">{peer.profiles[view]}</p>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        {FLAVOR_DESCENT.map((key) => {
          const layer = edge.layers[key]
          const flavor = SYSTEM_FLAVORS[key]
          const active = view === 'all' || view === key
          return (
            <button
              key={key}
              type="button"
              className="w-full rounded-lg border px-3 py-2 text-left transition"
              style={{
                borderColor: active ? `${flavor.accentSoft}55` : 'rgba(255,255,255,0.07)',
                backgroundColor: active ? `${flavor.accent}12` : 'transparent',
                opacity: active ? 1 : 0.42,
              }}
              onClick={() => onFocus(key)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: flavor.accentSoft }} />
                  {SYSTEM_SHORT_NAME[key]}
                </span>
                <span className="font-mono text-[11px]" style={{ color: flavor.accentSoft }}>
                  {layerValue(layer, key)}
                </span>
              </span>
              <span className="mt-1 block text-[10px] capitalize leading-snug text-white/55">
                {layerLabel(layer, key)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 rounded-lg border border-dashed border-white/10 px-3 py-2">
        <div className="flex items-center justify-between gap-3 text-[10px]">
          <span className="uppercase tracking-wider text-white/45">Long Count</span>
          <span className="font-mono text-white/35">profile only</span>
        </div>
        <p className="mt-1 font-mono text-[9px] leading-relaxed text-white/35">
          {center.name} {center.longCount} · {peer.name} {peer.longCount}
        </p>
      </div>

      <button
        type="button"
        className="mt-3 w-full rounded-lg border border-brand/35 bg-brand/10 px-3 py-2 text-[10px] font-medium text-brand-soft transition hover:bg-brand/20"
        onClick={onRecenter}
      >
        Put {peer.name} at the center
      </button>
    </aside>
  )
}

export function RelationshipField({ data }: { readonly data: RelationshipFieldData }) {
  const [centerId, setCenterId] = useState(data.initialCenterId)
  const [peerId, setPeerId] = useState(
    () => data.nodes.find((person) => person.id !== data.initialCenterId)?.id ?? data.initialCenterId,
  )
  const [view, setView] = useState<RelationshipView>('all')
  const center = data.nodes.find((person) => person.id === centerId) ?? data.nodes[0]
  const centerIdRef = useRef(center.id)
  useEffect(() => {
    centerIdRef.current = center.id
  }, [center.id])
  const peers = useMemo(() => connectedPeople(data, center), [center, data])
  const peer = peers.find((person) => person.id === peerId) ?? peers[0]
  const edge = peer ? edgeFor(data.edges, center.id, peer.id) : null

  const selectPerson = useCallback((id: string) => {
    if (id === centerIdRef.current) return
    setPeerId(id)
  }, [])

  const recenter = () => {
    if (!peer) return
    const previousCenter = center.id
    setCenterId(peer.id)
    setPeerId(previousCenter)
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-3">
        <div>
          <p className="font-display text-base font-medium text-white">Your people, arranged as a living star system.</p>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-white/45">
            The center person is the star. Stronger combined relationships orbit closer; rarer ones travel on steeper paths.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Relationship layers">
          {VIEW_SEQUENCE.map((key) => {
            const active = view === key
            const accent = key === 'all' ? COLORS.brandSoft : SYSTEM_FLAVORS[key].accentSoft
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setView(key)}
                className="rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition"
                style={{
                  color: active ? accent : 'rgba(255,255,255,0.4)',
                  borderColor: active ? `${accent}88` : 'rgba(255,255,255,0.1)',
                  backgroundColor: active ? `${accent}12` : 'transparent',
                }}
              >
                {key === 'all' ? 'All systems' : SYSTEM_SHORT_NAME[key]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="relative min-h-[460px] overflow-hidden rounded-xl border border-white/10 bg-ground/55 sm:min-h-[540px]">
          {peer && (
            <RelationshipFieldScene
              data={data}
              centerId={center.id}
              peerId={peer.id}
              view={view}
              onSelectPerson={selectPerson}
            />
          )}

          <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-ground/75 px-3 py-2 backdrop-blur-sm">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Your relationship system</p>
            <p className="mt-1 text-[10px] text-white/65">Drag to rotate · scroll to zoom</p>
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 right-3 grid grid-cols-4 gap-1 rounded-lg border border-white/10 bg-ground/80 px-3 py-2 text-center backdrop-blur-sm">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/35">Distance</p>
              <p className="mt-1 text-[9px] text-white/65">Combined score</p>
            </div>
            <div className="border-x border-white/10">
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/35">Orbit tilt</p>
              <p className="mt-1 text-[9px] text-white/65">Rarity</p>
            </div>
            <div className="border-r border-white/10">
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/35">Line weight</p>
              <p className="mt-1 text-[9px] text-white/65">System score</p>
            </div>
            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/35">Light signal</p>
              <p className="mt-1 text-[9px] text-white/65">Named signal</p>
            </div>
          </div>
        </div>

        {peer && edge && (
          <ConnectionLedger
            center={center}
            peer={peer}
            edge={edge}
            view={view}
            onFocus={setView}
            onRecenter={recenter}
          />
        )}
      </div>

      <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
        Click a planet to compare · isolate any system · recenter the star from the relationship panel
      </p>
    </div>
  )
}
