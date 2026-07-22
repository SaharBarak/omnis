'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'framer-motion'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { ResonanceMatrix } from './resonance-matrix'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PageHeader, EmptyState } from '@/components/dashboard'
import { DataRow, Eyebrow, Pill, SPRING } from '@/components/app-kit'
import { SEAL_COLORS, toSealColor } from '@/components/app-kit/seal-colors'
import { COLORS } from '@/lib/design/landing-tokens'
import {
  RELATIONSHIP_ACCENTS,
  relationshipEdgeColor,
  TypeFilterPill,
} from '@/components/relationships/type-accents'
import type { Person } from '@/lib/types/database.types'
import type { RelationshipType, RelationshipWithPeople } from '@/lib/types/relationship'
import { RELATIONSHIP_TYPE_LABELS } from '@/lib/types/relationship'

type GraphView = 'map' | 'matrix'

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

// ---------------------------------------------------------------------------
// Canvas colors — the 2D canvas can't read CSS custom properties, so these
// named constants mirror theme tokens. Keep them in sync with
// src/lib/design/landing-tokens.ts (COLORS) and the contract's four-step
// text ramp; seal ring colors resolve through app-kit/seal-colors.
// ---------------------------------------------------------------------------

/** COLORS.brand (#7D5BC9) at 0.9 — the self node's halo ring. */
const CANVAS_SELF_HALO = 'rgba(125, 91, 201, 0.9)'
/** COLORS.brandSoft (#A78FDF) rgb triplet — the selected node's pulse ring. */
const CANVAS_BRAND_SOFT_RGB = '167, 143, 223'
/** COLORS.surface2 — node disc ground. */
const CANVAS_DISC_FILL = COLORS.surface2
/** Muted ring fallback — the theme's white/50 muted text step. */
const CANVAS_MUTED = 'rgba(255, 255, 255, 0.5)'
/** Initials — white/90 primary text step. */
const CANVAS_INITIALS = 'rgba(255, 255, 255, 0.92)'
/** Node labels — COLORS.brandBright (#EFEAFA) at 0.75. */
const CANVAS_LABEL = 'rgba(239, 234, 250, 0.75)'

/** Orphan nodes under an active filter dim to 35% (mobile map rule). */
const DIMMED_ALPHA = 0.35
/** Half of the selected node's gentle 2.5s pulse cycle (mobile map rule). */
const PULSE_MS = 1250

// Graph data types
interface GraphNode {
  id: string
  name: string
  hebrewName: string | null
  color: string
  val: number // node size
  isSelf: boolean
}

interface GraphLink {
  source: string
  target: string
  type: RelationshipType
  color: string
  width: number
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

/** Seal ring color for a node — SEAL_COLORS canvas values only. */
function sealRingColor(sealColor: string): string {
  const key = toSealColor(sealColor)
  return key ? SEAL_COLORS[key].css : CANVAS_MUTED
}

// Transform data to graph format
function transformToGraphData(
  people: Person[],
  relationships: RelationshipWithPeople[],
  filterType: RelationshipType | null
): { graphData: GraphData; connectedIds: Set<string> } {
  // Create nodes from people
  const nodes: GraphNode[] = people.map(person => {
    const kin = dateToKin(person.birth_date)
    const seal = getSeal(kinToSeal(kin))

    return {
      id: person.id,
      name: person.name,
      hebrewName: person.hebrew_name,
      color: sealRingColor(seal.color),
      val: 1, // base size
      isSelf: Boolean(person.is_self),
    }
  })

  // Filter relationships if needed
  const filteredRelationships = filterType
    ? relationships.filter(r => r.type === filterType)
    : relationships

  // Create links from relationships
  const links: GraphLink[] = filteredRelationships.map(rel => ({
    source: rel.person1_id,
    target: rel.person2_id,
    type: rel.type as RelationshipType,
    color: relationshipEdgeColor(rel.type as RelationshipType),
    width: rel.strength, // use strength for line width
  }))

  // Adjust node sizes based on connection count; remember who has an edge
  // so orphans can dim while a type filter is active.
  const connectedIds = new Set<string>()
  const connectionCounts: Record<string, number> = {}
  filteredRelationships.forEach(rel => {
    connectionCounts[rel.person1_id] = (connectionCounts[rel.person1_id] || 0) + 1
    connectionCounts[rel.person2_id] = (connectionCounts[rel.person2_id] || 0) + 1
    connectedIds.add(rel.person1_id)
    connectedIds.add(rel.person2_id)
  })

  nodes.forEach(node => {
    node.val = 1 + (connectionCounts[node.id] || 0) * 0.5
  })

  return { graphData: { nodes, links }, connectedIds }
}

/** Map/Matrix segmented control — FlavorTabs pattern in neutral chrome. */
function ViewToggle({
  view,
  onChange,
}: {
  view: GraphView
  onChange: (view: GraphView) => void
}) {
  const reduced = useReducedMotion()
  return (
    <div
      role="tablist"
      aria-label="Graph view"
      className="flex w-fit items-center gap-1 rounded-full border border-white/[0.07] bg-surface p-1"
    >
      {(['map', 'matrix'] as const).map((v) => {
        const active = view === v
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={cn(
              'relative rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em]',
              'transition-colors',
              active ? 'text-white/90' : 'text-white/50 hover:text-white/70'
            )}
          >
            {active && (
              <motion.span
                layoutId="graph-view-pill"
                transition={reduced ? { duration: 0 } : SPRING}
                className="absolute inset-0 rounded-full border border-white/[0.12] bg-white/[0.08]"
                aria-hidden
              />
            )}
            <span className="relative">{v === 'map' ? 'Map' : 'Matrix'}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Quiet-chrome icon button for the zoom cluster. */
function ZoomControl({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg border border-white/[0.07] bg-surface',
        'text-white/70 transition-colors hover:border-white/[0.12] hover:text-white/90 active:scale-[0.98]'
      )}
    >
      {children}
    </button>
  )
}

// Selected person details component
function PersonDetails({
  person,
  relationships,
  onClose,
}: {
  person: Person | null
  relationships: RelationshipWithPeople[]
  onClose: () => void
}) {
  if (!person) return null

  const kin = dateToKin(person.birth_date)
  const seal = getSeal(kinToSeal(kin))
  const tone = getTone(kinToTone(kin))

  const personRelationships = relationships.filter(
    r => r.person1_id === person.id || r.person2_id === person.id
  )

  return (
    <Sheet open={!!person} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="font-display">{person.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <DataRow
            label="Kin"
            value={
              <span>
                <span className="font-mono [font-variant-numeric:tabular-nums]">{kin}</span>
                {' · '}
                {tone.name} {seal.english}
              </span>
            }
          />
          {person.hebrew_name && (
            <DataRow label="Hebrew name" value={person.hebrew_name} />
          )}
          <DataRow
            label="Born"
            value={new Date(person.birth_date).toLocaleDateString('en-US')}
            last
          />
        </div>

        {personRelationships.length > 0 && (
          <div className="mt-8 flex flex-col gap-1">
            <Eyebrow>Relationships · {personRelationships.length}</Eyebrow>
            <div>
              {personRelationships.map((rel, i) => {
                const otherPerson = rel.person1_id === person.id ? rel.person2 : rel.person1
                const type = rel.type as RelationshipType
                const typeInfo = RELATIONSHIP_TYPE_LABELS[type]
                return (
                  <div
                    key={rel.id}
                    className={cn(
                      'flex items-center justify-between gap-3 py-2.5',
                      i < personRelationships.length - 1 && 'border-b border-white/[0.07]'
                    )}
                  >
                    <span className="min-w-0 truncate text-sm text-white/90">
                      {otherPerson.name}
                    </span>
                    <Pill
                      accent={RELATIONSHIP_ACCENTS[type] ?? undefined}
                      className="shrink-0 px-2.5 py-0.5 text-[10px]"
                    >
                      {typeInfo.label}
                    </Pill>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/** Layout-matched loading state — spinners are banned. */
function GraphSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="space-y-2">
        <div className="skeleton-shimmer h-8 w-56 rounded" />
        <div className="skeleton-shimmer h-4 w-40 rounded" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton-shimmer h-8 w-24 rounded-full" />
        ))}
      </div>
      <div
        className="skeleton-shimmer min-h-[500px] rounded-xl"
        style={{ height: 'calc(100vh - 16rem)' }}
      />
    </div>
  )
}

// Main Graph Page Component
export default function GraphPage() {
  const { people, loading: peopleLoading } = usePeople()
  const { relationships, loading: relLoading } = useRelationships()
  const reducedMotion = useReducedMotion()

  const [view, setView] = useState<GraphView>('map')
  const [filterType, setFilterType] = useState<RelationshipType | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)

  const loading = peopleLoading || relLoading

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: rect.width,
          height: Math.max(rect.height, 500),
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Spread small graphs out — the default d3 forces pack a handful of
  // nodes into a tight cluster that reads as a blob after zoomToFit.
  useEffect(() => {
    const g = graphRef.current
    if (!g) return
    g.d3Force('charge')?.strength(-160)
    g.d3Force('link')?.distance(55)
  })

  // Transform data for the graph
  const { graphData, connectedIds } = useMemo(() => {
    if (people.length === 0) {
      return { graphData: { nodes: [], links: [] }, connectedIds: new Set<string>() }
    }
    return transformToGraphData(people, relationships, filterType)
  }, [people, relationships, filterType])

  // Handle node click
  const handleNodeClick = useCallback((node: { id?: string | number; [others: string]: any }) => {
    if (!node.id) return
    const person = people.find(p => p.id === node.id)
    if (person) {
      setSelectedPerson(person)
    }
  }, [people])

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom()
      graphRef.current.zoom(currentZoom * 1.5, 400)
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom()
      graphRef.current.zoom(currentZoom / 1.5, 400)
    }
  }, [])

  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50)
    }
  }, [])

  const filtering = filterType !== null
  const selectedId = selectedPerson?.id ?? null

  // Custom node canvas object: dark surface disc, seal-colored ring,
  // initials inside, name underneath. Self gets a brand halo + "You";
  // orphans dim to 35% while a type filter is active; the selected node
  // carries a gentle brand pulse (the canvas repaints every frame for the
  // link particles, so time-based rings animate for free).
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const r = 5 + Math.min(node.val, 3) * 1.5
    const dimmed = filtering && !connectedIds.has(node.id)

    ctx.save()
    if (dimmed) ctx.globalAlpha = DIMMED_ALPHA

    // Selected pulse (static ring under reduced motion)
    if (node.id === selectedId) {
      let ringRadius = r + 3
      let ringAlpha = 0.6
      if (!reducedMotion) {
        const t = (Date.now() % (PULSE_MS * 2)) / (PULSE_MS * 2)
        const phase = t < 0.5 ? t * 2 : (1 - t) * 2 // 0→1→0 triangle
        ringRadius = r + 2 + phase * 2.4
        ringAlpha = 0.7 - phase * 0.45
      }
      ctx.beginPath()
      ctx.arc(node.x, node.y, ringRadius, 0, 2 * Math.PI, false)
      ctx.strokeStyle = `rgba(${CANVAS_BRAND_SOFT_RGB}, ${ringAlpha})`
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Self halo
    if (node.isSelf) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 2.5, 0, 2 * Math.PI, false)
      ctx.strokeStyle = CANVAS_SELF_HALO
      ctx.lineWidth = 1.2
      ctx.stroke()
    }

    // Disc
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false)
    ctx.fillStyle = CANVAS_DISC_FILL
    ctx.fill()
    ctx.strokeStyle = node.color
    ctx.lineWidth = 1.4
    ctx.stroke()

    // Initials
    const initials = String(node.name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('')
    ctx.font = `600 ${r * 0.85}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = CANVAS_INITIALS
    ctx.fillText(initials, node.x, node.y + r * 0.05)

    // Name (screen-constant ~12px, hidden when zoomed far out)
    if (globalScale > 0.6) {
      const labelSize = 12 / globalScale
      ctx.font = `500 ${labelSize}px sans-serif`
      ctx.textBaseline = 'top'
      ctx.fillStyle = CANVAS_LABEL
      const label = node.isSelf ? `${node.name} · You` : node.name
      ctx.fillText(label, node.x, node.y + r + 3 / globalScale)
    }

    ctx.restore()
  }, [filtering, connectedIds, selectedId, reducedMotion])

  if (loading) {
    return <GraphSkeleton />
  }

  const hasData = people.length > 0 && relationships.length > 0

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      <PageHeader
        title="Relationship Map"
        subtitle={`${people.length} people, ${relationships.length} relationships`}
        actions={
          view === 'map' ? (
            <div className="flex items-center gap-2">
              <ZoomControl label="Zoom out" onClick={handleZoomOut}>
                <Minus className="size-4" aria-hidden />
              </ZoomControl>
              <ZoomControl label="Reset view" onClick={handleResetView}>
                <RotateCcw className="size-4" aria-hidden />
              </ZoomControl>
              <ZoomControl label="Zoom in" onClick={handleZoomIn}>
                <Plus className="size-4" aria-hidden />
              </ZoomControl>
            </div>
          ) : undefined
        }
      />

      {/* View toggle + filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <ViewToggle view={view} onChange={setView} />

        {view === 'map' && (
          <>
            <span className="mx-1 h-4 w-px bg-white/[0.07]" aria-hidden />
            <TypeFilterPill active={filterType === null} onClick={() => setFilterType(null)}>
              All
            </TypeFilterPill>
            {(Object.entries(RELATIONSHIP_TYPE_LABELS) as [RelationshipType, typeof RELATIONSHIP_TYPE_LABELS[RelationshipType]][]).map(([type, info]) => (
              <TypeFilterPill
                key={type}
                active={filterType === type}
                accent={RELATIONSHIP_ACCENTS[type]}
                onClick={() => setFilterType(filterType === type ? null : type)}
              >
                {info.label}
              </TypeFilterPill>
            ))}
          </>
        )}
      </div>

      {/* Graph container */}
      <div
        ref={containerRef}
        className="surface-card flex-1 min-h-[500px] overflow-hidden"
        style={{ height: 'calc(100vh - 16rem)' }}
      >
        {view === 'matrix' ? (
          <ResonanceMatrix />
        ) : !hasData ? (
          people.length === 0 ? (
            <EmptyState
              className="h-full"
              icon="people"
              title="No people yet"
              description="Add people to see the relationship map."
              action={{ label: 'Add people', href: '/app/people' }}
            />
          ) : (
            <EmptyState
              className="h-full"
              icon="relationships"
              title="No relationships yet"
              description="Create relationships between people to see the map."
              action={{ label: 'Create relationships', href: '/app/relationships' }}
            />
          )
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel={(node: any) => `${node.name}${node.hebrewName ? ` (${node.hebrewName})` : ''}`}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              const r = 5 + Math.min(node.val, 3) * 1.5
              ctx.fillStyle = color
              ctx.beginPath()
              ctx.arc(node.x, node.y, r + 2.5, 0, 2 * Math.PI, false)
              ctx.fill()
            }}
            linkColor={(link: any) => link.color}
            linkWidth={(link: any) => Math.min(link.width || 1, 3)}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={1.5}
            onNodeClick={handleNodeClick}
            cooldownTicks={100}
            minZoom={0.5}
            maxZoom={8}
            onEngineStop={() => {
              const g = graphRef.current
              if (!g) return
              g.zoomToFit(400, 80)
              // Small graphs otherwise zoom in so far the nodes look enormous.
              setTimeout(() => {
                if (g.zoom() > 3.2) g.zoom(3.2, 200)
              }, 450)
            }}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            enableNodeDrag={true}
          />
        )}
      </div>

      {/* Person details sheet */}
      <PersonDetails
        person={selectedPerson}
        relationships={relationships}
        onClose={() => setSelectedPerson(null)}
      />
    </div>
  )
}
