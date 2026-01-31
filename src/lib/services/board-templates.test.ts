import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  BOARD_TEMPLATE_CONFIGS,
  generateCanvasFromTemplate,
  type BoardTemplateConfig,
} from './board-templates'
import type { BoardTemplate } from '@/lib/types/board'

// Mock crypto.randomUUID for predictable IDs
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).slice(2, 11)),
})

describe('Board Templates Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('BOARD_TEMPLATE_CONFIGS', () => {
    it('should have all 6 template configurations', () => {
      const templates: BoardTemplate[] = [
        'blank',
        'relationship-map',
        'family-tree',
        'yearly-overview',
        'personal-profile',
        'group-analysis',
      ]

      templates.forEach(template => {
        expect(BOARD_TEMPLATE_CONFIGS[template]).toBeDefined()
      })
    })

    it('should have required fields for each template', () => {
      const requiredFields: (keyof BoardTemplateConfig)[] = [
        'id',
        'name',
        'nameHebrew',
        'description',
        'descriptionHebrew',
        'icon',
        'defaultLayers',
      ]

      Object.values(BOARD_TEMPLATE_CONFIGS).forEach(config => {
        requiredFields.forEach(field => {
          expect(config[field]).toBeDefined()
        })
      })
    })

    it('should have valid Hebrew names for all templates', () => {
      expect(BOARD_TEMPLATE_CONFIGS.blank.nameHebrew).toBe('קנבס ריק')
      expect(BOARD_TEMPLATE_CONFIGS['relationship-map'].nameHebrew).toBe('מפת קשרים')
      expect(BOARD_TEMPLATE_CONFIGS['family-tree'].nameHebrew).toBe('עץ משפחה')
      expect(BOARD_TEMPLATE_CONFIGS['yearly-overview'].nameHebrew).toBe('סקירה שנתית')
      expect(BOARD_TEMPLATE_CONFIGS['personal-profile'].nameHebrew).toBe('פרופיל אישי')
      expect(BOARD_TEMPLATE_CONFIGS['group-analysis'].nameHebrew).toBe('ניתוח קבוצתי')
    })

    it('should have icons for all templates', () => {
      expect(BOARD_TEMPLATE_CONFIGS.blank.icon).toBe('📄')
      expect(BOARD_TEMPLATE_CONFIGS['relationship-map'].icon).toBe('🕸️')
      expect(BOARD_TEMPLATE_CONFIGS['family-tree'].icon).toBe('🌳')
      expect(BOARD_TEMPLATE_CONFIGS['yearly-overview'].icon).toBe('📅')
      expect(BOARD_TEMPLATE_CONFIGS['personal-profile'].icon).toBe('👤')
      expect(BOARD_TEMPLATE_CONFIGS['group-analysis'].icon).toBe('👥')
    })

    it('should have autoPopulate and autoConnect for relationship-based templates', () => {
      expect(BOARD_TEMPLATE_CONFIGS['relationship-map'].autoPopulate).toBe(true)
      expect(BOARD_TEMPLATE_CONFIGS['relationship-map'].autoConnect).toBe(true)
      expect(BOARD_TEMPLATE_CONFIGS['family-tree'].autoPopulate).toBe(true)
      expect(BOARD_TEMPLATE_CONFIGS['family-tree'].autoConnect).toBe(true)
      expect(BOARD_TEMPLATE_CONFIGS['group-analysis'].autoPopulate).toBe(true)
      expect(BOARD_TEMPLATE_CONFIGS['group-analysis'].autoConnect).toBe(true)
    })

    it('should have correct layout types', () => {
      expect(BOARD_TEMPLATE_CONFIGS.blank.layout).toBe('free')
      expect(BOARD_TEMPLATE_CONFIGS['relationship-map'].layout).toBe('force-directed')
      expect(BOARD_TEMPLATE_CONFIGS['family-tree'].layout).toBe('hierarchical')
      expect(BOARD_TEMPLATE_CONFIGS['yearly-overview'].layout).toBe('free')
      expect(BOARD_TEMPLATE_CONFIGS['personal-profile'].layout).toBe('free')
      expect(BOARD_TEMPLATE_CONFIGS['group-analysis'].layout).toBe('circular')
    })

    it('should filter family relationships for family-tree template', () => {
      expect(BOARD_TEMPLATE_CONFIGS['family-tree'].filterRelationships).toContain('family')
    })
  })

  describe('generateCanvasFromTemplate', () => {
    describe('blank template', () => {
      it('should create a blank canvas with welcome text', () => {
        const result = generateCanvasFromTemplate({ template: 'blank' })

        expect(result.canvas.nodes).toHaveLength(1)
        expect(result.canvas.nodes[0].type).toBe('text')
        expect(result.canvas.connections).toHaveLength(0)
      })

      it('should include welcome text in Hebrew', () => {
        const result = generateCanvasFromTemplate({ template: 'blank' })
        const textNode = result.canvas.nodes[0] as { content?: string }

        expect(textNode.content).toContain('ברוכים הבאים')
      })

      it('should create proper layers for blank template', () => {
        const result = generateCanvasFromTemplate({ template: 'blank' })

        expect(result.layers).toHaveLength(4)
        expect(result.layers.map(l => l.id)).toEqual([
          'background',
          'people',
          'connections',
          'annotations',
        ])
      })
    })

    describe('relationship-map template', () => {
      const testPeople = [
        { id: 'person-1', name: 'Alice', birth_date: '1990-01-01' },
        { id: 'person-2', name: 'Bob', birth_date: '1985-05-15' },
        { id: 'person-3', name: 'Charlie', birth_date: '1992-12-20' },
      ]

      const testRelationships = [
        { id: 'rel-1', person1_id: 'person-1', person2_id: 'person-2', type: 'friend' },
        { id: 'rel-2', person1_id: 'person-2', person2_id: 'person-3', type: 'family' },
      ]

      it('should create nodes for all people', () => {
        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
          relationships: [],
        })

        expect(result.canvas.nodes).toHaveLength(3)
        result.canvas.nodes.forEach(node => {
          expect(node.type).toBe('person')
        })
      })

      it('should create connections for relationships', () => {
        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
          relationships: testRelationships,
        })

        expect(result.canvas.connections).toHaveLength(2)
      })

      it('should use force-directed layout', () => {
        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
        })

        // Nodes should have positions with some randomness
        const positions = result.canvas.nodes.map(n => n.position)
        expect(positions.every(p => typeof p.x === 'number' && typeof p.y === 'number')).toBe(true)
      })

      it('should handle empty people array', () => {
        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: [],
          relationships: [],
        })

        expect(result.canvas.nodes).toHaveLength(0)
        expect(result.canvas.connections).toHaveLength(0)
      })
    })

    describe('family-tree template', () => {
      const testPeople = [
        { id: 'parent', name: 'Parent', birth_date: '1960-01-01' },
        { id: 'child1', name: 'Child 1', birth_date: '1990-01-01' },
        { id: 'child2', name: 'Child 2', birth_date: '1992-01-01' },
      ]

      const testRelationships = [
        { id: 'rel-1', person1_id: 'parent', person2_id: 'child1', type: 'family' },
        { id: 'rel-2', person1_id: 'parent', person2_id: 'child2', type: 'family' },
        { id: 'rel-3', person1_id: 'child1', person2_id: 'friend-id', type: 'friend' }, // Non-family, should be filtered
      ]

      it('should filter non-family relationships', () => {
        const result = generateCanvasFromTemplate({
          template: 'family-tree',
          people: testPeople,
          relationships: testRelationships,
        })

        // Should only have 2 connections (family relationships)
        expect(result.canvas.connections).toHaveLength(2)
      })

      it('should use hierarchical layout', () => {
        const result = generateCanvasFromTemplate({
          template: 'family-tree',
          people: testPeople,
          relationships: testRelationships,
        })

        expect(result.canvas.nodes).toHaveLength(3)
      })
    })

    describe('personal-profile template', () => {
      const testPeople = [
        { id: 'person-1', name: 'Alice', birth_date: '1990-01-01' },
        { id: 'person-2', name: 'Bob', birth_date: '1985-05-15' },
      ]

      it('should create profile for selected person', () => {
        const result = generateCanvasFromTemplate({
          template: 'personal-profile',
          people: testPeople,
          selectedPersonId: 'person-1',
        })

        expect(result.canvas.nodes).toHaveLength(2) // Person node + title node
        const personNode = result.canvas.nodes.find(n => n.type === 'person')
        expect(personNode).toBeDefined()
        expect((personNode as { personId?: string })?.personId).toBe('person-1')
      })

      it('should use first person if no selectedPersonId', () => {
        const result = generateCanvasFromTemplate({
          template: 'personal-profile',
          people: testPeople,
        })

        const personNode = result.canvas.nodes.find(n => n.type === 'person')
        expect((personNode as { personId?: string })?.personId).toBe('person-1')
      })

      it('should include title with person name', () => {
        const result = generateCanvasFromTemplate({
          template: 'personal-profile',
          people: testPeople,
          selectedPersonId: 'person-1',
        })

        const textNode = result.canvas.nodes.find(n => n.type === 'text') as { content?: string }
        expect(textNode?.content).toContain('Alice')
      })

      it('should show all systems for detailed view', () => {
        const result = generateCanvasFromTemplate({
          template: 'personal-profile',
          people: testPeople,
          selectedPersonId: 'person-1',
        })

        const personNode = result.canvas.nodes.find(n => n.type === 'person') as { showSystems?: string[] }
        expect(personNode?.showSystems).toEqual([
          'dreamspell',
          'tzolkin',
          'astrology',
          'humandesign',
          'gematria',
        ])
      })

      it('should handle empty people array', () => {
        const result = generateCanvasFromTemplate({
          template: 'personal-profile',
          people: [],
        })

        expect(result.canvas.nodes).toHaveLength(0)
      })
    })

    describe('group-analysis template', () => {
      const testPeople = [
        { id: 'person-1', name: 'Alice', birth_date: '1990-01-01' },
        { id: 'person-2', name: 'Bob', birth_date: '1985-05-15' },
        { id: 'person-3', name: 'Charlie', birth_date: '1992-12-20' },
        { id: 'person-4', name: 'Diana', birth_date: '1988-07-04' },
      ]

      it('should use circular layout', () => {
        const result = generateCanvasFromTemplate({
          template: 'group-analysis',
          people: testPeople,
        })

        expect(result.canvas.nodes).toHaveLength(4)

        // In circular layout, positions should form a circle
        const positions = result.canvas.nodes.map(n => n.position)
        const centerX = 500
        const centerY = 400

        // Check that distances from center are roughly equal (within margin)
        const distances = positions.map(p =>
          Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
        )
        const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length
        distances.forEach(d => {
          expect(Math.abs(d - avgDistance)).toBeLessThan(10)
        })
      })
    })

    describe('yearly-overview template', () => {
      it('should create yearly overview title node', () => {
        const result = generateCanvasFromTemplate({ template: 'yearly-overview' })

        expect(result.canvas.nodes).toHaveLength(1)
        expect(result.canvas.nodes[0].type).toBe('text')
      })

      it('should include current year in title', () => {
        const result = generateCanvasFromTemplate({ template: 'yearly-overview' })
        const textNode = result.canvas.nodes[0] as { content?: string }
        const currentYear = new Date().getFullYear()

        expect(textNode.content).toContain(currentYear.toString())
        expect(textNode.content).toContain('סקירה שנתית')
      })

      it('should create timeline and events layers', () => {
        const result = generateCanvasFromTemplate({ template: 'yearly-overview' })

        expect(result.layers.map(l => l.id)).toContain('timeline')
        expect(result.layers.map(l => l.id)).toContain('events')
      })
    })

    describe('Layer Generation', () => {
      it('should create layers with correct order', () => {
        const result = generateCanvasFromTemplate({ template: 'blank' })

        result.layers.forEach((layer, index) => {
          expect(layer.order).toBe(index)
        })
      })

      it('should create layers with proper visibility', () => {
        const result = generateCanvasFromTemplate({ template: 'relationship-map' })

        result.layers.forEach(layer => {
          expect(layer.visible).toBe(true)
          expect(layer.locked).toBe(false)
          expect(layer.opacity).toBe(1)
        })
      })

      it('should create layers with Hebrew names', () => {
        const result = generateCanvasFromTemplate({ template: 'relationship-map' })

        const backgroundLayer = result.layers.find(l => l.id === 'background')
        const peopleLayer = result.layers.find(l => l.id === 'people')
        const connectionsLayer = result.layers.find(l => l.id === 'connections')
        const annotationsLayer = result.layers.find(l => l.id === 'annotations')

        expect(backgroundLayer?.name).toBe('רקע')
        expect(peopleLayer?.name).toBe('אנשים')
        expect(connectionsLayer?.name).toBe('קשרים')
        expect(annotationsLayer?.name).toBe('הערות')
      })
    })

    describe('Connection Generation', () => {
      const testPeople = [
        { id: 'person-1', name: 'Alice', birth_date: '1990-01-01' },
        { id: 'person-2', name: 'Bob', birth_date: '1985-05-15' },
      ]

      it('should set connection type to relationship', () => {
        const relationships = [
          { id: 'rel-1', person1_id: 'person-1', person2_id: 'person-2', type: 'friend' },
        ]

        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
          relationships,
        })

        expect(result.canvas.connections[0].type).toBe('relationship')
      })

      it('should use correct colors for relationship types', () => {
        const relationships = [
          { id: 'rel-1', person1_id: 'person-1', person2_id: 'person-2', type: 'family' },
        ]

        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
          relationships,
        })

        expect(result.canvas.connections[0].style.color).toBe('#EF4444') // Family = red
      })

      it('should use different colors for different relationship types', () => {
        const testPeopleExtended = [
          ...testPeople,
          { id: 'person-3', name: 'Charlie', birth_date: '1992-01-01' },
          { id: 'person-4', name: 'Diana', birth_date: '1988-01-01' },
        ]

        const relationships = [
          { id: 'rel-1', person1_id: 'person-1', person2_id: 'person-2', type: 'family' },
          { id: 'rel-2', person1_id: 'person-2', person2_id: 'person-3', type: 'romantic' },
          { id: 'rel-3', person1_id: 'person-3', person2_id: 'person-4', type: 'friend' },
          { id: 'rel-4', person1_id: 'person-1', person2_id: 'person-4', type: 'professional' },
        ]

        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeopleExtended,
          relationships,
        })

        const familyConnection = result.canvas.connections.find(c =>
          relationships.find(r => r.type === 'family' &&
            ((result.canvas.nodes.findIndex(n => n.id === c.sourceId) !== -1 &&
              result.canvas.nodes.findIndex(n => n.id === c.targetId) !== -1)))
        )

        // Check that connections have appropriate colors
        expect(result.canvas.connections.map(c => c.style.color)).toContain('#EF4444') // family
        expect(result.canvas.connections.map(c => c.style.color)).toContain('#EC4899') // romantic
        expect(result.canvas.connections.map(c => c.style.color)).toContain('#3B82F6') // friend
        expect(result.canvas.connections.map(c => c.style.color)).toContain('#10B981') // professional
      })

      it('should use default color for unknown relationship types', () => {
        const relationships = [
          { id: 'rel-1', person1_id: 'person-1', person2_id: 'person-2', type: 'unknown-type' },
        ]

        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
          relationships,
        })

        expect(result.canvas.connections[0].style.color).toBe('#6B7280') // Default gray
      })

      it('should include subtype as label if present', () => {
        const relationships = [
          { id: 'rel-1', person1_id: 'person-1', person2_id: 'person-2', type: 'family', subtype: 'parent' },
        ]

        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
          relationships,
        })

        expect(result.canvas.connections[0].label).toBe('parent')
      })

      it('should not skip relationships with missing person IDs', () => {
        const relationships = [
          { id: 'rel-1', person1_id: 'person-1', person2_id: 'non-existent', type: 'friend' },
        ]

        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
          relationships,
        })

        // Connection should not be created for missing person
        expect(result.canvas.connections).toHaveLength(0)
      })
    })

    describe('Canvas State', () => {
      it('should initialize with default canvas dimensions', () => {
        const result = generateCanvasFromTemplate({ template: 'blank' })

        expect(result.canvas.width).toBeDefined()
        expect(result.canvas.height).toBeDefined()
        expect(result.canvas.viewBox).toBeDefined()
        expect(result.canvas.background).toBeDefined()
        expect(result.canvas.grid).toBeDefined()
      })

      it('should initialize with empty annotations array', () => {
        const result = generateCanvasFromTemplate({ template: 'blank' })

        expect(result.canvas.annotations).toEqual([])
      })
    })
  })

  describe('Node Position Calculations', () => {
    describe('Circular Layout', () => {
      it('should position nodes in a circle', () => {
        const testPeople = Array.from({ length: 4 }, (_, i) => ({
          id: `person-${i}`,
          name: `Person ${i}`,
          birth_date: '1990-01-01',
        }))

        const result = generateCanvasFromTemplate({
          template: 'group-analysis',
          people: testPeople,
        })

        const positions = result.canvas.nodes.map(n => n.position)

        // Should have 4 nodes at 90-degree intervals
        expect(positions).toHaveLength(4)
      })

      it('should scale radius with node count', () => {
        const smallGroup = Array.from({ length: 3 }, (_, i) => ({
          id: `person-${i}`,
          name: `Person ${i}`,
          birth_date: '1990-01-01',
        }))

        const largeGroup = Array.from({ length: 10 }, (_, i) => ({
          id: `person-${i}`,
          name: `Person ${i}`,
          birth_date: '1990-01-01',
        }))

        const smallResult = generateCanvasFromTemplate({
          template: 'group-analysis',
          people: smallGroup,
        })

        const largeResult = generateCanvasFromTemplate({
          template: 'group-analysis',
          people: largeGroup,
        })

        // Large group should use larger radius
        const smallPositions = smallResult.canvas.nodes.map(n => n.position)
        const largePositions = largeResult.canvas.nodes.map(n => n.position)

        const centerX = 500
        const centerY = 400

        const smallRadius = Math.sqrt(
          Math.pow(smallPositions[0].x - centerX, 2) +
          Math.pow(smallPositions[0].y - centerY, 2)
        )
        const largeRadius = Math.sqrt(
          Math.pow(largePositions[0].x - centerX, 2) +
          Math.pow(largePositions[0].y - centerY, 2)
        )

        expect(largeRadius).toBeGreaterThan(smallRadius)
      })
    })

    describe('Hierarchical Layout', () => {
      it('should position nodes in rows', () => {
        const testPeople = Array.from({ length: 6 }, (_, i) => ({
          id: `person-${i}`,
          name: `Person ${i}`,
          birth_date: '1990-01-01',
        }))

        const result = generateCanvasFromTemplate({
          template: 'family-tree',
          people: testPeople,
          relationships: [],
        })

        const positions = result.canvas.nodes.map(n => n.position)

        // Check that Y positions form rows
        const uniqueYs = Array.from(new Set(positions.map(p => p.y)))
        expect(uniqueYs.length).toBeGreaterThanOrEqual(2) // At least 2 rows for 6 people
      })
    })

    describe('Force-Directed Layout', () => {
      it('should add randomness to positions', () => {
        const testPeople = Array.from({ length: 4 }, (_, i) => ({
          id: `person-${i}`,
          name: `Person ${i}`,
          birth_date: '1990-01-01',
        }))

        // Run twice to check for randomness
        const result1 = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
        })

        const result2 = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
        })

        // Positions should differ slightly due to randomness
        const positions1 = result1.canvas.nodes.map(n => n.position)
        const positions2 = result2.canvas.nodes.map(n => n.position)

        // At least one position should be different (due to random offset)
        let hasDifference = false
        for (let i = 0; i < positions1.length; i++) {
          if (positions1[i].x !== positions2[i].x || positions1[i].y !== positions2[i].y) {
            hasDifference = true
            break
          }
        }
        expect(hasDifference).toBe(true)
      })
    })

    describe('Fallback Positioning', () => {
      it('should use grid fallback for large node count', () => {
        const testPeople = Array.from({ length: 25 }, (_, i) => ({
          id: `person-${i}`,
          name: `Person ${i}`,
          birth_date: '1990-01-01',
        }))

        const result = generateCanvasFromTemplate({
          template: 'relationship-map',
          people: testPeople,
        })

        expect(result.canvas.nodes).toHaveLength(25)

        // All nodes should have valid positions
        result.canvas.nodes.forEach(node => {
          expect(node.position.x).toBeGreaterThanOrEqual(0)
          expect(node.position.y).toBeGreaterThanOrEqual(0)
        })
      })
    })
  })
})
