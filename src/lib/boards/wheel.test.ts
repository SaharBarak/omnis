import { describe, expect, it } from 'vitest'
import type { CalendarCell, CalendarView } from './types'
import { HUB_MIN, bearing, pointAt, sectorPath, wheelGeometry } from './wheel'

/**
 * The wheel's geometry (BENTO_BOARDS.md "Figures", Wheel) against what a
 * compass and a ruler give: shares of a turn, radii from circumferences,
 * bearings by clock position.
 */

const cell = (key: string, more: Partial<CalendarCell> = {}): CalendarCell => ({ key, mark: { kind: 'bars', n: 1 }, state: 'ahead', said: key, ...more })
const ring = (n: number, more: (i: number) => Partial<CalendarCell> = () => ({})) => Array.from({ length: n }, (_, i) => cell(`c${i}`, more(i)))
const view = (sections: CalendarView['sections'], wheel?: CalendarView['wheel']): CalendarView => ({ id: 'w', layout: 'wheel', name: 'W', tab: 'W', legend: [], caption: '', sections, ...(wheel ? { wheel } : {}) })

describe('wheelGeometry', () => {
  it('gives each cell its share of the turn, equal where none says, by its span where they do, from the ring\'s offset', () => {
    const g = wheelGeometry(view([{ columns: 4, cells: ring(4) }, { columns: 3, from: 90, cells: ring(3, (i) => ({ span: [1, 2, 1][i] })) }]))
    expect(g.rings[0]?.sectors.map((s) => [s.start, s.end])).toEqual([[0, 0.25], [0.25, 0.5], [0.5, 0.75], [0.75, 1]])
    expect(g.rings[1]?.sectors.map((s) => [s.start, s.end])).toEqual([[0.25, 0.5], [0.5, 1], [1, 1.25]])
  })

  it('sets a ring no nearer the hub than the circumference its cells need, and each ring outside the last', () => {
    const sixty = wheelGeometry(view([{ columns: 60, cells: ring(60) }]))
    expect(sixty.hub).toBeCloseTo(60 / (2 * Math.PI))
    const two = wheelGeometry(view([{ columns: 12, cells: ring(12) }, { columns: 60, cells: ring(60) }]))
    expect(two.rings[1]?.inner).toBeCloseTo(60 / (2 * Math.PI))
    expect(two.rings[1]?.inner).toBe(two.rings[0]?.outer)
    expect(two.radius).toBeCloseTo((two.rings[1]?.inner ?? 0) + 1)
  })

  it('keeps a hub that holds its readout, however few the cells', () => {
    expect(wheelGeometry(view([{ columns: 4, cells: ring(4) }])).hub).toBe(HUB_MIN)
  })

  it('says which sectors hold their faces: a narrow span among wide ones does not', () => {
    const g = wheelGeometry(view([{ columns: 5, cells: ring(5, (i) => ({ span: i === 0 ? 1 : 100 })) }]))
    expect(g.rings[0]?.sectors.map((s) => s.fits)).toEqual([false, true, true, true, true])
  })

  it('turns the hand to a fraction of the turn, whatever its degrees', () => {
    const at = (hand: number) => wheelGeometry(view([{ columns: 4, cells: ring(4) }], { origin: 'top', turn: 'clockwise', hand })).hand
    expect([at(90), at(450), at(-90)]).toEqual([0.25, 0.25, 0.75])
    expect(wheelGeometry(view([{ columns: 4, cells: ring(4) }])).hand).toBeNull()
  })
})

describe('bearing', () => {
  const at = (turn: CalendarView['wheel'], fraction: number) => pointAt(1, bearing(turn, fraction)).map((n) => Math.round(n) + 0)

  it('runs clockwise from the top where a wheel says nothing', () => {
    expect([at(undefined, 0), at(undefined, 0.25), at(undefined, 0.5)]).toEqual([[0, -1], [1, 0], [0, 1]])
  })

  it('turns the zodiac from nine o\'clock, counter-clockwise: Cancer at the foot, Libra at three', () => {
    const zodiac = { origin: 'left', turn: 'counterclockwise' } as const
    expect([at(zodiac, 0), at(zodiac, 0.25), at(zodiac, 0.5)]).toEqual([[-1, 0], [0, 1], [1, 0]])
  })

  it('draws a sector as a closed annular wedge', () => {
    const d = sectorPath(undefined, { inner: 1, outer: 2 }, { start: 0, end: 0.25 })
    expect(d).toBe('M0.000 -2.000A2.000 2.000 0 0 1 2.000 0.000L1.000 0.000A1.000 1.000 0 0 0 0.000 -1.000Z')
  })
})
