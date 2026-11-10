import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DayRows } from './day-rows'
import { DURATION } from '@/lib/design/motion-tokens'
import { dayRows } from '@/lib/site/v2-day'
import { getTodayAcrossSystems } from '@/lib/today-board'
import { todayBoards } from '@/lib/today-boards'
import { todayFigures } from '@/lib/today-figures'

const DAY = '2026-11-08'
const board = getTodayAcrossSystems(new Date(`${DAY}T12:00:00Z`))
const rows = dayRows({ board, figures: todayFigures(DAY, board), boards: todayBoards(DAY, board) })

const setup = (props: Partial<Parameters<typeof DayRows>[0]> = {}) => {
  const view = render(<DayRows rows={rows} {...props} />)
  const card = view.getByRole('group', { hidden: true })
  const at = (field: string) => view.getAllByRole('button')[rows.findIndex((r) => r.field === field)]!
  const expanded = (field: string) => at(field).getAttribute('aria-expanded') === 'true'
  return { view, card, at, expanded }
}

/** The last of a board's tab stops: its calendar's one cell in the tab order. */
const lastStop = (card: HTMLElement): HTMLElement => {
  const stops = card.querySelectorAll<HTMLElement>('button, [tabindex="0"]')
  return stops[stops.length - 1]!
}

afterEach(() => {
  vi.useRealTimers()
})

describe('DayRows (BENTO_V2.md "Rows open their calendar\'s board")', () => {
  it('lists every row as a disclosure of one board, closed at rest', () => {
    const { view, card } = setup()
    expect(view.getAllByRole('listitem')).toHaveLength(rows.length)
    for (const button of view.getAllByRole('button')) {
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(button.getAttribute('aria-controls')).toBe(card.id)
      expect(button.getAttribute('aria-describedby')).toBeNull()
    }
  })

  it('names each row by its calendar, its value and where today stands in its cycle', () => {
    const { view } = setup()
    expect(view.getByRole('button', { name: /^Human Design gate.*1\.4.*The Creative.*line 4 of 6$/ })).toBeTruthy()
    expect(view.getByRole('button', { name: /^Sun.*16°.*Scorpio.*16 of 30 degrees$/ })).toBeTruthy()
  })

  it("previews a row's board on hover, hung from and named by that row: its mast, its calendar, what comes next and its facts", () => {
    const { view, at, card, expanded } = setup()
    fireEvent.pointerEnter(at('gate'), { pointerType: 'mouse' })
    expect(expanded('gate')).toBe(true)
    expect(at('gate').closest('[data-anchor]')).not.toBeNull()
    expect(card.getAttribute('aria-labelledby')).toBe(at('gate').id)
    for (const words of ['Human Design gate', '1.4', 'The Creative', 'Line 4, Opportunist', "Gate 1's lines", 'Line 4 of 6', 'Next', 'Gate 43, Insight', 'Facts', 'Entropy → Freshness → Beauty']) {
      expect(card.textContent).toContain(words)
    }
    const grid = view.getByRole('grid', { name: "Gate 1's lines", hidden: true })
    expect(grid.querySelectorAll('[role=gridcell]')).toHaveLength(8)
    expect(grid.querySelector('[aria-current]')?.getAttribute('aria-label')).toMatch(/^Line 4, Opportunist/)
    expect(card.querySelector('time')?.getAttribute('dateTime')).toBe('2026-11-09')
  })

  it("shows a board's views as tabs, the arrow keys selecting the tab they reach (BENTO_BOARDS.md \"Views\")", () => {
    const { view, at, card } = setup()
    fireEvent.click(at('gate'), { detail: 1 })
    const lines = view.getByRole('tab', { name: 'Lines', hidden: true })
    expect(lines.getAttribute('aria-selected')).toBe('true')
    act(() => lines.focus())
    fireEvent.keyDown(lines, { key: 'ArrowRight' })
    const wheelTab = view.getByRole('tab', { name: 'Wheel', hidden: true })
    expect(wheelTab.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(wheelTab)
    const wheel = view.getByRole('grid', { name: 'The Rave Mandala', hidden: true })
    expect(wheel.querySelectorAll('[role=gridcell]')).toHaveLength(64)
    expect(wheel.querySelector('[aria-current]')?.getAttribute('aria-label')).toMatch(/^Gate 1, The Creative · .*the Sun is in it/)
    fireEvent.click(lines)
    expect(card.textContent).toContain("Gate 1's lines")
  })

  it('lights the cell a Next event falls on in the view shown, never switching by hover, and shows its view and focuses it when pressed', () => {
    const { view, at } = setup()
    fireEvent.click(at('moon'), { detail: 1 })
    const fullMoon = view.getByRole('button', { name: /^Full Moon/, hidden: true })
    fireEvent.pointerEnter(fullMoon)
    expect(view.getByRole('grid', { name: 'The lunation', hidden: true }).querySelector('[data-light]')).toBeNull()
    fireEvent.click(fullMoon)
    expect(view.getByRole('tab', { name: 'Two months', hidden: true }).getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/Full Moon/)
    fireEvent.pointerEnter(fullMoon)
    const lit = view.getByRole('grid', { name: / and /, hidden: true }).querySelector('[data-light="lit"]')
    expect(lit?.getAttribute('aria-label')).toMatch(/Full Moon/)
  })

  it('keeps a hovered board a press inside it opens', () => {
    const { at, card, expanded } = setup()
    fireEvent.pointerEnter(at('moon'), { pointerType: 'mouse' })
    expect(card.hasAttribute('data-kept')).toBe(false)
    fireEvent.pointerDown(card)
    expect(card.hasAttribute('data-kept')).toBe(true)
    expect(expanded('moon')).toBe(true)
  })

  it('lets a hovered board go a beat after the pointer leaves, and holds it while the pointer is on it', () => {
    vi.useFakeTimers()
    const { at, card, expanded } = setup()
    fireEvent.pointerEnter(at('moon'), { pointerType: 'mouse' })
    fireEvent.pointerLeave(at('moon'), { pointerType: 'mouse' })
    fireEvent.pointerEnter(card)
    act(() => vi.advanceTimersByTime(DURATION.quick * 2))
    expect(expanded('moon')).toBe(true)
    fireEvent.pointerLeave(card)
    act(() => vi.advanceTimersByTime(DURATION.quick - 1))
    expect(expanded('moon')).toBe(true)
    act(() => vi.advanceTimersByTime(1))
    expect(expanded('moon')).toBe(false)
  })

  it('opens on a tap by its press alone, keeps it, and closes it on a press outside', () => {
    const { at, card, expanded } = setup()
    fireEvent.pointerEnter(at('moon'), { pointerType: 'touch' })
    expect(expanded('moon')).toBe(false)
    fireEvent.click(at('moon'), { detail: 1 })
    expect(expanded('moon')).toBe(true)
    expect(card.hasAttribute('data-kept')).toBe(true)
    expect(document.activeElement).not.toBe(card)
    fireEvent.pointerDown(document.body)
    expect(expanded('moon')).toBe(false)
  })

  it('gives focus the board, over a kept one', () => {
    const { at, card, expanded } = setup()
    fireEvent.click(at('moon'), { detail: 1 })
    fireEvent.focus(at('sun'))
    expect(expanded('sun')).toBe(true)
    expect(expanded('moon')).toBe(false)
    expect(card.textContent).toContain('16° Scorpio')
  })

  it('moves focus into the board a key opened, and hands it back to the row on Escape without opening it again', () => {
    const { at, card, expanded } = setup()
    act(() => at('hebrewDate').focus())
    fireEvent.click(at('hebrewDate'), { detail: 0 })
    expect(card.hasAttribute('data-kept')).toBe(true)
    expect(document.activeElement).toBe(card)
    expect(card.textContent).toContain('Rosh Chodesh Kislev')
    fireEvent.keyDown(card, { key: 'Escape' })
    expect(document.activeElement).toBe(at('hebrewDate'))
    expect(expanded('hebrewDate')).toBe(false)
  })

  it("tabs through an entered board's controls, then on to the next row, and back to its own with Shift+Tab", () => {
    const { at, card, expanded } = setup()
    act(() => at('sun').focus())
    fireEvent.click(at('sun'), { detail: 0 })
    expect(document.activeElement).toBe(card)
    fireEvent.keyDown(card, { key: 'Tab' })
    expect(document.activeElement).toBe(card)
    expect(expanded('sun')).toBe(true)
    const stop = lastStop(card)
    act(() => stop.focus())
    fireEvent.keyDown(stop, { key: 'Tab' })
    expect(document.activeElement).toBe(at('gate'))
    expect(expanded('gate')).toBe(true)
    fireEvent.click(at('gate'), { detail: 0 })
    fireEvent.keyDown(card, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(at('gate'))
    expect(expanded('gate')).toBe(true)
  })

  it('closes a board Tab leaves past the last row', () => {
    const { at, card, expanded } = setup()
    const last = rows[rows.length - 1]!.field
    act(() => at(last).focus())
    fireEvent.click(at(last), { detail: 0 })
    const stop = lastStop(card)
    act(() => stop.focus())
    fireEvent.keyDown(stop, { key: 'Tab' })
    expect(expanded(last)).toBe(false)
  })

  it('closes a board on Escape while focus is on its row, leaving focus there', () => {
    const { at, expanded } = setup()
    act(() => at('moon').focus())
    fireEvent.focus(at('moon'))
    expect(expanded('moon')).toBe(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(expanded('moon')).toBe(false)
    expect(document.activeElement).toBe(at('moon'))
  })

  it('hands focus back to the row when its board closes under focus', () => {
    const { view, at, card } = setup({ closeKey: 'rest' })
    act(() => at('gate').focus())
    fireEvent.click(at('gate'), { detail: 0 })
    expect(document.activeElement).toBe(card)
    view.rerender(<DayRows rows={rows} closeKey="scrolled" />)
    expect(document.activeElement).toBe(at('gate'))
    expect(at('gate').getAttribute('aria-expanded')).toBe('false')
  })

  it('closes its board when its rows change, or when its caller says the rows moved', () => {
    const { view } = setup({ closeKey: 'rest' })
    fireEvent.click(view.getAllByRole('button')[1]!, { detail: 1 })
    expect(view.getAllByRole('button')[1]!.getAttribute('aria-expanded')).toBe('true')
    view.rerender(<DayRows rows={rows} closeKey="scrolled" />)
    expect(view.getAllByRole('button')[1]!.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(view.getAllByRole('button')[1]!, { detail: 1 })
    view.rerender(<DayRows rows={rows.filter((r) => r.field !== 'moon')} closeKey="scrolled" />)
    for (const button of view.getAllByRole('button')) expect(button.getAttribute('aria-expanded')).toBe('false')
  })
})
