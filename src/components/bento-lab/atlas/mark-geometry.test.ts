import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BODY_SCALE, bodyPoint, C, concentricPath, percent, polar, RING, SIZE } from './geometry'
import { focusRingOf, HALO_GAP, haloOf, hitMark, inView, MARK_SIZE, placeMarks, reachFor, toDrawing, undo, type Linear, type PlacedMark } from './mark-geometry'
import { linearOf } from './mark-targets'
import { BodygraphFigure, PersonAtlasDrawing } from './person-atlas'
import { CENTER_POSITIONS, CHANNEL_PATHS, GATE_HALVES, GATE_MOUTHS, midpointOf } from '@/components/human-design/bodygraph-layout'
import { buildPersonAtlas } from '@/lib/atlas/build'
import { demoPerson } from '@/lib/atlas/demo'
import { loneGates } from '@/lib/atlas/marks'

const TODAY = '2026-10-11'
const atlas = buildPersonAtlas(demoPerson('maya').input, TODAY)
const marks = placeMarks(atlas)
const byKey = (key: string): PlacedMark => marks.find((m) => m.key === key)!

const markGroups = (): readonly RegExpMatchArray[] => [
  ...renderToStaticMarkup(createElement(PersonAtlasDrawing, { atlas })).matchAll(/data-mark="([^"]+)"[^>]*>(.*?)<\/g>/g),
]

/** Centres of the glyph images the drawing renders inside each mark group, by mark key. */
function drawnGlyphs(): ReadonlyMap<string, readonly [number, number]> {
  const out = new Map<string, readonly [number, number]>()
  for (const group of markGroups()) {
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

  it('reaches each ringed or disced seal by the radius the drawing draws', () => {
    const ringed = markGroups().flatMap((group) => {
      const circle = group[2].match(/<circle[^>]*r="([\d.]+)"/)
      return circle && group[1].startsWith('seal:') ? [[group[1], Number(circle[1])] as const] : []
    })
    expect(ringed.length).toBeGreaterThanOrEqual(1 + 4 - 1)
    for (const [key, r] of ringed) expect(byKey(key).r, key).toBe(r)
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
      expect(mark.lines).toHaveLength(1)
      expect(mark.lines![0].length).toBeGreaterThan(1)
      expect(hitMark([mark], { point: mark.anchor, reach: 1 })).toBe(mark)
    }
  })

  it('makes each lone gate a line mark: its channel halves from its mouth, anchored on the first', () => {
    const gates = loneGates(atlas.body!)
    expect(gates.length).toBeGreaterThan(0)
    for (const g of gates) {
      const mark = byKey(`gate:${g}`)
      expect(mark.lines).toHaveLength(GATE_HALVES[g].length)
      for (const line of mark.lines!) expect(line[0]).toEqual(bodyPoint(...GATE_MOUTHS[g]))
      expect(mark.anchor).toEqual(bodyPoint(...midpointOf(GATE_HALVES[g][0].shown)))
      expect(hitMark(marks, { point: mark.anchor, reach: 1 })).toBe(mark)
      const drawn = markGroups().find((group) => group[1] === mark.key)
      expect(drawn?.[2].match(/<path/g)).toHaveLength(GATE_HALVES[g].length)
    }
  })

  it('answers on every gate\'s own anchor, never on the centre its mouth leaves', () => {
    const everyGate = { ...atlas, body: { ...atlas.body!, channels: [], gates: Array.from({ length: 64 }, (_, i) => i + 1) } }
    const all = placeMarks(everyGate)
    for (const mark of all.filter((m) => m.ref.kind === 'gate')) expect(hitMark(all, { point: mark.anchor, reach: 1 })?.key).toBe(mark.key)
  })

  it('takes a pointer inside a centre\'s outline for the centre, and none beside it within its circle', () => {
    const ajna = byKey('centre:ajna')
    expect(hitMark(marks, { point: ajna.anchor, reach: 1 })?.key).toBe('centre:ajna')
    const pos = CENTER_POSITIONS.ajna
    const besideApex = bodyPoint(pos.x + pos.size * 0.7, pos.y + pos.size * 0.5)
    expect(hitMark([ajna], { point: besideApex, reach: 1 })).toBeNull()
  })

  it('lights a defined channel\'s gates on their other channels, without making them marks', () => {
    const charisma = { ...atlas.body!, channels: [{ id: '34-20', name: 'Charisma', gates: [34, 20] as const }], gates: [34, 20] }
    const figure = renderToStaticMarkup(createElement(BodygraphFigure, { body: charisma }))
    const halves = [34, 20].flatMap((g) => GATE_HALVES[g].filter((h) => h.channel !== '34-20'))
    expect(halves).toHaveLength(4)
    expect(figure.match(/<path/g)).toHaveLength(Object.keys(CHANNEL_PATHS).length + halves.length + Object.keys(CENTER_POSITIONS).length)
    expect(placeMarks({ ...atlas, body: charisma }).some((m) => m.ref.kind === 'gate')).toBe(false)
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
    const line: PlacedMark = { ...sun, key: 'line', lines: [[[sun.anchor[0] - 10, sun.anchor[1]], [sun.anchor[0] + 10, sun.anchor[1]]]] }
    expect(hitMark([line, sun], { point: sun.anchor, reach: 12 })?.key).toBe('planet:sun')
  })

  it('lets a glyph under the pointer win over a line passing closer to it', () => {
    const line: PlacedMark = { ...sun, key: 'line', lines: [[[sun.anchor[0] - 20, sun.anchor[1] + 1], [sun.anchor[0] + 20, sun.anchor[1] + 1]]] }
    const alongTheLine: [number, number] = [sun.anchor[0] + sun.r * 0.6, sun.anchor[1] + 1]
    expect(hitMark([line, sun], { point: alongTheLine, reach: 12 })?.key).toBe('planet:sun')
    const beyondTheGlyph: [number, number] = [sun.anchor[0] + sun.r + 4, sun.anchor[1] + 1]
    expect(hitMark([line, sun], { point: beyondTheGlyph, reach: 12 })?.key).toBe('line')
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

  it('keeps a mark in view only while the zoom leaves it inside the square', () => {
    const sun = byKey('planet:sun')
    const edge: PlacedMark = { ...sun, anchor: [C + (SIZE / 2) * 0.9, C] }
    expect(inView(edge, 1)).toBe(true)
    expect(inView(edge, 1.36)).toBe(false)
    expect(inView({ ...sun, anchor: [C, C] }, 1.36)).toBe(true)
  })

  it('places the rising mark on the ascendant line', () => {
    expect(byKey('rising').lines).toEqual([[polar(RING.skyOuter, 180), polar(RING.mayaOuter, 180)]])
  })
})

describe('haloOf', () => {
  const centres = marks.filter((m) => m.ref.kind === 'centre')
  const drawing = renderToStaticMarkup(createElement(PersonAtlasDrawing, { atlas }))
  const stroke = Number(drawing.match(/<path d="[^"]*Z" class="[^"]*center[^"]*" stroke-width="([\d.]+)" stroke-linejoin="round"/)![1])

  it('rings a point mark with a circle, and leaves a line mark to light its stroke', () => {
    const sign = marks.find((m) => m.ref.kind === 'sign')!
    expect(haloOf(sign)).toEqual({ circle: sign.r + HALO_GAP })
    expect(haloOf(byKey('rising'))).toBeNull()
  })

  it('stands a centre\'s halo the gap off the edge it paints: its outline grown by half the stroke drawn, at round joins', () => {
    expect(stroke).toBe(MARK_SIZE.centreStroke)
    for (const centre of centres) {
      expect(centre.area!.paint).toBeCloseTo((stroke / 2) * BODY_SCALE, 2)
      expect(haloOf(centre)).toEqual({ path: concentricPath(centre.area!.outline, centre.area!.paint + HALO_GAP) })
    }
  })

  it('gives every centre a focus ring a surface gap off its halo, and no point or line mark one', () => {
    for (const centre of centres) expect(focusRingOf(centre)).toBe(concentricPath(centre.area!.outline, centre.area!.paint + 2 * HALO_GAP))
    expect(marks.filter((m) => !m.area).every((m) => focusRingOf(m) === null)).toBe(true)
  })

  it('sets the card off a centre at its halo: the radius is how far its paint reaches across', () => {
    for (const centre of centres) {
      const across = Math.max(...centre.area!.outline.map(([x]) => Math.abs(x - centre.anchor[0])))
      expect(centre.r).toBeCloseTo(across + centre.area!.paint, 2)
    }
  })

  it('draws the active centre\'s halo along its outline, not round its anchor', () => {
    const heart = byKey('centre:heart')
    const markup = renderToStaticMarkup(createElement(PersonAtlasDrawing, { atlas, highlight: { active: heart, related: new Set<string>() } }))
    expect(markup).toContain(`d="${(haloOf(heart) as { path: string }).path}"`)
    expect(markup).not.toContain(`r="${heart.r + HALO_GAP}"`)
  })
})

describe('a view that is not the square', () => {
  const view = { width: 1420, height: 900 }
  const at = (x: number, y: number): PlacedMark => ({ ...byKey('planet:sun'), anchor: [x, y] })

  it('maps the box onto the view and undoes the zoom about the view\'s centre', () => {
    const box = { left: 10, top: 20, width: 710 }
    expect(toDrawing([10 + 355, 20 + 225], box, 1, view)).toEqual([710, 450])
    expect(toDrawing([10 + 355, 20 + 225], box, 2, view)).toEqual([710, 450])
    expect(toDrawing([10, 20], box, 2, view)).toEqual([355, 225])
  })

  it('reaches half the least target across the view\'s width', () => {
    expect(reachFor(710, 1, view)).toBe(24)
  })

  it('keeps a mark in view by both of the view\'s sides, not the square\'s', () => {
    expect(inView(at(1400, 880), 1, view)).toBe(true)
    expect(inView(at(1400, 880), 1)).toBe(false)
    expect(inView(at(1400, 450), 1.2, view)).toBe(false)
  })

  it('places HTML over it by its own sides', () => {
    expect(percent([710, 450], view)).toEqual({ left: '50.000%', top: '50.000%' })
  })
})

