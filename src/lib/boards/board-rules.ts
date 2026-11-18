import { expect } from 'vitest'
import { cellKeys, type CalendarView, type DayBoard } from './types'

/**
 * The rules every board holds (BENTO_BOARDS.md "The board", "Views",
 * "Keys"), for each board's tests: views with unique ids, short tabs and
 * captions; today once in every view; cell keys unique in their view, each
 * saying itself; one membership authority, every key a cell carries named by
 * one legend entry and every entry carried by a cell; each event that names
 * a cell naming a view and cell that exist; a wheel's rings measured whole
 * or not at all; Next dated from `day`, nearest first. Test-only: it reads vitest's `expect`.
 */
export function expectBoardRules(board: DayBoard, label: string, shiftDay: (day: string, n: number) => string, day: string): void {
  const views = board.views ?? []
  expect(board.mast, label).toBeDefined()
  expect(new Set(views.map((v) => v.id)).size, `${label} view ids`).toBe(views.length)
  for (const view of views) expectViewRules(view, `${label} ${view.id}`)
  for (const event of board.next) {
    expect(event.date, `${label} ${event.name}`).toBe(shiftDay(day, event.inDays))
    if (!event.at) continue
    const view = views.find((v) => v.id === event.at?.view)
    expect(view, `${label} ${event.name} view`).toBeDefined()
    expect(
      view?.sections.some((s) => s.cells.some((c) => c.key === event.at?.cell)),
      `${label} ${event.name} cell ${event.at.cell}`,
    ).toBe(true)
  }
  const days = board.next.map((e) => e.inDays)
  expect(days, `${label} next order`).toEqual([...days].sort((a, b) => a - b))
}

export function expectViewRules(view: CalendarView, label: string): void {
  const cells = view.sections.flatMap((s) => s.cells)
  expect(view.tab, `${label} tab`).toMatch(/^[\p{Lu}\p{N}][\p{L}\p{N}']*( [\p{L}'][\p{L}']*)?$/u)
  expect(view.caption, `${label} caption`).not.toBe('')
  expect(cells.filter((c) => c.state === 'today'), `${label} today`).toHaveLength(1)
  const keys = cells.map((c) => c.key)
  expect(new Set(keys).size, `${label} cell keys`).toBe(keys.length)
  for (const cell of cells) expect(cell.said, `${label} ${cell.key}`).not.toBe('')
  const entries = view.legend.map((e) => e.key)
  expect(new Set(entries).size, `${label} legend keys`).toBe(entries.length)
  const carried = new Set(cells.flatMap(cellKeys))
  for (const key of carried) expect(entries, `${label}: cells carry "${key}" with no legend entry`).toContain(key)
  for (const key of entries) expect(carried.has(key), `${label}: legend "${key}" names no cell`).toBe(true)
  for (const section of view.sections) {
    if (!section.places) continue
    const at = section.cells.map((c) => section.places?.[c.key])
    expect(at.every(Boolean), `${label}: a placed section places every cell`).toBe(true)
    expect(new Set(at.map((p) => p?.join(','))).size, `${label}: no two cells share a place`).toBe(at.length)
  }
  /* A wheel's ring measures every cell or none (BENTO_BOARDS.md "Figures", Wheel), each span a positive length; its rings are named, so each row says what it holds. */
  if (view.layout !== 'wheel') return
  for (const section of view.sections) {
    const spans = section.cells.map((c) => c.span)
    expect(spans.every((span) => span === undefined) || spans.every((span) => span !== undefined && Number.isFinite(span) && span > 0), `${label}: a ring's spans are all given or none`).toBe(true)
    if (view.sections.length > 1) expect(section.name, `${label}: a ring of several is named`).toBeTruthy()
  }
}
