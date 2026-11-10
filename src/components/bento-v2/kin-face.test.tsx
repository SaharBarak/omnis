import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KinFace } from './kin-face'
import { kinOfDay } from '@/lib/site/v2-home'
import { getTodayAcrossSystems } from '@/lib/today-board'
import { todayBoards } from '@/lib/today-boards'
import { todayFigures } from '@/lib/today-figures'

/** 21 December 2012: kin 207, Blue Crystal Hand (BENTO_BOARDS.md "The kin's board"). */
const DAY = '2012-12-21'
const board = getTodayAcrossSystems(new Date(`${DAY}T12:00:00Z`))
const kin = kinOfDay(DAY, { board, figures: todayFigures(DAY, board), boards: todayBoards(DAY, board) })

describe('KinFace (BENTO_V2.md "Kin tile")', () => {
  it('opens the kin’s board from the tile, as a day row opens its calendar’s: hover previews, the head stays outside', () => {
    const view = render(<KinFace kin={kin} head={<span>Today&apos;s kin</span>} />)
    const opener = view.getByRole('button')
    const card = view.getByRole('group', { hidden: true })
    expect(opener.getAttribute('aria-controls')).toBe(card.id)
    expect(opener.textContent).toContain('207')
    expect(opener.textContent).not.toContain("Today's kin")
    fireEvent.pointerEnter(opener, { pointerType: 'mouse' })
    expect(opener.getAttribute('aria-expanded')).toBe('true')
    for (const words of ['Kin 207', 'Blue Crystal Hand', 'Next', 'Facts', 'Yellow Warrior Wavespell']) expect(card.textContent).toContain(words)
    expect(view.getAllByRole('tab', { hidden: true }).map((t) => t.textContent)).toEqual(['Wavespell', "Tzolk'in", 'Oracle', '13 Moon'])
  })

  it('moves focus into the board on Enter and hands it back on Escape', () => {
    const view = render(<KinFace kin={kin} />)
    const opener = view.getByRole('button')
    const card = view.getByRole('group', { hidden: true })
    act(() => opener.focus())
    fireEvent.click(opener, { detail: 0 })
    expect(document.activeElement).toBe(card)
    fireEvent.keyDown(card, { key: 'Escape' })
    expect(document.activeElement).toBe(opener)
    expect(opener.getAttribute('aria-expanded')).toBe('false')
  })

  it('is no button where the kin carries no board', () => {
    const { row: _row, ...bare } = kin
    const view = render(<KinFace kin={bare} />)
    expect(view.queryByRole('button')).toBeNull()
    expect(view.container.textContent).toContain('Crystal Hand')
  })
})
