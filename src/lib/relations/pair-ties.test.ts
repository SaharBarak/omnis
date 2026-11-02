import { describe, expect, it } from 'vitest'
import { calculateFiveSystemCompatibility } from '@pleiad/engine/services/compatibility'
import { baseRateOf, surprisal } from '@pleiad/engine/services/rarity'
import { tieOdds } from './odds'
import { pairTies, readPair } from './pair-ties'
import { buildHomepageDemo, DEMO_PEOPLE, type DemoPerson } from '@/lib/data/homepage-demo'

const asInput = (p: DemoPerson) => ({
  birthDate: p.birthDate,
  birthTime: p.birthTime,
  birthPlace: { lat: p.lat, lng: p.lng },
  hebrewName: p.hebrewName,
  name: p.name,
})

const person = (id: string): DemoPerson => {
  const found = DEMO_PEOPLE.find((p) => p.id === id)
  if (!found) throw new Error(`missing demo person ${id}`)
  return found
}

const fingerprint = (ties: readonly { system: string; type: string; from: string; to: string; bits: number }[]) =>
  ties.map((t) => `${t.system}:${t.type}:${t.from}>${t.to}:${t.bits.toFixed(3)}`).sort()

describe('pairTies', () => {
  const demo = buildHomepageDemo()

  it('reproduces the homepage demo ties for all fifteen pairs', () => {
    expect(demo.pairs).toHaveLength(15)
    for (const pair of demo.pairs) {
      const a = person(pair.a)
      const b = person(pair.b)
      const result = calculateFiveSystemCompatibility(asInput(a), asInput(b))
      expect(fingerprint(pairTies(result, a, b))).toEqual(fingerprint(pair.ties))
    }
  })

  it('finds the exact Dreamspell guide between Maya and Ari at 8 bits', () => {
    const maya = person('maya')
    const ari = person('ari')
    const ties = pairTies(calculateFiveSystemCompatibility(asInput(maya), asInput(ari)), maya, ari)
    const guide = ties.find((t) => t.system === 'dreamspell' && t.type === 'guide')
    expect(guide?.bits).toBeCloseTo(surprisal('guide'), 6)
    expect(guide?.bits).toBeGreaterThan(7.9)
  })

  it('orders ties rarest first and stamps every tie with a base rate', () => {
    const maya = person('maya')
    const noam = person('noam')
    const ties = pairTies(calculateFiveSystemCompatibility(asInput(maya), asInput(noam)), maya, noam)
    expect(ties.length).toBeGreaterThan(0)
    ties.forEach((t, i) => {
      expect(t.baseRate).toBeGreaterThan(0)
      expect(t.baseRate).toBeLessThanOrEqual(1)
      if (i > 0) expect(ties[i - 1].bits).toBeGreaterThanOrEqual(t.bits)
    })
  })

  it('summarises a pair with the demo rarity and bits', () => {
    for (const pair of demo.pairs) {
      const a = person(pair.a)
      const b = person(pair.b)
      const reading = readPair(calculateFiveSystemCompatibility(asInput(a), asInput(b)), a, b)
      expect(reading.rarity).toBe(pair.rarity)
      expect(reading.bits).toBeCloseTo(pair.bits, 1)
    }
  })
})

describe('centerName', () => {
  it('names every engine centre id, including the Solar Plexus', async () => {
    const { centerName } = await import('./pair-ties')
    const { CENTER_POSITIONS } = await import('@/components/human-design/bodygraph-layout')
    for (const id of Object.keys(CENTER_POSITIONS)) expect(centerName(id)).not.toBe(id)
    expect(centerName('solar')).toBe('Solar Plexus')
  })
})

describe('tie direction and tier', () => {
  it('reads the guide as acting on the one it guides', () => {
    const maya = DEMO_PEOPLE.find((p) => p.id === 'maya')!
    const ari = DEMO_PEOPLE.find((p) => p.id === 'ari')!
    const toInput = (p: typeof maya) => ({ birthDate: p.birthDate, birthTime: p.birthTime, birthPlace: { lat: p.lat, lng: p.lng }, hebrewName: p.hebrewName, name: p.name })
    const ties = pairTies(calculateFiveSystemCompatibility(toInput(maya), toInput(ari)), maya, ari)
    const guide = ties.find((t) => t.type === 'guide')
    expect(guide?.acts).toEqual({ by: 'ari', on: 'maya' })
    expect(guide?.tier).toBe('T3')
    const em = ties.find((t) => t.type === 'electromagnetic')
    if (em) expect(em.tier).toBe('T0')
  })
})

describe('electromagnetic copy', () => {
  it('counts channels in the right number and quotes the measured rate', () => {
    const ems = demoEms()
    expect(ems.length).toBeGreaterThan(0)
    for (const em of ems) {
      expect(em.meaning).toMatch(em.score === 1 ? /^1 channel completed/ : /^\d+ channels completed/)
      expect(em.meaning).toContain(tieOdds(baseRateOf('electromagnetic')))
    }
  })
})

function demoEms() {
  return DEMO_PEOPLE.flatMap((a, i) =>
    DEMO_PEOPLE.slice(i + 1).flatMap((b) =>
      pairTies(calculateFiveSystemCompatibility(asInput(a), asInput(b)), a, b).filter((t) => t.type === 'electromagnetic'),
    ),
  )
}
