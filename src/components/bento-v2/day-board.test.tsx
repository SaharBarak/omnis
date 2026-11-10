import { act, fireEvent, render, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { todayKeyOf } from './board-calendar'
import { DayBoardBody } from './day-board'
import { dayRows } from '@/lib/site/v2-day'
import { getTodayAcrossSystems } from '@/lib/today-board'
import { todayBoards } from '@/lib/today-boards'
import { todayFigures } from '@/lib/today-figures'

const DAY = '2026-11-08'
const board = getTodayAcrossSystems(new Date(`${DAY}T12:00:00Z`))
const rows = dayRows({ board, figures: todayFigures(DAY, board), boards: todayBoards(DAY, board) })
const rowOf = (field: string) => rows.find((r) => r.field === field)!

describe('DayBoardBody (BENTO_BOARDS.md "The board")', () => {
  it('sets every board in one skeleton: the mast with its close, the bar of controls, the stage, then the inspector, Next and Facts', () => {
    const onClose = vi.fn()
    const view = render(<DayBoardBody row={rowOf('moon')} onClose={onClose} />)
    expect(view.getByRole('tablist', { name: 'Views' })).toBeTruthy()
    expect(view.getByRole('button', { name: /^Today, in / })).toBeTruthy()
    const inspector = view.getByRole('region', { name: 'In focus' })
    expect(inspector.textContent).toContain('Today')
    for (const heading of ['Next', 'Facts']) expect(view.getByRole('heading', { name: heading })).toBeTruthy()
    fireEvent.click(view.getByRole('button', { name: /^Close the / }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('inspects the cell pointed at, then today again once the pointer leaves', () => {
    const view = render(<DayBoardBody row={rowOf('moon')} />)
    const inspector = () => view.getByRole('region', { name: 'In focus' })
    const grid = view.getByRole('grid')
    const cells = within(grid).getAllByRole('gridcell').filter((c) => c.getAttribute('aria-label'))
    const other = cells.find((c) => c.getAttribute('aria-current') === null)!
    fireEvent.pointerEnter(other)
    expect(inspector().textContent).toContain(other.getAttribute('aria-label')!.split(' · ')[0])
    expect(inspector().textContent).not.toMatch(/In focusToday/)
    fireEvent.pointerLeave(grid)
    expect(inspector().textContent).toMatch(/In focusToday/)
  })

  it('brings focus back to today with Today, and disables it where the view holds no single day', () => {
    const view = render(<DayBoardBody row={rowOf('moon')} />)
    const grid = view.getByRole('grid')
    const first = within(grid).getAllByRole('gridcell').find((c) => c.getAttribute('aria-label') && c.getAttribute('aria-current') === null)!
    act(() => first.focus())
    fireEvent.click(view.getByRole('button', { name: /^Today, in / }))
    expect(document.activeElement?.getAttribute('aria-current')).not.toBeNull()
  })

  it('never carries a focus request into the next view: a tab chosen after Today keeps focus off the cells', () => {
    const view = render(<DayBoardBody row={rowOf('moon')} />)
    fireEvent.click(view.getByRole('button', { name: /^Today, in / }))
    const tabs = view.getAllByRole('tab')
    act(() => tabs[1]!.focus())
    fireEvent.click(tabs[1]!)
    expect(document.activeElement).toBe(tabs[1])
  })

  it('keeps Today focusable where the view holds no single day, saying why', () => {
    const moon = rowOf('moon')
    const [first] = moon.board.views!
    const ahead = { ...first!, id: 'ahead', tab: 'Ahead', sections: first!.sections.map((s) => ({ ...s, cells: s.cells.map((c) => ({ ...c, state: 'ahead' as const })) })) }
    expect(todayKeyOf(ahead)).toBeNull()
    const view = render(<DayBoardBody row={{ ...moon, board: { ...moon.board, views: [first!, ahead] } }} />)
    fireEvent.click(view.getByRole('tab', { name: 'Ahead' }))
    const today = view.getByRole('button', { name: /^Today: .* holds no single day$/ })
    expect(today.getAttribute('aria-disabled')).toBe('true')
    expect(today.hasAttribute('disabled')).toBe(false)
    expect(today.getAttribute('title')).toMatch(/holds no single day$/)
  })
})
