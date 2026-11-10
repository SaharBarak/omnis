import { describe, expect, it } from 'vitest'
import { pairEyebrow, pairTitle, tieReading } from './pair-card'
import { DARK, pairLighting, tieEndKeys } from './pair-inspect'
import { keySelector, pairLayout, pairMarkKey, placePairMarks, tieKey } from './pair-layout'
import { buildPairAtlas } from '@/lib/atlas/build'
import { demoPerson } from '@/lib/atlas/demo'
import { markTitle, relatedMarks } from '@/lib/atlas/marks'
import { tieView } from '@/lib/relations/tie-text'

const pair = buildPairAtlas(demoPerson('maya'), demoPerson('ari'), '2026-11-08')
const guide = pair.reading.ties.findIndex((t) => t.type === 'guide')
const sameColor = pair.reading.ties.findIndex((t) => t.type === 'same-color')
const ariSeal = { kind: 'seal', n: pair.b.maya.seal.n } as const

describe('pairLighting', () => {
  it('lights nothing while nothing is read', () => {
    expect(pairLighting(pair, null)).toBe(DARK)
  })

  it('lights a tie and the marks it ends on, which take their halos', () => {
    const lit = pairLighting(pair, { kind: 'tie', index: guide })
    const ends = tieEndKeys(pair, guide)
    expect(ends).toEqual([`a:seal:${pair.b.maya.seal.n}`, `b:seal:${pair.b.maya.seal.n}`])
    expect([...lit.states]).toEqual([[tieKey(guide), 'active'], ...ends.map((key) => [key, 'related'])])
    expect([...lit.halos]).toEqual(ends)
  })

  it('lights a mark, its relations in its own map, and every tie it ends with the other end', () => {
    const lit = pairLighting(pair, { kind: 'mark', side: 'b', mark: ariSeal })
    const own = `b:seal:${ariSeal.n}`
    expect(lit.states.get(own)).toBe('active')
    for (const related of relatedMarks(pair.b, ariSeal)) expect(lit.states.get(pairMarkKey('b', related))).toBe('related')
    for (const index of [guide, sameColor]) {
      expect(lit.states.get(tieKey(index))).toBe('related')
      for (const end of tieEndKeys(pair, index)) {
        expect(lit.states.has(end)).toBe(true)
        expect(lit.halos.has(end)).toBe(true)
      }
    }
    expect(lit.states.get(`a:seal:${pair.a.maya.seal.n}`)).toBe('related')
  })
})

describe('keySelector', () => {
  it('finds a tie by its key and a mark inside its own person', () => {
    expect(keySelector(tieKey(3))).toBe('[data-tie-key="tie:3"]')
    for (const m of placePairMarks(pair, pairLayout(pair, 'landscape'))) {
      if (m.ref.kind === 'tie') continue
      expect(keySelector(m.key)).toBe(`[data-person="${m.ref.side}"] [data-mark="${m.key.slice(2)}"]`)
    }
  })
})

describe('the tie card', () => {
  it('heads a tie with its system and no pin, names it, and gives its odds', () => {
    const tie = pair.reading.ties[guide]
    expect(pairTitle(pair, { kind: 'tie', index: guide })).toEqual({ label: tieView(tie).name, value: tieView(tie).odds })
    expect(pairEyebrow(pair, { kind: 'tie', index: guide })).toBe('Tie · Dreamspell')
  })

  it('heads a mark with its person and its layer', () => {
    expect(pairEyebrow(pair, { kind: 'mark', side: 'a', mark: { kind: 'planet', id: 'sun' } })).toMatch(/^Maya · /)
    expect(pairTitle(pair, { kind: 'mark', side: 'b', mark: ariSeal })).toEqual(markTitle(pair.b, ariSeal))
  })

  it('says who the tie is between, its tier, its weight, and each end in the person own words', () => {
    const reading = tieReading(pair, guide)
    const view = tieView(pair.reading.ties[guide])
    const facts = Object.fromEntries(reading.facts.map((f) => [f.label, f.value]))
    expect(reading.meaning).toBe(view.meaning)
    expect(facts.Between).toBe("Ari is Maya's guide")
    expect(facts.Rarity).toBe(view.tier)
    expect(facts.Weight).toBe(`${view.bits.toFixed(1)} bits`)
    const seat = markTitle(pair.a, ariSeal)!
    const own = markTitle(pair.b, ariSeal)!
    expect(facts.Maya).toBe(`${seat.label}, ${seat.value}`)
    expect(facts.Ari).toBe(`${own.label}, ${own.value}`)
  })

  it('leaves out an end that names no mark', () => {
    const bridge = pair.reading.ties.findIndex((t) => t.type === 'split-bridge')
    const labels = tieReading(pair, bridge).facts.map((f) => f.label)
    expect(labels).toEqual(['Between', 'Rarity', 'Weight'])
  })
})
