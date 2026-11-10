import { describe, expect, it } from 'vitest'
import { getLongCountData, PLACE_DAYS } from '@pleiad/engine/calculations/long-count'
import { getCastleByKin } from '@pleiad/engine/data/castles'
import { getProfile, getTypeDefinition, LINE_THEMES } from '@pleiad/engine/data/human-design'
import { getWavespellByKin } from '@pleiad/engine/data/wavespells'
import { buildPersonAtlas } from './build'
import { demoPerson } from './demo'
import { DIGEST_SHAPE, DIGEST_TILES } from './digest-shape'
import { explain, explainReading } from './explain'
import { PLACE_NAMES, placeDays } from './long-count'
import { markKey } from './marks'
import { numberWords, readingKey, type ReadingRef } from './readings'
import { ORACLE_ROLES } from '@/lib/dreamspell-oracle'

const TODAY = '2026-10-11'
const maya = buildPersonAtlas(demoPerson('maya').input, TODAY)
const dateOnly = buildPersonAtlas({ ...demoPerson('maya').input, time: null, place: null, name: null }, TODAY)

describe('reading keys', () => {
  it('keeps a mark its own key and tells every other reference apart', () => {
    const refs: readonly ReadingRef[] = [
      { kind: 'tone' },
      { kind: 'seal', n: 3 },
      { kind: 'system', id: 'maya' },
      { kind: 'system', id: 'longcount' },
      { kind: 'kin' },
      { kind: 'seat', role: 'guide' },
      { kind: 'seat', role: 'destiny' },
      { kind: 'type' },
      { kind: 'profile' },
      { kind: 'authority' },
      { kind: 'number', role: 'lifePath' },
      { kind: 'number', role: 'birthday' },
      { kind: 'longcount' },
      { kind: 'place', unit: 0 },
      { kind: 'place', unit: 4 },
      { kind: 'placement', id: 'sun' },
      { kind: 'planet', id: 'sun' },
    ]
    expect(readingKey({ kind: 'seal', n: 3 })).toBe(markKey({ kind: 'seal', n: 3 }))
    expect(new Set(refs.map(readingKey)).size).toBe(refs.length)
  })
})

describe('number words', () => {
  it('splits a table entry at its dash, so no dash reaches the page', () => {
    expect(numberWords(7)).toEqual({ name: 'The seeker', reads: 'analysis, solitude, the inner world' })
    expect(numberWords(99)).toBeNull()
  })
})

describe('the digest shape', () => {
  it('has a shape for every tile, each fact labelled and weighted', () => {
    for (const tile of DIGEST_TILES) {
      const shape = DIGEST_SHAPE[tile]
      for (const f of [shape.lead, ...shape.supports]) {
        expect(f.label.length).toBeGreaterThan(0)
        expect(f.weight).toBeGreaterThan(0)
      }
    }
  })
})

describe('explainReading', () => {
  it('reads the kin through its wavespell and castle', () => {
    const kin = explainReading(maya, { kind: 'kin' })
    const wavespell = getWavespellByKin(maya.maya.kin)
    expect(kin.meaning).toBe(`${wavespell.purpose}.`)
    expect(kin.facts.map((f) => f.label)).toEqual(['Wavespell', 'Castle', 'Court'])
    expect(kin.facts[1].value).toContain(getCastleByKin(maya.maya.kin).name)
  })

  it('reads the type, the profile and the authority from the engine tables', () => {
    const body = maya.body!
    const type = explainReading(maya, { kind: 'type' })
    expect(type.facts.find((f) => f.label === 'Strategy')?.value).toBe(getTypeDefinition(body.typeId).strategy)
    const profile = explainReading(maya, { kind: 'profile' })
    const lines = getProfile(body.profileLines)!
    expect(profile.meaning).toBe(lines.theme)
    expect(profile.facts.map((f) => f.label)).toEqual([LINE_THEMES[lines.conscious].name, LINE_THEMES[lines.unconscious].name])
    expect(explainReading(maya, { kind: 'authority' }).facts.map((f) => f.label)).toEqual(['Decision'])
  })

  it('explains the system, not a guess, when the bodygraph is missing', () => {
    expect(explainReading(dateOnly, { kind: 'type' })).toEqual(explainReading(dateOnly, { kind: 'system', id: 'body' }))
    expect(explainReading(dateOnly, { kind: 'system', id: 'body' }).facts.map((f) => f.label)).toEqual(['Reads', 'Needs'])
  })

  it('reads a number by its role, and says what a missing one is reckoned from', () => {
    const life = explainReading(maya, { kind: 'number', role: 'lifePath' })
    expect(life.meaning).toBe(`${numberWords(maya.number.lifePath)!.reads!.replace(/^./, (c) => c.toUpperCase())}.`)
    const missing = explainReading(dateOnly, { kind: 'number', role: 'expression' })
    expect(missing).toEqual({ meaning: null, facts: [{ label: 'From', value: 'Full name, in Latin letters' }] })
  })

  it('counts the Long Count in the engine days', () => {
    const data = getLongCountData(maya.input.date)
    const lc = explainReading(maya, { kind: 'longcount' })
    expect(lc.facts[0].value).toBe(`${new Intl.NumberFormat('en-US').format(data.daysSinceCreation)} days`)
    expect(placeDays(4)).toBe(PLACE_DAYS.baktun)
    expect(placeDays(5)).toBe(PLACE_DAYS.baktun * 20)
    const baktun = explainReading(maya, { kind: 'place', unit: 4 })
    expect(baktun.meaning).toBe(`One ${PLACE_NAMES[4].toLowerCase()} holds 144,000 days.`)
    expect(explainReading(maya, { kind: 'place', unit: 0 }).meaning).toBe("One k'in holds 1 day.")
  })

  it('reads a placement through its sign, and both signs on a crossing day', () => {
    const sun = explainReading(maya, { kind: 'placement', id: 'sun' })
    expect(sun.facts.map((f) => f.label)).toEqual(['Element', 'Modality', 'Ruler'])
    expect(explainReading(maya, { kind: 'placement', id: 'pluto' }).facts.length).toBeGreaterThan(0)
  })

  it('reads the guide as the guide, even on the tones where the guide is the own seal', () => {
    const guideRole = ORACLE_ROLES.find((r) => r.id === 'guide')!
    const ownGuide = buildPersonAtlas({ ...demoPerson('maya').input, date: '1987-08-01' }, TODAY)
    expect([1, 6, 11]).toContain(ownGuide.maya.tone.n)
    expect(ownGuide.maya.oracle.guide.n).toBe(ownGuide.maya.seal.n)
    expect(explainReading(ownGuide, { kind: 'seat', role: 'guide' }).meaning).toBe(guideRole.description)
    expect(explainReading(maya, { kind: 'seat', role: 'guide' }).facts.map((f) => f.label)).toEqual(['Power', 'Action', 'Essence'])
  })

  it('reads a mark reference the way the drawing does', () => {
    const tone = explain(maya, { kind: 'tone' })!
    expect(explainReading(maya, { kind: 'tone' })).toEqual({ meaning: tone.meaning, facts: tone.facts })
  })
})
