import { act, fireEvent, render } from '@testing-library/react'
import { mayDrawEdge } from '@pleiad/engine/services/rarity'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { tieEndKeys } from './pair-inspect'
import { keySelector, pairLayout } from './pair-layout'
import { PairStage, usePairControl } from './pair-stage'
import { buildPairAtlas } from '@/lib/atlas/build'
import { demoPerson } from '@/lib/atlas/demo'
import type { PairAtlas } from '@/lib/atlas/types'
import { tieView } from '@/lib/relations/tie-text'

const artRenders = vi.hoisted(() => ({ count: 0 }))

vi.mock('./pair-drawing', async (importOriginal) => {
  const real = await importOriginal<typeof import('./pair-drawing')>()
  return {
    ...real,
    PairFrameArt: (props: Parameters<typeof real.PairFrameArt>[0]) => {
      artRenders.count += 1
      return real.PairFrameArt(props)
    },
  }
})

const pair = buildPairAtlas(demoPerson('maya'), demoPerson('ari'), '2026-11-08')
const other = buildPairAtlas(demoPerson('maya'), demoPerson('noam'), '2026-11-08')
const wide = pairLayout(pair, 'landscape')
const tall = pairLayout(pair, 'portrait')
const undrawnEnded = pair.reading.ties.findIndex((t, i) => !mayDrawEdge(t.baseRate) && tieEndKeys(pair, i).length > 0)
const undrawnBare = pair.reading.ties.findIndex((t, i) => !mayDrawEdge(t.baseRate) && tieEndKeys(pair, i).length === 0)

function Harness({ of }: { readonly of: PairAtlas }) {
  const control = usePairControl(of)
  const { listRef, rowProps, rowButtonProps } = control
  return (
    <>
      <PairStage control={control} describedBy="ties" />
      <ol ref={listRef} id="ties">
        {of.reading.ties.map((tie, index) => (
          <li key={index} {...rowProps(index)}>
            <button {...rowButtonProps(index)}>{tieView(tie).name}</button>
          </li>
        ))}
      </ol>
      <button type="button" data-outside="">
        outside
      </button>
    </>
  )
}

const mount = (orientation: 'landscape' | 'portrait' = 'landscape') => {
  const view = render(<Harness of={pair} />)
  const landscape = view.container.querySelector(`[data-orient="${orientation}"] [data-pair-view]`)!
  const art = landscape.querySelector('svg')!
  const { width, height } = wide.view
  art.getBoundingClientRect = () => ({ left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) })
  const card = () => landscape.querySelector<HTMLElement>('[role="tooltip"]')!
  const targets = card().previousElementSibling!
  const button = (key: string) => landscape.querySelector<HTMLButtonElement>(`[data-target="${key}"]`)!
  const state = (selector: string) => landscape.querySelector(selector)?.getAttribute('data-state') ?? null
  const row = (index: number) => view.container.querySelector<HTMLElement>(`[data-tie-row="${index}"]`)!
  const rowButton = (index: number) => row(index).querySelector('button')!
  const lit = () => [...view.container.querySelectorAll('[data-state]')]
  return { ...view, landscape, card, targets, button, state, row, rowButton, lit }
}

const reducedMotion = (media: string) => ({ media, matches: true, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })

beforeAll(() => vi.stubGlobal('matchMedia', reducedMotion))
afterAll(() => vi.unstubAllGlobals())

describe('PairStage', () => {
  const guide = wide.ties[0]

  it('renders the art once: reading a tie or a mark writes its lighting only', () => {
    artRenders.count = 0
    const { button, state, container } = mount()
    const mounted = artRenders.count
    expect(mounted).toBe(2)
    act(() => button(`tie:${guide.index}`).focus())
    expect(state(`[data-tie-key="tie:${guide.index}"]`)).toBe('active')
    for (const end of Object.values(guide.ends)) {
      const [side, ...mark] = end.key!.split(':')
      expect(state(`[data-person="${side}"] [data-mark="${mark.join(':')}"]`)).toBe('related')
    }
    expect(container.querySelector('[data-pair-stage]')!.hasAttribute('data-inspect')).toBe(true)
    act(() => button('a:planet:sun').focus())
    expect(state('[data-person="a"] [data-mark="planet:sun"]')).toBe('active')
    expect(state(`[data-tie-key="tie:${guide.index}"]`)).toBeNull()
    expect(artRenders.count).toBe(mounted)
  })

  it('clears the lighting when the card closes', () => {
    const { button, landscape, card } = mount()
    act(() => button(`tie:${guide.index}`).focus())
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(card().hasAttribute('data-open')).toBe(false)
    expect(landscape.querySelectorAll('[data-state]')).toHaveLength(0)
  })

  it('opens a tie card from its pill under the pointer, in the tie own words', () => {
    const { targets, card } = mount()
    const [x, y] = guide.curve.mid
    fireEvent.pointerMove(targets, { pointerType: 'mouse', clientX: x, clientY: y })
    expect(card().hasAttribute('data-open')).toBe(true)
    const view = tieView(guide.tie)
    for (const line of [view.name, view.odds, view.tier]) expect(card().textContent).toContain(line)
    expect(card().textContent).toContain('Tie · Dreamspell')
  })

  it('lights the tie a row rests under, with no card away from the pointer', () => {
    const { row, rowButton, card, state, lit } = mount()
    fireEvent.pointerEnter(row(guide.index), { pointerType: 'mouse' })
    expect(card().hasAttribute('data-open')).toBe(false)
    expect(state(`[data-tie-key="tie:${guide.index}"]`)).toBe('active')
    expect(rowButton(guide.index).hasAttribute('data-lit')).toBe(true)
    fireEvent.pointerLeave(row(guide.index))
    expect(lit()).toHaveLength(0)
  })

  it('reads a row tie on focus, describes the row by its card, and keeps it on a press', () => {
    const { rowButton, row, card, container } = mount()
    act(() => rowButton(guide.index).focus())
    expect(card().hasAttribute('data-open')).toBe(true)
    expect(rowButton(guide.index).getAttribute('aria-current')).toBe('true')
    expect(rowButton(guide.index).getAttribute('aria-describedby')).toBe(card().id)
    fireEvent.click(rowButton(guide.index))
    expect(card().hasAttribute('data-kept')).toBe(true)
    fireEvent.pointerDown(row(guide.index + 1))
    expect(card().hasAttribute('data-kept')).toBe(true)
    fireEvent.pointerDown(container.querySelector('[data-outside]')!)
    expect(card().hasAttribute('data-open')).toBe(false)
  })

  it('keeps a row tie on a tap, and takes no preview from touch', () => {
    const { row, rowButton, card, lit } = mount()
    fireEvent.pointerEnter(row(guide.index), { pointerType: 'touch' })
    expect(lit()).toHaveLength(0)
    fireEvent.click(rowButton(guide.index))
    expect(card().hasAttribute('data-kept')).toBe(true)
  })

  it('reaches a tie too common to draw from the keyboard, lighting the marks it ends on', () => {
    expect(undrawnEnded).toBeGreaterThan(-1)
    const { rowButton, card, landscape } = mount()
    act(() => rowButton(undrawnEnded).focus())
    expect(card().hasAttribute('data-open')).toBe(true)
    expect(card().textContent).toContain(tieView(pair.reading.ties[undrawnEnded]).name)
    for (const key of tieEndKeys(pair, undrawnEnded)) expect(landscape.querySelector(keySelector(key))!.getAttribute('data-state')).toBe('related')
  })

  it('opens the card of a tie that names no mark, lighting no mark', () => {
    expect(undrawnBare).toBeGreaterThan(-1)
    const { rowButton, card, landscape } = mount()
    act(() => rowButton(undrawnBare).focus())
    expect(card().hasAttribute('data-open')).toBe(true)
    expect(card().textContent).toContain(tieView(pair.reading.ties[undrawnBare]).name)
    expect(landscape.querySelectorAll('[data-person] [data-state]')).toHaveLength(0)
  })

  it('closes the card and clears the lighting when the pair changes mid-read', () => {
    const view = mount()
    fireEvent.click(view.rowButton(guide.index))
    expect(view.card().hasAttribute('data-kept')).toBe(true)
    view.rerender(<Harness of={other} />)
    expect(view.container.querySelectorAll('[role="tooltip"][data-open]')).toHaveLength(0)
    expect(view.lit()).toHaveLength(0)
  })

  it('answers in the portrait frame as in the landscape one', () => {
    const { button, card, state } = mount('portrait')
    const tie = tall.ties[0]
    act(() => button(`tie:${tie.index}`).focus())
    expect(card().hasAttribute('data-open')).toBe(true)
    expect(state(`[data-tie-key="tie:${tie.index}"]`)).toBe('active')
  })

  it('holds the drawn ties first in the toolbar, rarest first, then each person in turn', () => {
    const { landscape } = mount()
    const keys = [...landscape.querySelectorAll<HTMLButtonElement>('[data-target]')].map((b) => b.dataset.target!)
    expect(keys.slice(0, wide.ties.length)).toEqual(wide.ties.map((t) => `tie:${t.index}`))
    const firstB = keys.findIndex((k) => k.startsWith('b:'))
    expect(keys.slice(wide.ties.length, firstB).every((k) => k.startsWith('a:'))).toBe(true)
    expect(keys.slice(firstB).every((k) => k.startsWith('b:'))).toBe(true)
  })

  it('names each target for whom or what it reads', () => {
    const { button } = mount()
    expect(button(`tie:${guide.index}`).getAttribute('aria-label')).toBe(`Tie, ${tieView(guide.tie).name}: ${tieView(guide.tie).odds}`)
    expect(button('a:planet:sun').getAttribute('aria-label')).toMatch(/^Maya, Sun: /)
  })
})
