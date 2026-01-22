// Board Templates Service for Omnis Phase 4
// Provides template configurations and board generation functions

import type {
  BoardTemplate,
  CanvasState,
  Layer,
  CanvasNode,
  CanvasConnection,
  PersonNode,
  TextNode,
} from '@/lib/types/board'
import { DEFAULT_CANVAS_STATE, DEFAULT_LAYERS } from '@/lib/types/board'

// ============================================================================
// TEMPLATE CONFIGURATIONS
// ============================================================================

export interface BoardTemplateConfig {
  id: BoardTemplate
  name: string
  nameHebrew: string
  description: string
  descriptionHebrew: string
  icon: string
  thumbnail?: string
  defaultLayers: string[]
  autoPopulate?: boolean
  autoConnect?: boolean
  layout?: 'free' | 'hierarchical' | 'circular' | 'force-directed'
  filterRelationships?: string[]
}

export const BOARD_TEMPLATE_CONFIGS: Record<BoardTemplate, BoardTemplateConfig> = {
  blank: {
    id: 'blank',
    name: 'Blank Canvas',
    nameHebrew: 'קנבס ריק',
    description: 'Start with an empty canvas',
    descriptionHebrew: 'התחל עם קנבס ריק',
    icon: '📄',
    defaultLayers: ['background', 'people', 'connections', 'annotations'],
    layout: 'free',
  },
  'relationship-map': {
    id: 'relationship-map',
    name: 'Relationship Map',
    nameHebrew: 'מפת קשרים',
    description: 'Visual network of people and relationships',
    descriptionHebrew: 'רשת ויזואלית של אנשים וקשרים',
    icon: '🕸️',
    thumbnail: '/templates/relationship-map.png',
    defaultLayers: ['background', 'people', 'connections', 'annotations'],
    autoPopulate: true,
    autoConnect: true,
    layout: 'force-directed',
  },
  'family-tree': {
    id: 'family-tree',
    name: 'Family Tree',
    nameHebrew: 'עץ משפחה',
    description: 'Hierarchical family structure',
    descriptionHebrew: 'מבנה משפחה היררכי',
    icon: '🌳',
    thumbnail: '/templates/family-tree.png',
    defaultLayers: ['background', 'people', 'connections'],
    autoPopulate: true,
    autoConnect: true,
    layout: 'hierarchical',
    filterRelationships: ['family'],
  },
  'yearly-overview': {
    id: 'yearly-overview',
    name: 'Yearly Overview',
    nameHebrew: 'סקירה שנתית',
    description: 'Timeline with cycles and forecasts',
    descriptionHebrew: 'ציר זמן עם מחזורים ותחזיות',
    icon: '📅',
    thumbnail: '/templates/yearly.png',
    defaultLayers: ['timeline', 'events', 'annotations'],
    layout: 'free',
  },
  'personal-profile': {
    id: 'personal-profile',
    name: 'Personal Profile',
    nameHebrew: 'פרופיל אישי',
    description: 'Single person with all systems',
    descriptionHebrew: 'אדם יחיד עם כל המערכות',
    icon: '👤',
    thumbnail: '/templates/personal-profile.png',
    defaultLayers: ['background', 'people', 'annotations'],
    layout: 'free',
  },
  'group-analysis': {
    id: 'group-analysis',
    name: 'Group Analysis',
    nameHebrew: 'ניתוח קבוצתי',
    description: 'Group dynamics and compatibility',
    descriptionHebrew: 'דינמיקה קבוצתית ותאימות',
    icon: '👥',
    thumbnail: '/templates/group-analysis.png',
    defaultLayers: ['background', 'people', 'connections', 'annotations'],
    autoPopulate: true,
    autoConnect: true,
    layout: 'circular',
  },
}

// ============================================================================
// TEMPLATE GENERATION
// ============================================================================

interface Person {
  id: string
  name: string
  birth_date: string | null
}

interface Relationship {
  id: string
  person1_id: string
  person2_id: string
  type: string
  subtype?: string | null
}

interface GenerateFromTemplateOptions {
  template: BoardTemplate
  people?: Person[]
  relationships?: Relationship[]
  selectedPersonId?: string
  selectedGroupId?: string
}

/**
 * Generate canvas state from a template
 */
export function generateCanvasFromTemplate(options: GenerateFromTemplateOptions): {
  canvas: CanvasState
  layers: Layer[]
} {
  const { template, people = [], relationships = [] } = options
  const config = BOARD_TEMPLATE_CONFIGS[template]

  // Create layers based on template
  const layers = createLayersForTemplate(config)

  // Create initial canvas state
  const canvas: CanvasState = {
    ...DEFAULT_CANVAS_STATE,
    nodes: [],
    connections: [],
    annotations: [],
  }

  // Generate content based on template type
  switch (template) {
    case 'blank':
      // Empty canvas - add a welcome text
      canvas.nodes.push(createWelcomeTextNode())
      break

    case 'relationship-map':
      if (config.autoPopulate && people.length > 0) {
        const { nodes, connections } = generateRelationshipMapLayout(
          people,
          config.autoConnect ? relationships : [],
          'force-directed'
        )
        canvas.nodes = nodes
        canvas.connections = connections
      }
      break

    case 'family-tree':
      if (config.autoPopulate && people.length > 0) {
        const familyRelationships = relationships.filter(
          r => r.type === 'family' || config.filterRelationships?.includes(r.type)
        )
        const { nodes, connections } = generateRelationshipMapLayout(
          people,
          config.autoConnect ? familyRelationships : [],
          'hierarchical'
        )
        canvas.nodes = nodes
        canvas.connections = connections
      }
      break

    case 'personal-profile':
      if (options.selectedPersonId) {
        const person = people.find(p => p.id === options.selectedPersonId)
        if (person) {
          canvas.nodes = generatePersonalProfileNodes(person)
        }
      } else if (people.length > 0) {
        canvas.nodes = generatePersonalProfileNodes(people[0])
      }
      break

    case 'group-analysis':
      if (config.autoPopulate && people.length > 0) {
        const { nodes, connections } = generateRelationshipMapLayout(
          people,
          config.autoConnect ? relationships : [],
          'circular'
        )
        canvas.nodes = nodes
        canvas.connections = connections
      }
      break

    case 'yearly-overview':
      canvas.nodes.push(createYearlyOverviewTitleNode())
      break
  }

  return { canvas, layers }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createLayersForTemplate(config: BoardTemplateConfig): Layer[] {
  const defaultLayerMap: Record<string, Layer> = {
    background: { id: 'background', name: 'רקע', visible: true, locked: false, opacity: 1, order: 0, color: '#9CA3AF' },
    people: { id: 'people', name: 'אנשים', visible: true, locked: false, opacity: 1, order: 1, color: '#3B82F6' },
    connections: { id: 'connections', name: 'קשרים', visible: true, locked: false, opacity: 1, order: 2, color: '#10B981' },
    annotations: { id: 'annotations', name: 'הערות', visible: true, locked: false, opacity: 1, order: 3, color: '#F59E0B' },
    timeline: { id: 'timeline', name: 'ציר זמן', visible: true, locked: false, opacity: 1, order: 1, color: '#8B5CF6' },
    events: { id: 'events', name: 'אירועים', visible: true, locked: false, opacity: 1, order: 2, color: '#EC4899' },
  }

  return config.defaultLayers
    .map((layerId, index) => {
      const layer = defaultLayerMap[layerId]
      return layer ? { ...layer, order: index } : null
    })
    .filter(Boolean) as Layer[]
}

function createWelcomeTextNode(): TextNode {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    position: { x: 100, y: 100 },
    size: { width: 400, height: 100 },
    rotation: 0,
    locked: false,
    visible: true,
    layerId: 'annotations',
    zIndex: 0,
    style: { opacity: 1 },
    content: 'ברוכים הבאים!\nגרור אנשים מהרשימה כדי להתחיל.',
    textStyle: {
      fontFamily: 'Heebo, sans-serif',
      fontSize: 24,
      fontWeight: 500,
      color: '#1F2937',
      alignment: 'right',
      direction: 'rtl',
    },
  }
}

function createYearlyOverviewTitleNode(): TextNode {
  const currentYear = new Date().getFullYear()
  return {
    id: crypto.randomUUID(),
    type: 'text',
    position: { x: 100, y: 50 },
    size: { width: 300, height: 60 },
    rotation: 0,
    locked: false,
    visible: true,
    layerId: 'annotations',
    zIndex: 0,
    style: { opacity: 1 },
    content: `סקירה שנתית ${currentYear}`,
    textStyle: {
      fontFamily: 'Heebo, sans-serif',
      fontSize: 32,
      fontWeight: 700,
      color: '#1F2937',
      alignment: 'center',
      direction: 'rtl',
    },
  }
}

function generatePersonalProfileNodes(person: Person): CanvasNode[] {
  const nodes: CanvasNode[] = []

  // Main person card
  const personNode: PersonNode = {
    id: crypto.randomUUID(),
    type: 'person',
    position: { x: 400, y: 200 },
    size: { width: 280, height: 400 },
    rotation: 0,
    locked: false,
    visible: true,
    layerId: 'people',
    zIndex: 1,
    style: { opacity: 1 },
    personId: person.id,
    display: 'detailed',
    showSystems: ['dreamspell', 'tzolkin', 'astrology', 'humandesign', 'gematria'],
  }
  nodes.push(personNode)

  // Title
  const titleNode: TextNode = {
    id: crypto.randomUUID(),
    type: 'text',
    position: { x: 400, y: 100 },
    size: { width: 280, height: 60 },
    rotation: 0,
    locked: false,
    visible: true,
    layerId: 'annotations',
    zIndex: 0,
    style: { opacity: 1 },
    content: `פרופיל אישי: ${person.name}`,
    textStyle: {
      fontFamily: 'Heebo, sans-serif',
      fontSize: 28,
      fontWeight: 700,
      color: '#1F2937',
      alignment: 'center',
      direction: 'rtl',
    },
  }
  nodes.push(titleNode)

  return nodes
}

function generateRelationshipMapLayout(
  people: Person[],
  relationships: Relationship[],
  layout: 'force-directed' | 'hierarchical' | 'circular'
): { nodes: CanvasNode[]; connections: CanvasConnection[] } {
  const nodes: CanvasNode[] = []
  const connections: CanvasConnection[] = []

  // Calculate positions based on layout
  const positions = calculateNodePositions(people.length, layout)

  // Create person nodes
  people.forEach((person, index) => {
    const position = positions[index] || { x: 100 + (index % 5) * 200, y: 100 + Math.floor(index / 5) * 200 }

    const personNode: PersonNode = {
      id: crypto.randomUUID(),
      type: 'person',
      position,
      size: { width: 150, height: 180 },
      rotation: 0,
      locked: false,
      visible: true,
      layerId: 'people',
      zIndex: index + 1,
      style: { opacity: 1 },
      personId: person.id,
      display: 'mini',
      showSystems: ['dreamspell', 'tzolkin'],
    }
    nodes.push(personNode)
  })

  // Create connections from relationships
  const personIdToNodeId = new Map<string, string>()
  people.forEach((person, index) => {
    personIdToNodeId.set(person.id, nodes[index].id)
  })

  relationships.forEach(rel => {
    const sourceNodeId = personIdToNodeId.get(rel.person1_id)
    const targetNodeId = personIdToNodeId.get(rel.person2_id)

    if (sourceNodeId && targetNodeId) {
      connections.push({
        id: crypto.randomUUID(),
        type: 'relationship',
        sourceId: sourceNodeId,
        targetId: targetNodeId,
        sourceAnchor: 'auto',
        targetAnchor: 'auto',
        style: {
          color: getRelationshipColor(rel.type),
          width: 2,
        },
        label: rel.subtype || undefined,
        layerId: 'connections',
      })
    }
  })

  return { nodes, connections }
}

function calculateNodePositions(
  count: number,
  layout: 'force-directed' | 'hierarchical' | 'circular'
): { x: number; y: number }[] {
  const centerX = 500
  const centerY = 400
  const positions: { x: number; y: number }[] = []

  switch (layout) {
    case 'circular': {
      const radius = Math.max(200, count * 30)
      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2
        positions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        })
      }
      break
    }

    case 'hierarchical': {
      // Simple hierarchical layout (rows)
      const nodesPerRow = Math.ceil(Math.sqrt(count))
      const horizontalSpacing = 200
      const verticalSpacing = 250

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / nodesPerRow)
        const col = i % nodesPerRow
        positions.push({
          x: 100 + col * horizontalSpacing,
          y: 100 + row * verticalSpacing,
        })
      }
      break
    }

    case 'force-directed':
    default: {
      // Grid-like initial layout for force-directed
      const cols = Math.ceil(Math.sqrt(count))
      const spacing = 220

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols
        positions.push({
          x: 100 + col * spacing + (Math.random() - 0.5) * 40,
          y: 100 + row * spacing + (Math.random() - 0.5) * 40,
        })
      }
      break
    }
  }

  return positions
}

function getRelationshipColor(type: string): string {
  const colors: Record<string, string> = {
    family: '#EF4444',     // Red
    romantic: '#EC4899',   // Pink
    friend: '#3B82F6',     // Blue
    professional: '#10B981', // Green
  }
  return colors[type] || '#6B7280'
}

export default {
  BOARD_TEMPLATE_CONFIGS,
  generateCanvasFromTemplate,
}
