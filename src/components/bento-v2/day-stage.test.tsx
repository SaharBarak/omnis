import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DayRows } from './day-rows'
import { restage } from './day-stage'
import { assemblyOf } from './pixel-mark/pixel-mark'
import { fitScale } from './use-fit'
import { useStage } from './use-stage'
import { DURATION, LIFT_SCALE } from '@/lib/design/motion-tokens'
import { dayRows, type V2DayRow } from '@/lib/site/v2-day'
import { getTodayAcrossSystems } from '@/lib/today-board'
import { todayBoards } from '@/lib/today-boards'
import { todayFigures } from '@/lib/today-figures'

const DAY = '2026-11-08'
const board = getTodayAcrossSystems(new Date(`${DAY}T12:00:00Z`))
const rows = dayRows({ board, figures: todayFigures(DAY, board), boards: todayBoards(DAY, board) })
const [first, second] = rows as readonly [V2DayRow, V2DayRow]

afterEach(() => {
  vi.useRealTimers()
})

describe('the stage (BENTO_V2.md "The stage")', () => {
  it('routes a row under the pointer to the stage and opens no board; a press still opens it and tells the stage', () => {
    const stage = { preview: vi.fn(), busy: vi.fn() }
    const view = render(<DayRows rows={rows} stage={stage} />)
    const button = view.getAllByRole('button')[0]!
    fireEvent.pointerEnter(button, { pointerType: 'mouse' })
    expect(stage.preview).toHaveBeenLastCalledWith(first)
    expect(button.getAttribute('aria-expanded')).toBe('false')
    fireEvent.pointerLeave(button, { pointerType: 'mouse' })
    expect(stage.preview).toHaveBeenLastCalledWith(null)
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(stage.busy).toHaveBeenLastCalledWith(expect.any(String), true)
  })

  it('previews nothing for a touch', () => {
    const stage = { preview: vi.fn(), busy: vi.fn() }
    const view = render(<DayRows rows={rows} stage={stage} />)
    fireEvent.pointerEnter(view.getAllByRole('button')[0]!, { pointerType: 'touch' })
    expect(stage.preview).not.toHaveBeenCalled()
  })

  it('shows at once, clears after the hover grace, and keeps what the pointer reaches in time', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useStage<V2DayRow>())
    act(() => result.current.port.preview(first))
    expect(result.current.shown).toBe(first)
    act(() => result.current.port.preview(null))
    act(() => result.current.port.preview(second))
    act(() => void vi.advanceTimersByTime(DURATION.quick))
    expect(result.current.shown).toBe(second)
    act(() => result.current.port.preview(null))
    act(() => result.current.hold())
    act(() => void vi.advanceTimersByTime(DURATION.quick))
    expect(result.current.shown).toBe(second)
    act(() => result.current.release())
    act(() => void vi.advanceTimersByTime(DURATION.quick))
    expect(result.current.shown).toBeNull()
  })

  it('is empty while a board is open or its caller suspends it, and forgets what it showed', () => {
    const { result, rerender } = renderHook(({ off }) => useStage<V2DayRow>(off), { initialProps: { off: false } })
    act(() => result.current.port.preview(first))
    act(() => result.current.port.busy('rows', true))
    expect(result.current.shown).toBeNull()
    act(() => result.current.port.preview(second))
    act(() => result.current.port.busy('rows', false))
    expect(result.current.shown).toBeNull()
    act(() => result.current.port.preview(first))
    rerender({ off: true })
    expect(result.current.shown).toBeNull()
    rerender({ off: false })
    expect(result.current.shown).toBeNull()
  })

  it('exchanges faces: those there leave as the row arrives, or go at once where no exit plays', () => {
    const one = restage([], first, 1, true)
    expect(one).toEqual([{ id: 1, row: first, leaving: false }])
    expect(restage(one, second, 2, true)).toEqual([{ id: 1, row: first, leaving: true }, { id: 2, row: second, leaving: false }])
    expect(restage(one, second, 2, false)).toEqual([{ id: 2, row: second, leaving: false }])
    expect(restage(one, null, 2, false)).toEqual([])
  })

  it('fits a figure to its room, growing one type level at most', () => {
    expect(fitScale({ width: 400, height: 300 }, { width: 800, height: 300 })).toBe(0.5)
    expect(fitScale({ width: 400, height: 150 }, { width: 400, height: 300 })).toBe(0.5)
    expect(fitScale({ width: 4000, height: 3000 }, { width: 400, height: 300 })).toBe(LIFT_SCALE)
    expect(fitScale({ width: 0, height: 0 }, { width: 400, height: 300 })).toBe(1)
  })

  it('eases a stated channel from where it stood, and with motion off stands at its end, ignoring a scrub', () => {
    const stated = { from: 1, to: 0, start: 0, ms: 100, stated: true }
    const scrub = { from: 0.5, to: 0.5, start: 0, ms: 0, stated: false }
    expect(assemblyOf([stated], 50, true, 1)).toBeCloseTo(0.5)
    expect(assemblyOf([stated, scrub], 100, true, 1)).toBe(0)
    expect(assemblyOf([stated], 10, false, 0.2)).toBe(0)
    expect(assemblyOf([scrub], 10, false, 0.2)).toBe(1)
  })
})
