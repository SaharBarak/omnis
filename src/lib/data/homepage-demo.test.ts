import { describe, expect, it } from 'vitest'
import { buildHomepageDemo, buildRelationshipField } from './homepage-demo'
import { FLAVOR_DESCENT } from '@/lib/design/system-flavors'

describe('relationship field demo', () => {
  const demo = buildHomepageDemo()
  const field = buildRelationshipField(demo.people, demo.charts, demo.pairs)

  it('contains every demo person and computed pair', () => {
    expect(field.nodes).toHaveLength(6)
    expect(field.edges).toHaveLength(15)
    expect(field.initialCenterId).toBe('maya')
  })

  it('provides every relationship layer without inventing gematria scores', () => {
    for (const edge of field.edges) {
      expect(Object.keys(edge.layers)).toEqual(FLAVOR_DESCENT)
      expect(edge.layers.astrology.score).toBeTypeOf('number')
      expect(edge.layers.dreamspell.score).toBeTypeOf('number')
      expect(edge.layers.tzolkin.score).toBeTypeOf('number')
      expect(edge.layers.humanDesign.score).toBeTypeOf('number')
      expect(edge.layers.gematria.score).toBeNull()
    }
  })

  it('surfaces distinct evidence from multiple systems for one pair', () => {
    const edge = field.edges.find(
      (candidate) =>
        (candidate.a === 'maya' && candidate.b === 'noam') ||
        (candidate.a === 'noam' && candidate.b === 'maya'),
    )

    expect(edge?.layers.astrology.tie?.type).toBe('double-whammy')
    expect(edge?.layers.dreamspell.tie?.type).toBe('analog')
    expect(edge?.layers.humanDesign.tie?.type).toBe('companionship')
    expect(edge?.layers.tzolkin.score).toBe(20)
    expect(edge?.layers.gematria.tie).toBeNull()
  })

  it('keeps Long Count visible as profile data', () => {
    for (const node of field.nodes) {
      expect(node.longCount).toMatch(/^\d+\.\d+\.\d+\.\d+\.\d+$/)
    }
  })
})
