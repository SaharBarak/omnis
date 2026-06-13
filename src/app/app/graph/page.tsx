'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import type { Person } from '@/lib/types/database.types'
import type { RelationshipType, RelationshipWithPeople } from '@/lib/types/relationship'
import { RELATIONSHIP_TYPE_LABELS } from '@/lib/types/relationship'

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

// Graph data types
interface GraphNode {
  id: string
  name: string
  hebrewName: string | null
  color: string
  val: number // node size
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

// Color mapping for nodes based on Dreamspell colors
const NODE_COLORS: Record<string, string> = {
  red: '#EF4444',
  white: '#F3F4F6',
  blue: '#3B82F6',
  yellow: '#F59E0B',
}

// Get color based on relationship type
function getRelationshipColor(type: RelationshipType): string {
  return RELATIONSHIP_TYPE_LABELS[type]?.color || '#6B7280'
}

// Transform data to graph format
function transformToGraphData(
  people: Person[],
  relationships: RelationshipWithPeople[],
  filterType: RelationshipType | null
): GraphData {
  // Create nodes from people
  const nodes: GraphNode[] = people.map(person => {
    const kin = dateToKin(person.birth_date)
    const seal = getSeal(kinToSeal(kin))
    const color = NODE_COLORS[seal.color] || '#6B7280'

    return {
      id: person.id,
      name: person.name,
      hebrewName: person.hebrew_name,
      color,
      val: 1, // base size
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
    color: getRelationshipColor(rel.type as RelationshipType),
    width: rel.strength, // use strength for line width
  }))

  // Adjust node sizes based on connection count
  const connectionCounts: Record<string, number> = {}
  links.forEach(link => {
    connectionCounts[link.source] = (connectionCounts[link.source] || 0) + 1
    connectionCounts[link.target] = (connectionCounts[link.target] || 0) + 1
  })

  nodes.forEach(node => {
    node.val = 1 + (connectionCounts[node.id] || 0) * 0.5
  })

  return { nodes, links }
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
          <SheetTitle className="font-heading">{person.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {person.hebrew_name && (
            <p className="text-muted-foreground">{person.hebrew_name}</p>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Birth Date: {new Date(person.birth_date).toLocaleDateString('en-US')}
            </p>
            <p className="text-sm">
              <span className="font-medium text-primary">Kin {kin}: </span>
              <span className="text-foreground">{tone.name} {seal.english}</span>
            </p>
          </div>

          {personRelationships.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-heading text-foreground">Relationships ({personRelationships.length})</h4>
              <div className="space-y-1">
                {personRelationships.map(rel => {
                  const otherPerson = rel.person1_id === person.id ? rel.person2 : rel.person1
                  const typeInfo = RELATIONSHIP_TYPE_LABELS[rel.type as RelationshipType]
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50"
                    >
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}
                      >
                        {typeInfo.label}
                      </Badge>
                      <span className="text-foreground">{otherPerson.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Main Graph Page Component
export default function GraphPage() {
  const { people, loading: peopleLoading } = usePeople()
  const { relationships, loading: relLoading } = useRelationships()

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

  // Transform data for the graph
  const graphData = useMemo(() => {
    if (people.length === 0) {
      return { nodes: [], links: [] }
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

  // Custom node canvas object
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name
    const fontSize = Math.max(10 / globalScale, 4)
    ctx.font = `${fontSize}px sans-serif`

    // Draw node circle
    const nodeSize = 4 + node.val * 2
    ctx.beginPath()
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false)
    ctx.fillStyle = node.color
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1 / globalScale
    ctx.stroke()

    // Draw label
    if (globalScale > 0.7) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#1F2937'
      ctx.fillText(label, node.x, node.y + nodeSize + 2)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const hasData = people.length > 0 && relationships.length > 0

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading text-foreground">Relationship Map</h1>
          <p className="text-muted-foreground">
            {people.length} people, {relationships.length} relationships
          </p>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            -
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetView}>
            ⟳
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            +
          </Button>
        </div>
      </div>

      {/* Filter badges */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={filterType === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilterType(null)}
        >
          All
        </Badge>
        {(Object.entries(RELATIONSHIP_TYPE_LABELS) as [RelationshipType, typeof RELATIONSHIP_TYPE_LABELS[RelationshipType]][]).map(([type, info]) => (
          <Badge
            key={type}
            variant={filterType === type ? 'default' : 'outline'}
            className="cursor-pointer"
            style={filterType === type ? {
              backgroundColor: info.color,
              borderColor: info.color,
            } : {
              borderColor: info.color,
              color: info.color,
            }}
            onClick={() => setFilterType(filterType === type ? null : type)}
          >
            {info.label}
          </Badge>
        ))}
      </div>

      {/* Graph container */}
      <div
        ref={containerRef}
        className="earth-card bg-card flex-1 min-h-[500px] overflow-hidden"
        style={{ height: 'calc(100vh - 16rem)' }}
      >
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {people.length === 0
                ? 'Add people to see the relationship map'
                : 'Create relationships between people to see the map'}
            </p>
            {people.length === 0 ? (
              <Button onClick={() => window.location.href = '/app/people'} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                + Add People
              </Button>
            ) : (
              <Button onClick={() => window.location.href = '/app/relationships'} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                + Create Relationships
              </Button>
            )}
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel={(node: any) => `${node.name}${node.hebrewName ? ` (${node.hebrewName})` : ''}`}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              const nodeSize = 4 + node.val * 2
              ctx.fillStyle = color
              ctx.beginPath()
              ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false)
              ctx.fill()
            }}
            linkColor={(link: any) => link.color}
            linkWidth={(link: any) => link.width}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            onNodeClick={handleNodeClick}
            cooldownTicks={100}
            onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
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
