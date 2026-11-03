import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AtlasStage } from './atlas-stage'
import { C, SIZE } from './geometry'
import { placeMarks } from './mark-geometry'
import { buildPersonAtlas } from '@/lib/atlas/build'
import { demoPerson } from '@/lib/atlas/demo'
import { markTitle } from '@/lib/atlas/marks'
import type { PersonAtlas } from '@/lib/atlas/types'
import { DURATION } from '@/lib/design/motion-tokens'

const STATUS = { status: 'ready', error: null } as const
const first = buildPersonAtlas(demoPerson('maya').input, '2026-10-11')
const second = buildPersonAtlas(demoPerson('maya').input, '2026-10-12')

const mount = (atlas: PersonAtlas = first) => {
  const view = render(<AtlasStage atlas={atlas} status={STATUS} focus={null} onFocus={() => undefined} />)
  const card = () => screen.getByRole('tooltip', { hidden: true })
  const svg = view.container.querySelector('svg')!
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: SIZE, height: SIZE, right: SIZE, bottom: SIZE, x: 0, y: 0, toJSON: () => ({}) })
  return { ...view, card, targets: svg.nextElementSibling! }
}

const button = (key: string) => document.querySelector<HTMLButtonElement>(`[data-target="${key}"]`)!

/** Reduced motion: the rings stand still, so the marks sit where they are placed. */
const reducedMotion = (media: string) => ({ media, matches: true, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })

beforeAll(() => vi.stubGlobal('matchMedia', reducedMotion))
afterAll(() => vi.unstubAllGlobals())
afterEach(() => vi.useRealTimers())

describe('AtlasStage marks', () => {
  const sun = placeMarks(first).find((m) => m.key === 'planet:sun')!

  it('opens the card for a focused mark and describes the mark by it', () => {
    const { card } = mount()
    act(() => button(sun.key).focus())
    expect(card().hasAttribute('data-open')).toBe(true)
    expect(card().textContent).toContain(markTitle(first, sun.ref)!.value)
    expect(button(sun.key).getAttribute('aria-describedby')).toBe(card().id)
  })

  it('closes the card on Escape before anything else hears the key', () => {
    const { card } = mount()
    const outer = vi.fn()
    document.addEventListener('keydown', outer)
    act(() => button(sun.key).focus())
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    document.removeEventListener('keydown', outer)
    expect(card().hasAttribute('data-open')).toBe(false)
    expect(outer).not.toHaveBeenCalled()
  })

  it('closes a hovered card only after the grace, and not when the pointer reaches the card', () => {
    vi.useFakeTimers()
    const { card, targets } = mount()
    fireEvent.pointerMove(targets, { pointerType: 'mouse', clientX: sun.anchor[0], clientY: sun.anchor[1] })
    expect(card().hasAttribute('data-open')).toBe(true)

    fireEvent.pointerMove(targets, { pointerType: 'mouse', clientX: C, clientY: 1 })
    act(() => vi.advanceTimersByTime(DURATION.quick - 1))
    expect(card().hasAttribute('data-open')).toBe(true)
    fireEvent.pointerEnter(card())
    act(() => vi.advanceTimersByTime(DURATION.quick))
    expect(card().hasAttribute('data-open')).toBe(true)

    fireEvent.pointerLeave(card(), { relatedTarget: document.body })
    act(() => vi.advanceTimersByTime(DURATION.quick))
    expect(card().hasAttribute('data-open')).toBe(false)
  })

  it('closes the card when the atlas changes under it', () => {
    const { card, rerender } = mount()
    act(() => button(sun.key).click())
    expect(card().hasAttribute('data-kept')).toBe(true)
    rerender(<AtlasStage atlas={second} status={STATUS} focus={null} onFocus={() => undefined} />)
    expect(card().hasAttribute('data-open')).toBe(false)
  })
})
