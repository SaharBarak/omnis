import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { C, polar, RING, SIZE } from './geometry'
import { hitMark, MARK_SIZE, placeMarks, reachFor, toDrawing, undo, type Linear, type PlacedMark } from './mark-geometry'
import { linearOf } from './mark-targets'
import { PersonAtlasDrawing } from './person-atlas'
import { buildPersonAtlas } from '@/lib/atlas/build'
import { demoPerson } from '@/lib/atlas/demo'

const TODAY = '2026-10-11'
const atlas = buildPersonAtlas(demoPerson('maya').input, TODAY)
const marks = placeMarks(atlas)
const byKey = (key: string): PlacedMark => marks.find((m) => m.key === key)!

/** Centres of the glyph images the drawing renders inside each mark group, by mark key. */
function drawnGlyphs(): ReadonlyMap<string, readonly [number, number]> {
  const html = renderToStaticMarkup(createElement(PersonAtlasDrawing, { atlas }))
  const out = new Map<string, readonly [number, number]>()
  for (const group of html.matchAll(/data-mark="([^"]+)"[^>]*>(.*?)<\/g>/g)) {
    const image = group[2].match(/<image[^>]*x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)"/)
    if (image) out.set(group[1], [Number(image[1]) + Number(image[3]) / 2, Number(image[2]) + Number(image[3]) / 2])
  }
  return out
}

describe('placeMarks', () => {
  it('places every glyph mark where the drawing draws it', () => {
    const drawn = drawnGlyphs()
    const glyphMarks = marks.filter((m) => drawn.has(m.key))
    expect(glyphMarks.length).toBeGreaterThanOrEqual(12 + 20)
    for (const m of glyphMarks) {
      const [x, y] = drawn.get(m.key)!
      expect(Math.abs(x - m.anchor[0]), m.key).toBeLessThan(0.02)
      expect(Math.abs(y - m.anchor[1]), m.key).toBeLessThan(0.02)
    }
  })

  it('lists one mark per key, sky then Kin then body', () => {
    expect(new Set(marks.map((m) => m.key)).size).toBe(marks.length)
    const layers = marks.map((m) => m.layer)
    expect(layers.lastIndexOf('sky')).toBeLessThan(layers.indexOf('maya'))
    expect(layers.lastIndexOf('maya')).toBeLessThan(layers.indexOf('body'))
  })

  it('reads each ring from the outside in and clockwise from twelve', () => {
    const kin = marks.filter((m) => m.layer === 'maya')
    expect(kin[0].key).toBe('tone')
    expect(kin[1].key).toBe(`seal:${atlas.maya.seal.n}`)
    const next = kin[2].anchor
    expect(next[0]).toBeGreaterThan(C)
  })

  it('draws no body marks without a bodygraph, and no rising without a birth time', () => {
    const dateOnly = placeMarks(buildPersonAtlas({ ...demoPerson('maya').input, time: null, place: null }, TODAY))
    expect(dateOnly.some((m) => m.layer === 'body')).toBe(false)
    expect(dateOnly.some((m) => m.key === 'rising')).toBe(false)
  })

  it('makes each defined channel a line mark anchored on its own path', () => {
    for (const c of atlas.body!.channels) {
      const mark = byKey(`channel:${c.id}`)
      expect(mark.path!.length).toBeGreaterThan(1)
      expect(hitMark([mark], { point: mark.anchor, reach: 1 })).toBe(mark)
    }
  })
})

describe('hitMark', () => {
  const sun = byKey('planet:sun')

  it('finds a mark from anywhere within its reach, and nothing beyond it', () => {
    const reach = 12
    expect(hitMark(marks, { point: sun.anchor, reach })?.key).toBe('planet:sun')
    const centreward = (d: number): [number, number] => {
      const len = Math.hypot(sun.anchor[0] - C, sun.anchor[1] - C)
      return [sun.anchor[0] - ((sun.anchor[0] - C) / len) * d, sun.anchor[1] - ((sun.anchor[1] - C) / len) * d]
    }
    expect(hitMark([sun], { point: centreward(reach - 0.5), reach })?.key).toBe('planet:sun')
    expect(hitMark([sun], { point: centreward(reach + 0.5), reach })).toBeNull()
  })

  it('reaches at least the mark itself when the least target is smaller', () => {
    const own = byKey(`seal:${atlas.maya.seal.n}`)
    const edge: [number, number] = [own.anchor[0] + MARK_SIZE.litSeal - 0.5, own.anchor[1]]
    expect(hitMark([own], { point: edge, reach: 1 })?.key).toBe(own.key)
  })

  it('lets a point mark win a tie with a line mark', () => {
    const line: PlacedMark = { ...sun, key: 'line', path: [[sun.anchor[0] - 10, sun.anchor[1]], [sun.anchor[0] + 10, sun.anchor[1]]] }
    expect(hitMark([line, sun], { point: sun.anchor, reach: 12 })?.key).toBe('planet:sun')
  })

  it('reads a turning ring where it shows', () => {
    const turn: Linear = [0, 1, -1, 0]
    const shown = undo([0, -1, 1, 0], sun.anchor)
    expect(hitMark([sun], { point: shown, reach: 4, turns: { sky: turn } })?.key).toBe('planet:sun')
    expect(hitMark([sun], { point: shown, reach: 4 })).toBeNull()
  })
})

describe('the pointer in drawing units', () => {
  it('maps the box onto the 640-unit view and undoes the zoom about the centre', () => {
    const box = { left: 100, top: 50, width: 320 }
    expect(toDrawing([100 + 160, 50 + 160], box, 1)).toEqual([C, C])
    expect(toDrawing([100, 50], box, 1)).toEqual([0, 0])
    const [x] = toDrawing([100, 50 + 160], box, 2)
    expect(x).toBeCloseTo(C / 2)
  })

  it('turns half the least target into drawing units at the current size', () => {
    expect(reachFor(SIZE, 1)).toBe(12)
    expect(reachFor(SIZE / 2, 1)).toBe(24)
    expect(reachFor(SIZE, 2)).toBe(6)
  })

  it('reads the linear part of a computed transform', () => {
    expect(linearOf('none')).toBeNull()
    expect(linearOf('matrix(1.36, 0, 0, 1.36, -10, -10)')).toEqual([1.36, 0, 0, 1.36])
    expect(linearOf('matrix3d(0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)')).toEqual([0, 1, -1, 0])
  })

  it('places the rising mark on the ascendant line', () => {
    expect(byKey('rising').path).toEqual([polar(RING.skyOuter, 180), polar(RING.mayaOuter, 180)])
  })
})
