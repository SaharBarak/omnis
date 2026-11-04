import { describe, expect, it } from 'vitest'
import { parseBirthInput } from './birth-input'
import { buildPersonAtlas } from './build'
import { buildCircle, INNER_RING, layoutCircle } from './circle'
import { loadPersonAtlas } from './load'
import type { AtlasPerson } from './pair'
import type { BirthInput } from './types'
import { buildHomepageDemo, DEMO_PEOPLE, type DemoPerson } from '@/lib/data/homepage-demo'

const TODAY = '2026-10-11'

const asBirth = (p: DemoPerson): BirthInput => ({
  date: p.birthDate,
  time: p.birthTime,
  place: { lat: p.lat, lng: p.lng, label: null },
  name: p.name,
  hebrewName: p.hebrewName,
})

const maya = DEMO_PEOPLE.find((p) => p.id === 'maya')!

describe('buildPersonAtlas', () => {
  const demo = buildHomepageDemo()

  it('reads Maya as kin 60 with her five-person oracle', () => {
    const atlas = buildPersonAtlas(asBirth(maya), TODAY)
    expect(atlas.maya.kin).toBe(60)
    expect(atlas.maya.title).toBe('Yellow Galactic Sun')
    expect(atlas.maya.oracle.guide.name).toBe('Seed')
    expect(atlas.maya.oracle.analog.name).toBe('Storm')
    expect(atlas.maya.oracle.antipode.name).toBe('Dog')
  })

  it('agrees with the homepage demo engine output for every demo person', () => {
    for (const person of DEMO_PEOPLE) {
      const atlas = buildPersonAtlas(asBirth(person), TODAY)
      const charts = demo.charts[person.id]
      expect(atlas.maya.kin).toBe(charts.kin)
      expect(atlas.body?.type).toBe(charts.bodygraph.typeDefinition.name)
      expect(atlas.body?.definedCenters).toEqual(charts.bodygraph.definedCenters)
      const sun = atlas.sky.bodies.find((b) => b.id === 'sun')
      const demoSun = charts.natal.planets.find((p) => p.planet.id === 'sun')
      expect(sun?.longitude).toBeCloseTo(demoSun!.position.longitude, 6)
    }
  })

  it("names the body's authority by its own word and its profile by its lines", () => {
    for (const person of DEMO_PEOPLE) {
      const body = buildPersonAtlas(asBirth(person), TODAY).body
      const graph = demo.charts[person.id].bodygraph
      expect(body?.profileLines).toBe(graph.profile.id)
      expect(body?.authorityWord).not.toMatch(/authority|\(|\)/i)
      expect(graph.authorityDefinition.name.toLowerCase()).toContain(body!.authorityWord.toLowerCase().split(' ')[0])
    }
  })

  it('draws an exact sky with an ascendant when time and place are known', () => {
    const atlas = buildPersonAtlas(asBirth(maya), TODAY)
    expect(atlas.sky.precision).toBe('exact')
    expect(atlas.sky.ascendant).not.toBeNull()
    expect(atlas.bodyNeeds).toBeNull()
  })

  it('claims no more than a date alone can support', () => {
    const atlas = buildPersonAtlas({ date: '1991-03-14', time: null, place: null, name: null, hebrewName: null }, TODAY)
    expect(atlas.sky.precision).toBe('day')
    expect(atlas.sky.ascendant).toBeNull()
    expect(atlas.body).toBeNull()
    expect(atlas.bodyNeeds).toBe('time-and-place')
    const moon = atlas.sky.bodies.find((b) => b.id === 'moon')
    expect(moon?.arc).not.toBeNull()
    expect(atlas.readout.find((r) => r.label === 'Rising')?.value).toBe('Add birth time and place')
    expect(atlas.readout.find((r) => r.label === 'Moon')?.value).toMatch(/ to /)
  })

  it('writes a readout with no placeholders, dashes or empty values', () => {
    const atlas = buildPersonAtlas(asBirth(maya), TODAY)
    for (const row of atlas.readout) {
      expect(row.value.trim()).not.toBe('')
      expect(row.value).not.toMatch(/undefined|NaN|null|—/)
    }
    expect(new Set(atlas.readout.map((r) => r.layer))).toEqual(new Set(['sky', 'maya', 'body', 'number']))
  })

  it('builds the same atlas lazily in the browser path', async () => {
    const input = asBirth(maya)
    expect(await loadPersonAtlas(input, TODAY)).toEqual(buildPersonAtlas(input, TODAY))
  })
})

describe('parseBirthInput', () => {
  it('accepts a date alone and normalises empty text to null', () => {
    const parsed = parseBirthInput({ date: '2012-12-21', name: '  ' })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data).toEqual({ date: '2012-12-21', time: null, place: null, name: null, hebrewName: null })
  })

  it('rejects impossible dates and times', () => {
    expect(parseBirthInput({ date: '2023-02-29' }).success).toBe(false)
    expect(parseBirthInput({ date: '2012-12-21', time: '24:10' }).success).toBe(false)
  })
})

describe('circle', () => {
  const people: AtlasPerson[] = DEMO_PEOPLE.map((p) => ({ id: p.id, name: p.name, input: asBirth(p) }))

  it('puts the person with the heaviest ties at the hub and keeps everyone on the ring', () => {
    const circle = buildCircle(people)
    expect(circle.pairs).toHaveLength(15)
    expect(circle.hub).toBe('maya')
    const [hub, ...rest] = circle.nodes
    expect(hub).toEqual({ id: 'maya', x: 0, y: 0 })
    for (const n of rest) {
      const r = Math.hypot(n.x, n.y)
      expect(r).toBeGreaterThanOrEqual(INNER_RING - 1e-9)
      expect(r).toBeLessThanOrEqual(1 + 1e-9)
    }
  })

  it('lays out deterministically', () => {
    const pairs = buildCircle(people).pairs
    const ids = people.map((p) => p.id)
    expect(layoutCircle(ids, pairs)).toEqual(layoutCircle([...ids].reverse(), pairs))
  })
})
