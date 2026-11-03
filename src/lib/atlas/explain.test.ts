import { describe, expect, it } from 'vitest'
import { CENTERS } from '@pleiad/engine/data/human-design'
import { buildPersonAtlas } from './build'
import { demoPerson } from './demo'
import { explain } from './explain'
import { loneGates } from './marks'
import type { PersonAtlas } from './types'
import { oracleRole } from '@/lib/dreamspell-oracle'
import { getSealMeaning, getToneMeaning } from '@/lib/dreamspell-meanings'

const TODAY = '2026-10-11'
const maya = buildPersonAtlas(demoPerson('maya').input, TODAY)
const dateOnly = buildPersonAtlas({ ...demoPerson('maya').input, time: null, place: null }, TODAY)

const readout = (atlas: PersonAtlas, label: string) => atlas.readout.find((r) => r.label === label)?.value

describe('explain: sky', () => {
  it('states a planet in the readout wording, with its keywords', () => {
    const sun = explain(maya, { kind: 'planet', id: 'sun' })
    expect(sun).toMatchObject({ layer: 'sky', label: 'Sun', value: readout(maya, 'Sun'), facts: [{ label: 'Kind', value: 'Luminary' }] })
    expect(sun?.meaning).toBe('Identity, vitality, ego.')
  })

  it('names the planets a sign holds, and its element, modality and ruler', () => {
    const sunSign = maya.sky.bodies.find((b) => b.id === 'sun')!.sign
    const id = sunSign.name.toLowerCase() as 'aries'
    const sign = explain(maya, { kind: 'sign', id })
    expect(sign?.label).toBe(sunSign.name)
    expect(sign?.value).toContain('Sun')
    expect(sign?.facts.map((f) => f.label)).toEqual(['Element', 'Modality', 'Ruler'])
  })

  it('says a sign with no planets is empty', () => {
    const held = new Set(maya.sky.bodies.map((b) => b.sign.n))
    const empty = (['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'] as const).find(
      (_, i) => !held.has(i + 1),
    )
    expect(empty).toBeDefined()
    expect(explain(maya, { kind: 'sign', id: empty! })?.value).toBe('No planets')
  })

  it('reads the rising sign through the first house, and has none without a birth time', () => {
    const rising = explain(maya, { kind: 'rising' })
    expect(rising).toMatchObject({ label: 'Rising', value: readout(maya, 'Rising'), facts: [{ label: 'House', value: 'First House' }] })
    expect(rising?.meaning).toBe('Self. Identity, appearance, beginnings.')
    expect(explain(dateOnly, { kind: 'rising' })).toBeNull()
  })

  it('states a date-only body by its day arc, as the readout does', () => {
    expect(explain(dateOnly, { kind: 'planet', id: 'moon' })?.value).toBe(readout(dateOnly, 'Moon'))
  })
})

describe('explain: kin', () => {
  it('names the person seal by its oracle seat, with its power, action and essence', () => {
    const own = explain(maya, { kind: 'seal', n: maya.maya.seal.n })
    const meaning = getSealMeaning(maya.maya.seal.n)
    expect(own).toMatchObject({ layer: 'maya', label: meaning.name, value: 'Your seal', meaning: oracleRole('destiny').description })
    expect(own?.facts).toEqual([
      { label: 'Power', value: meaning.power },
      { label: 'Action', value: meaning.action },
      { label: 'Essence', value: meaning.essence },
    ])
  })

  it('names each oracle seat', () => {
    for (const seat of ['guide', 'analog', 'antipode', 'occult'] as const) {
      const card = explain(maya, { kind: 'seal', n: maya.maya.oracle[seat].n })
      expect(card?.value).toBe(oracleRole(seat).label)
      expect(card?.meaning).toBe(oracleRole(seat).description)
    }
  })

  it('gives every seat a seal holds, when it holds more than one', () => {
    const own = maya.maya.seal
    const selfGuided: PersonAtlas = { ...maya, maya: { ...maya.maya, oracle: { ...maya.maya.oracle, guide: own } } }
    expect(explain(selfGuided, { kind: 'seal', n: own.n })?.value).toBe('Your seal and Guide')
  })

  it('numbers a seal outside the oracle and adds no role', () => {
    const seats = new Set([maya.maya.seal.n, ...Object.values(maya.maya.oracle).map((s) => s.n)])
    const outside = Array.from({ length: 20 }, (_, i) => i + 1).find((n) => !seats.has(n))!
    expect(explain(maya, { kind: 'seal', n: outside })).toMatchObject({ value: `Seal ${outside}`, meaning: null })
    expect(explain(maya, { kind: 'seal', n: 21 })).toBeNull()
  })

  it('states the tone with its action, power and phase', () => {
    const tone = getToneMeaning(maya.maya.tone.n)
    expect(explain(maya, { kind: 'tone' })).toMatchObject({
      label: 'Tone',
      value: `${tone.name} ${maya.maya.tone.n}`,
      facts: [
        { label: 'Action', value: tone.action },
        { label: 'Power', value: tone.power },
        { label: 'Phase', value: tone.phase },
      ],
    })
  })
})

describe('explain: body', () => {
  const body = maya.body!

  it('says whether a centre is defined, and gives an open one its not-self theme', () => {
    for (const centre of CENTERS) {
      const card = explain(maya, { kind: 'centre', id: centre.id })
      const defined = body.definedCenters.includes(centre.id)
      expect(card).toMatchObject({ layer: 'body', label: centre.name, value: defined ? 'Defined' : 'Open', meaning: centre.function })
      expect(card?.facts).toEqual(defined ? [] : [{ label: 'Not-self', value: centre.notSelfTheme }])
    }
  })

  it('explains every defined channel by its gates and the centres it joins', () => {
    expect(body.channels.length).toBeGreaterThan(0)
    for (const channel of body.channels) {
      const card = explain(maya, { kind: 'channel', id: channel.id })
      expect(card?.label).toBe(channel.name)
      expect(card?.value).toBe(`${channel.gates[0]}–${channel.gates[1]}`)
      expect(card?.facts.map((f) => f.label)).toEqual(['Joins', 'Circuit'])
    }
  })

  it('explains a gate drawn on its own, and has nothing for a gate inside a channel or an inactive one', () => {
    const lone = loneGates(body)
    expect(lone.length).toBeGreaterThan(0)
    const card = explain(maya, { kind: 'gate', n: lone[0] })
    expect(card).toMatchObject({ label: `Gate ${lone[0]}`, facts: [] })
    expect(card?.value).toMatch(/Center$/)
    expect(card?.meaning).toMatch(/\.$/)
    expect(explain(maya, { kind: 'gate', n: body.channels[0].gates[0] })).toBeNull()
    const inactive = Array.from({ length: 64 }, (_, i) => i + 1).find((g) => !body.gates.includes(g))!
    expect(explain(maya, { kind: 'gate', n: inactive })).toBeNull()
  })

  it('has no body cards without a bodygraph', () => {
    expect(explain(dateOnly, { kind: 'centre', id: 'g' })).toBeNull()
    expect(explain(dateOnly, { kind: 'gate', n: 1 })).toBeNull()
  })
})
