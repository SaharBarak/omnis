import { describe, expect, it } from 'vitest'
import { LANTERN, MARK_PARTS, lanternShape } from './mark'
import { PIXEL_LANTERN } from './pixel-lantern.gen'
import { LIT_COVER, cellOf, rasterLantern } from './pixel-mark'

const at = (col: number, row: number) => PIXEL_LANTERN.cells.find((c) => c.col === col && c.row === row)

describe('rasterLantern', () => {
  it('takes its cell from the ring band and its grid from the mark box', () => {
    const { box } = lanternShape(LANTERN)
    expect(cellOf(LANTERN)).toBe(LANTERN.ring.outer - LANTERN.ring.inner)
    expect(PIXEL_LANTERN.cols).toBe(box.width / cellOf(LANTERN))
    expect(PIXEL_LANTERN.rows).toBe(box.height / cellOf(LANTERN))
  })

  it('keeps every part of the mark', () => {
    for (const part of MARK_PARTS) expect(PIXEL_LANTERN.cells.some((c) => c.part === part)).toBe(true)
  })

  it('lights only cells at least half ink', () => {
    expect(PIXEL_LANTERN.cells.every((c) => c.cover >= LIT_COVER && c.cover <= 1)).toBe(true)
  })

  it('leaves the ring hole open', () => {
    const ring = PIXEL_LANTERN.cells.filter((c) => c.row < 5)
    const cols = ring.map((c) => c.col)
    const mid = (Math.min(...cols) + Math.max(...cols)) / 2
    expect(at(Math.floor(mid), 2)).toBeUndefined()
    expect(ring.length).toBeGreaterThan(0)
  })

  it('cuts the window free of the frame on every side', () => {
    const window = PIXEL_LANTERN.cells.filter((c) => c.part === 'window')
    const touchesFrame = window.some((w) =>
      [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx = 0, dy = 0]) => at(w.col + dx, w.row + dy)?.part === 'frame'),
    )
    expect(touchesFrame).toBe(false)
  })

  it('is mirror-symmetric, as the drawing is', () => {
    const key = new Set(PIXEL_LANTERN.cells.map((c) => `${c.col},${c.row},${c.part}`))
    const mirrored = PIXEL_LANTERN.cells.every((c) => key.has(`${PIXEL_LANTERN.cols - 1 - c.col},${c.row},${c.part}`))
    expect(mirrored).toBe(true)
  })

  it('is deterministic', () => {
    expect(rasterLantern()).toEqual(PIXEL_LANTERN)
  })
})
