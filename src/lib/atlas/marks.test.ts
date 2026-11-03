import { describe, expect, it } from 'vitest'
import { CHANNELS } from '@pleiad/engine/data/human-design-channels'
import { buildPersonAtlas } from './build'
import { demoPerson } from './demo'
import { loneGates, markKey, markTitle, relatedMarks, type AtlasMarkRef } from './marks'
import type { PersonAtlas } from './types'

const TODAY = '2026-10-11'
const maya = buildPersonAtlas(demoPerson('maya').input, TODAY)
const dateOnly = buildPersonAtlas({ ...demoPerson('maya').input, time: null, place: null }, TODAY)

const keys = (atlas: PersonAtlas, ref: AtlasMarkRef) => relatedMarks(atlas, ref).map(markKey).sort()

describe('markKey', () => {
  it('writes a stable key per mark', () => {
    expect(markKey({ kind: 'planet', id: 'sun' })).toBe('planet:sun')
    expect(markKey({ kind: 'seal', n: 12 })).toBe('seal:12')
    expect(markKey({ kind: 'channel', id: '64-47' })).toBe('channel:64-47')
    expect(markKey({ kind: 'rising' })).toBe('rising')
    expect(markKey({ kind: 'tone' })).toBe('tone')
  })
})

describe('markTitle', () => {
  it('names the seal with its colour and its seats', () => {
    expect(markTitle(maya, { kind: 'seal', n: maya.maya.seal.n })).toEqual({ label: 'Yellow Sun', value: 'Your seal' })
  })

  it('has no title for marks this atlas does not draw', () => {
    expect(markTitle(dateOnly, { kind: 'rising' })).toBeNull()
    expect(markTitle(dateOnly, { kind: 'centre', id: 'g' })).toBeNull()
    expect(markTitle(maya, { kind: 'seal', n: 0 })).toBeNull()
    expect(markTitle(maya, { kind: 'channel', id: 'no-such' })).toBeNull()
  })
})

describe('relatedMarks', () => {
  it('lights a planet with its sign, and a sign with its planets', () => {
    const sun = maya.sky.bodies.find((b) => b.id === 'sun')!
    const sign = { kind: 'sign', id: sun.sign.name.toLowerCase() } as AtlasMarkRef
    expect(keys(maya, { kind: 'planet', id: 'sun' })).toEqual([markKey(sign)])
    expect(keys(maya, sign)).toContain('planet:sun')
  })

  it('lights the person seal with its four seats and the tone, and a seat with the person seal', () => {
    const own = maya.maya.seal.n
    const seats = Object.values(maya.maya.oracle).map((s) => `seal:${s.n}`)
    expect(keys(maya, { kind: 'seal', n: own })).toEqual([...new Set([...seats, 'tone'])].filter((k) => k !== `seal:${own}`).sort())
    expect(keys(maya, { kind: 'seal', n: maya.maya.oracle.analog.n })).toEqual([`seal:${own}`])
    expect(keys(maya, { kind: 'tone' })).toEqual([`seal:${own}`])
  })

  it('joins the relations of every seat a seal holds', () => {
    const own = maya.maya.seal
    const guide = maya.maya.oracle.guide
    const both: PersonAtlas = { ...maya, maya: { ...maya.maya, oracle: { ...maya.maya.oracle, guide: own } } }
    expect(keys(both, { kind: 'seal', n: own.n })).not.toContain(`seal:${own.n}`)
    expect(keys(maya, { kind: 'seal', n: guide.n })).toContain(`seal:${own.n}`)
  })

  it('lights a centre with its defined channels and the centres they reach, never a gate inside a channel', () => {
    const channel = maya.body!.channels[0]
    const [a, b] = CHANNELS.find((c) => c.id === channel.id)!.centers
    const lit = keys(maya, { kind: 'centre', id: a })
    expect(lit).toContain(`channel:${channel.id}`)
    expect(lit).toContain(`centre:${b}`)
    expect(lit.some((k) => k.startsWith('gate:'))).toBe(false)
    expect(keys(maya, { kind: 'channel', id: channel.id })).toEqual([`centre:${a}`, `centre:${b}`].sort())
  })

  it('lights a lone gate with its centre', () => {
    const gate = loneGates(maya.body!)[0]
    expect(keys(maya, { kind: 'gate', n: gate })).toHaveLength(1)
    expect(keys(maya, { kind: 'gate', n: gate })[0]).toMatch(/^centre:/)
  })
})

describe('the readout states every mark', () => {
  it('lists every body, the centres, channels and lone gates', () => {
    const labels = maya.readout.map((r) => r.label)
    for (const b of maya.sky.bodies) expect(labels).toContain(b.name)
    expect(labels).toEqual(expect.arrayContaining(['Defined centres', 'Open centres', 'Channels', 'Gates']))
    const channels = maya.readout.find((r) => r.label === 'Channels')!.value
    for (const c of maya.body!.channels) expect(channels).toContain(`${c.name} (${c.gates[0]}–${c.gates[1]})`)
  })
})
