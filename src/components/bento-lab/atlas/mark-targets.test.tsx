import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { placeMarks } from './mark-geometry'
import { holds, MarkTargets } from './mark-targets'
import { buildPersonAtlas } from '@/lib/atlas/build'
import { demoPerson } from '@/lib/atlas/demo'
import { markTitle } from '@/lib/atlas/marks'

const atlas = buildPersonAtlas(demoPerson('maya').input, '2026-10-11')
const marks = placeMarks(atlas).filter((m) => m.layer === 'maya').slice(0, 3)

const mount = (activeKey: string | null = null) => {
  const onEvent = vi.fn()
  render(
    <MarkTargets
      marks={marks}
      titleOf={(ref) => markTitle(atlas, ref)}
      activeKey={activeKey}
      cardId="card"
      isInCard={() => false}
      onEvent={onEvent}
      onIntent={() => undefined}
    />,
  )
  return { onEvent, buttons: screen.getAllByRole('button') }
}

describe('MarkTargets', () => {
  it('names each mark by its label and value, in one labelled toolbar with one tab stop', () => {
    const { buttons } = mount()
    expect(screen.getByRole('toolbar', { name: 'Marks on the map' })).toBeTruthy()
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(marks.map((m) => `${markTitle(atlas, m.ref)!.label}: ${markTitle(atlas, m.ref)!.value}`))
    expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1)
  })

  it('moves focus with the arrow keys, Home and End, and reports the focused mark', () => {
    const { buttons, onEvent } = mount()
    buttons[0].focus()
    fireEvent.keyDown(buttons[0], { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[1])
    expect(onEvent).toHaveBeenLastCalledWith({ type: 'focus', ref: marks[1].ref })
    fireEvent.keyDown(buttons[1], { key: 'End' })
    expect(document.activeElement).toBe(buttons[2])
    fireEvent.keyDown(buttons[2], { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[2])
    fireEvent.keyDown(buttons[2], { key: 'Home' })
    expect(document.activeElement).toBe(buttons[0])
    expect(buttons[0].tabIndex).toBe(0)
  })

  it('keeps a card on Enter or a click, and describes only the active mark by the card', () => {
    const { buttons, onEvent } = mount(marks[1].key)
    fireEvent.click(buttons[1])
    expect(onEvent).toHaveBeenLastCalledWith({ type: 'keep', ref: marks[1].ref })
    expect(buttons[1].getAttribute('aria-describedby')).toBe('card')
    expect(buttons[0].hasAttribute('aria-describedby')).toBe(false)
  })

  it('reports leaving the marks when focus moves outside them', () => {
    const { buttons, onEvent } = mount()
    buttons[0].focus()
    buttons[0].blur()
    expect(onEvent).toHaveBeenLastCalledWith({ type: 'blur' })
  })
})

describe('holds', () => {
  it('is true only for a node inside the container', () => {
    const outer = document.createElement('div')
    const inner = document.createElement('span')
    outer.append(inner)
    expect(holds(outer, inner)).toBe(true)
    expect(holds(outer, document.body)).toBe(false)
    expect(holds(outer, null)).toBe(false)
    expect(holds(outer, window)).toBe(false)
    expect(holds(null, inner)).toBe(false)
  })
})
