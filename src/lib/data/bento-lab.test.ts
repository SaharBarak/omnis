import { describe, expect, it } from 'vitest'
import { BASE_RATE } from '@pleiad/engine/services/rarity'
import { buildBentoLab } from './bento-lab'
import { PLANS } from '@/lib/services/billing'
import { SYSTEM_CATALOG } from '@/lib/system-preferences'

const VALIDATION_DAY = new Date('2012-12-21T12:00:00Z')

describe('buildBentoLab', () => {
  const lab = buildBentoLab(VALIDATION_DAY)

  it('reads today from the engine (Dec 21 2012 = Kin 207, Crystal Hand)', () => {
    expect(lab.today.kin).toBe(207)
    expect(lab.today.toneName).toBe('Crystal')
    expect(lab.today.seal.name).toBe('Hand')
    expect(lab.today.seal.src).toBe('/images/dreamspell/seals/07-hand.svg')
  })

  it('derives every tie from a measured base rate', () => {
    for (const tie of lab.ties) {
      const rate = BASE_RATE[tie.type]
      expect(rate).toBeDefined()
      expect(tie.bits).toBeCloseTo(-Math.log2(rate), 0)
    }
  })

  it('leads with the guide tie at roughly 8 bits', () => {
    expect(lab.guideOdds.type).toBe('guide')
    expect(lab.guideOdds.percent).toBe('0.38%')
    expect(lab.guideOdds.bits).toBe(8)
  })

  it('prices plans from the plan table', () => {
    expect(lab.plans.map((p) => p.name)).toEqual([PLANS.free.name, PLANS.explorer.name, PLANS.complete.name])
    expect(lab.plans[0].price).toBe('$0')
    expect(lab.plans[1].price).toBe(`$${PLANS.explorer.price} / mo`)
  })

  it('counts reading systems from the engine catalog', () => {
    const readings = SYSTEM_CATALOG.filter((s) => s.group === 'readings')
    expect(lab.readingSystems.count).toBe(readings.length)
    expect(lab.readingSystems.lead).toContain(readings[0]?.label ?? '')
    expect(lab.readingSystems.lead).toContain(`${readings.length - 3} more`)
  })

  it('takes the counterweight from the most common measured tie', () => {
    expect(lab.commonest.share).toBe(Math.max(...lab.ties.map((t) => t.share)))
    expect(lab.commonest.bits).toBeLessThan(lab.guideOdds.bits)
  })

  it('fills all four oracle seats with real seals', () => {
    expect(lab.oracle.map((s) => s.role)).toEqual(['guide', 'analog', 'occult', 'antipode'])
    for (const seat of lab.oracle) expect(seat.seal.src).toMatch(/^\/images\/dreamspell\/seals\/\d{2}-[a-z]+\.svg$/)
  })
})
