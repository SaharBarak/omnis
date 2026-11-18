import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BoardCalendar } from './board-calendar'
import type { CalendarCell, CalendarView } from '@/lib/boards/types'

const cell = (key: string, state: CalendarCell['state'] = 'ahead'): CalendarCell => ({ key, label: { text: key }, state, said: `day ${key}` })

/** Two sections of three columns: the first opens a column in (a b / c d), the second holds four (e f g / h). */
const VIEW: CalendarView = {
  id: 'months',
  layout: 'grid',
  name: 'Two months',
  tab: 'Two months',
  caption: '',
  legend: [{ key: 'quarter', words: 'A quarter falls on the day' }],
  sections: [
    { name: 'First', columns: 3, offset: 1, cells: ['a', 'b', 'c', 'd'].map((k) => cell(k, k === 'b' ? 'today' : k === 'a' ? 'past' : 'ahead')) },
    { name: 'Second', columns: 3, cells: ['e', 'f', 'g', 'h'].map((k) => cell(k)) },
  ],
}

const setup = (view: CalendarView = VIEW) => {
  const r = render(<BoardCalendar view={view} />)
  const grid = r.getByRole('grid', { name: view.name })
  const cellOf = (label: string) => r.getByRole('gridcell', { name: `day ${label}` })
  const press = (key: string, init: Partial<KeyboardEventInit> = {}) => fireEvent.keyDown(document.activeElement ?? grid, { key, ...init })
  return { ...r, grid, cellOf, press }
}

describe('BoardCalendar (BENTO_V2.md "Rows open their calendar\'s board")', () => {
  it('is one tab stop, on today, marked current', () => {
    const { grid, cellOf } = setup()
    const stops = grid.querySelectorAll('[tabindex="0"]')
    expect(stops).toHaveLength(1)
    expect(stops[0]).toBe(cellOf('b'))
    expect(cellOf('b').getAttribute('aria-current')).toBe('true')
    expect(cellOf('a').getAttribute('data-state')).toBe('past')
  })

  it('moves a cell at a time, a row down, and across into the next section by the nearest column', () => {
    const { cellOf, press } = setup()
    act(() => cellOf('b').focus())
    press('ArrowRight')
    expect(document.activeElement).toBe(cellOf('c'))
    press('ArrowLeft')
    press('ArrowLeft')
    expect(document.activeElement).toBe(cellOf('a'))
    press('ArrowDown')
    expect(document.activeElement).toBe(cellOf('d'))
    press('ArrowDown')
    expect(document.activeElement).toBe(cellOf('f'))
    press('ArrowUp')
    expect(document.activeElement).toBe(cellOf('d'))
  })

  it("steps down into a short last row by the nearest column, never past the view's end", () => {
    const month: CalendarView = { ...VIEW, name: 'Month', sections: [{ columns: 3, cells: ['a', 'b', 'c', 'd'].map((k) => cell(k, k === 'c' ? 'today' : 'ahead')) }] }
    const { cellOf, press } = setup(month)
    act(() => cellOf('c').focus())
    press('ArrowDown')
    expect(document.activeElement).toBe(cellOf('d'))
    press('ArrowDown')
    expect(document.activeElement).toBe(cellOf('d'))
  })

  it("goes to a row's ends with Home and End, and the view's with Control", () => {
    const { cellOf, press, grid } = setup()
    act(() => cellOf('c').focus())
    press('End')
    expect(document.activeElement).toBe(cellOf('d'))
    press('Home')
    expect(document.activeElement).toBe(cellOf('c'))
    press('End', { ctrlKey: true })
    expect(document.activeElement).toBe(cellOf('h'))
    press('Home', { ctrlKey: true })
    expect(document.activeElement).toBe(cellOf('a'))
    expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
  })

  it('reports the cell under the pointer or holding focus as it changes, and null once they leave (BENTO_BOARDS.md "Inspector")', () => {
    const pointed: (string | null)[] = []
    const focused: (string | null)[] = []
    const r = render(<BoardCalendar view={VIEW} onPoint={(key) => pointed.push(key)} onFocusCell={(key) => focused.push(key)} />)
    const grid = r.getByRole('grid', { name: VIEW.name })
    const at = (label: string) => r.getByRole('gridcell', { name: `day ${label}` })
    fireEvent.pointerEnter(at('g'))
    fireEvent.pointerLeave(grid)
    expect(pointed).toEqual(['g', null])
    act(() => at('e').focus())
    act(() => at('e').blur())
    expect(focused).toEqual(['e', null])
    expect(at('e').tabIndex).toBe(0)
  })

  it('holds the inspected cell at a wheel\'s hub, today at rest', () => {
    const ring: CalendarView = { ...VIEW, layout: 'wheel', sections: [{ columns: 4, cells: ['a', 'b', 'c', 'd'].map((k) => cell(k, k === 'c' ? 'today' : 'ahead')) }] }
    const r = render(<BoardCalendar view={ring} />)
    expect(r.container.querySelector('[data-compact]')?.textContent).toBe('day c')
    r.rerender(<BoardCalendar view={ring} inspected="a" />)
    expect(r.container.querySelector('[data-compact]')?.textContent).toBe('day a')
  })

  it('draws a wheel\'s cells as sectors, banded as a grid\'s cells are, each cell at its sector\'s centre', () => {
    const banded = (k: string): CalendarCell => ({ ...cell(k), band: k < 'c' ? 'one' : 'two' })
    const ring: CalendarView = { ...VIEW, layout: 'wheel', sections: [{ columns: 4, cells: ['a', 'b', 'c', 'd'].map(banded) }] }
    const r = render(<BoardCalendar view={ring} />)
    const sectors = [...r.container.querySelectorAll<SVGPathElement>('svg path')]
    expect(sectors).toHaveLength(4)
    expect(sectors.map((p) => [p.getAttribute('data-band'), p.style.getPropertyValue('--band'), p.style.getPropertyValue('--bands')])).toContainEqual(['two', '2', '2'])
    /* Four equal sectors from the top, clockwise: the first stands up and to the right of the hub. */
    const a = r.getByRole('gridcell', { name: 'day a' })
    expect(Number(a.style.getPropertyValue('--x'))).toBeGreaterThan(0)
    expect(Number(a.style.getPropertyValue('--y'))).toBeLessThan(0)
  })

  it('lets a focus request clear a held key', () => {
    const r = render(<BoardCalendar view={VIEW} />)
    const key = r.getByRole('button', { name: /A quarter/ })
    fireEvent.click(key)
    expect(key.getAttribute('aria-pressed')).toBe('true')
    r.rerender(<BoardCalendar view={VIEW} focus={{ key: 'b' }} />)
    expect(key.getAttribute('aria-pressed')).toBe('false')
  })

  it('keeps the blanks before a month in the grid, so each day sits under its weekday', () => {
    const { grid } = setup()
    const first = grid.querySelector('[role=rowgroup] [role=row]')
    expect(first?.querySelectorAll('[role=gridcell]')).toHaveLength(3)
  })

  it('runs round a wheel\'s ring, the last cell on to the first, and between rings at the nearest bearing, across the turn\'s seam', () => {
    const wheel: CalendarView = {
      ...VIEW,
      layout: 'wheel',
      name: 'Wheel',
      sections: [
        { name: 'Inner', columns: 2, cells: ['n', 's'].map((k) => cell(k)) },
        { name: 'Outer', columns: 4, cells: ['a', 'b', 'c', 'd'].map((k) => cell(k, k === 'd' ? 'today' : 'ahead')) },
      ],
    }
    const { cellOf, press } = setup(wheel)
    act(() => cellOf('d').focus())
    press('ArrowRight')
    expect(document.activeElement).toBe(cellOf('a'))
    press('ArrowLeft')
    expect(document.activeElement).toBe(cellOf('d'))
    /* Inward from the last quarter: the half that ends at the seam, not the one that begins there. */
    press('ArrowDown')
    expect(document.activeElement).toBe(cellOf('s'))
    press('ArrowUp')
    expect(['c', 'd'].map(cellOf)).toContain(document.activeElement)
    press('ArrowUp')
    expect(['c', 'd'].map(cellOf)).toContain(document.activeElement)
  })

  it('joins a figure\'s course through its tiles in the cells\' own order, whatever order the lattice reads them in', () => {
    const course: CalendarView = {
      ...VIEW,
      layout: 'figure',
      legend: [],
      sections: [{ columns: 2, path: true, places: { a: [0, 0], b: [1, 0], c: [1, 1], d: [0, 1] }, cells: ['a', 'b', 'c', 'd'].map((k) => cell(k)) }],
    }
    const r = render(<BoardCalendar view={course} />)
    expect(r.container.querySelector('polyline')?.getAttribute('points')).toBe('0.5,0.5 0.5,1.5 1.5,1.5 1.5,0.5')
  })

  it('keys its marks as a toolbar of toggles: pointing lights the cells that carry an entry, pressing holds it (BENTO_BOARDS.md "Keys")', () => {
    const keyed: CalendarView = {
      ...VIEW,
      legend: [
        { key: 'quarter', words: 'A quarter falls on the day' },
        { key: 'holiday', words: 'A holiday' },
      ],
      sections: [{ columns: 3, cells: [{ ...cell('a'), events: [{ name: 'Full Moon', key: 'quarter' }] }, { ...cell('b', 'today'), keys: ['holiday'] }, cell('c')] }],
    }
    const { getByRole, cellOf } = setup(keyed)
    const bar = getByRole('toolbar')
    const [quarter, holiday] = [...bar.querySelectorAll('button')]
    expect(bar.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    fireEvent.pointerEnter(quarter!)
    expect(cellOf('a').getAttribute('data-light')).toBe('lit')
    expect(cellOf('b').getAttribute('data-light')).toBe('quiet')
    fireEvent.pointerLeave(bar)
    expect(cellOf('a').hasAttribute('data-light')).toBe(false)
    fireEvent.click(holiday!)
    expect(holiday!.getAttribute('aria-pressed')).toBe('true')
    expect(cellOf('b').getAttribute('data-light')).toBe('lit')
    act(() => holiday!.focus())
    fireEvent.keyDown(holiday!, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(quarter)
  })

  it("places a section's cells where its figure sets them, the gaps blank, under row heads the arrows skip", () => {
    const cross: CalendarView = {
      ...VIEW,
      layout: 'figure',
      legend: [],
      sections: [
        {
          columns: 3,
          rowHeads: [
            { text: 'top', said: 'Top' },
            { text: 'mid', said: 'Middle' },
            { text: 'low', said: 'Bottom' },
          ],
          places: { up: [0, 1], left: [1, 0], centre: [1, 1], right: [1, 2], down: [2, 1] },
          cells: [cell('up'), cell('left'), cell('centre', 'today'), cell('right'), cell('down')],
        },
      ],
    }
    const { grid, cellOf, press, getAllByRole } = setup(cross)
    expect(getAllByRole('rowheader').map((h) => h.getAttribute('aria-label'))).toEqual(['Top', 'Middle', 'Bottom'])
    expect(grid.querySelectorAll('[role=row]')).toHaveLength(3)
    expect([...grid.querySelectorAll('[role=row]')[0]!.querySelectorAll('[role=gridcell]')].map((c) => c.getAttribute('aria-label'))).toEqual([null, 'day up', null])
    act(() => cellOf('centre').focus())
    press('ArrowUp')
    expect(document.activeElement).toBe(cellOf('up'))
    press('ArrowDown')
    press('ArrowDown')
    expect(document.activeElement).toBe(cellOf('down'))
    press('ArrowUp')
    press('ArrowLeft')
    expect(document.activeElement).toBe(cellOf('left'))
  })

  it('lights the cell a Next event names, and moves focus to it when asked', () => {
    const { cellOf, rerender } = setup()
    rerender(<BoardCalendar view={VIEW} spot="g" />)
    expect(cellOf('g').getAttribute('data-light')).toBe('lit')
    expect(cellOf('e').getAttribute('data-light')).toBe('quiet')
    rerender(<BoardCalendar view={VIEW} focus={{ key: 'h' }} />)
    expect(document.activeElement).toBe(cellOf('h'))
  })

  it('colours a cell in its source colour', () => {
    const tinted: CalendarView = { ...VIEW, legend: [], sections: [{ columns: 2, cells: [{ ...cell('a', 'today'), tint: 'red' }, { ...cell('b'), tint: 'white' }] }] }
    const { cellOf } = setup(tinted)
    expect(cellOf('a').getAttribute('data-tint')).toBe('red')
    expect(cellOf('b').getAttribute('data-tint')).toBe('white')
  })
})
