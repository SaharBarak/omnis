'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useReducer, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { anchorName, factTarget } from '@/components/bento-lab/atlas/fact-card'
import { createInspect, IDLE } from '@/components/bento-lab/atlas/inspect'
import { useDismiss } from '@/components/bento-lab/atlas/use-dismiss'
import { useGrace } from '@/components/bento-lab/atlas/use-grace'

/** The elements inside `root` that Tab stops at, in order. */
const tabStops = (root: HTMLElement): readonly HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]')].filter((el) => el.tabIndex >= 0 && isShown(el))

/** Whether an element is shown: a fitted list hides the rows it has no room for. */
export const isShown = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && (typeof el.checkVisibility !== 'function' || el.checkVisibility({ visibilityProperty: true }))

/**
 * A caller's stage, as an opener list sees it (BENTO_V2.md "The stage"):
 * where the key under the pointer is drawn in place of a card, and who is
 * told while this list's board is open, so no stage shows beside a board.
 */
export interface StagePort<K> {
  readonly preview: (key: K | null) => void
  readonly busy: (owner: string, open: boolean) => void
}

/** What the openers are: their keys, and the caller's key for whatever else moves them; a new one closes the board. */
const openersKey = (keys: readonly string[], closeKey: string | undefined): string => `${keys.join(' ')}|${closeKey ?? ''}`

/**
 * Openers of one board card (BENTO_V2.md "Rows open their calendar's
 * board"): the day rows, the kin tile. Each opener is a disclosure of the
 * card; hover previews it, focus owns it, a press keeps it, and so does a
 * press inside it. Enter keeps it and moves focus into it; Tab moves through
 * its controls, then on to the next shown opener (or past the openers,
 * closing it), Shift+Tab before its first goes back to its own opener, and
 * Escape hands focus back to the opener. New keys, or a new `closeKey`,
 * close it, handing focus back to an opener if it was inside.
 *
 * With `stage` the caller has a stage (BENTO_V2.md "The stage"): a
 * pointer over an opener reports its key there, and null as it leaves, and
 * hover opens no card; the stage hears while the board is open, and a touch
 * previews nothing.
 */
export function useBoardDisclosure<K extends string>(keys: readonly K[], closeKey?: string, stage?: StagePort<K>) {
  const id = useId()
  const cardId = `${id}-card`
  const openerId = useCallback((key: K): string => `${id}-${key}`, [id])
  const [inspect] = useState(() => createInspect<K>((key) => key))
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  /** Set while focus is handed back to an opener, so its arriving does not open the board again. */
  const returning = useRef(false)
  /** Set by a keyboard press on an opener, so the board it keeps takes focus once shown. */
  const entering = useRef(false)
  const [state, dispatch] = useReducer(inspect, IDLE)
  const seenKey = openersKey(keys, closeKey)
  const [seen, setSeen] = useState(seenKey)
  const [inBoard, setInBoard] = useState(false)
  const [refocus, setRefocus] = useState<{ readonly key: K } | null>(null)
  if (seen !== seenKey) {
    setSeen(seenKey)
    setRefocus(inBoard && state.shown !== null ? { key: state.shown } : null)
    dispatch({ type: 'reset' })
  }
  const { send, hold } = useGrace(dispatch)
  const shown = state.shown !== null && keys.includes(state.shown) ? state.shown : null
  const open = state.active !== null && shown !== null

  const busy = stage?.busy
  useEffect(() => {
    if (!busy || !open) return
    busy(id, true)
    return () => busy(id, false)
  }, [busy, id, open])

  /** Focus an opener without its arriving opening the board; the first shown opener where that one is gone or hidden. */
  const focusOpener = useCallback(
    (key: K) => {
      const opener = document.getElementById(openerId(key))
      const target = isShown(opener) ? opener : ([...(rootRef.current?.querySelectorAll('button[aria-controls]') ?? [])].find(isShown) ?? null)
      returning.current = true
      target?.focus()
      returning.current = false
    },
    [openerId],
  )
  const returnFocus = useCallback(() => {
    if (state.shown !== null) focusOpener(state.shown)
  }, [focusOpener, state.shown])
  useDismiss(open, state.kept, dispatch, rootRef, cardRef, returnFocus)

  useLayoutEffect(() => {
    if (refocus) focusOpener(refocus.key)
  }, [refocus, focusOpener])

  useEffect(() => {
    if (!entering.current) return
    entering.current = false
    if (open && state.kept) cardRef.current?.focus({ preventScroll: true })
  }, [open, state.kept, state.shown])

  /** Tab past the board's last control goes on to the next shown opener, or past the openers, closing it; Shift+Tab before its first goes back to its opener. */
  const leaveBoard = (e: KeyboardEvent) => {
    const card = cardRef.current
    if (e.key !== 'Tab' || shown === null || !card) return
    const stops = tabStops(card)
    const at = document.activeElement
    const edge = e.shiftKey ? at === card || at === stops[0] : stops.length === 0 || at === stops[stops.length - 1]
    if (!edge) return
    /* Every edge is moved by hand: the board may close under the focus before the browser's own move would run. */
    e.preventDefault()
    if (e.shiftKey) {
      focusOpener(shown)
      return
    }
    const next = keys[keys.indexOf(shown) + 1]
    const opener = next ? document.getElementById(openerId(next)) : null
    if (isShown(opener)) {
      opener.focus()
      return
    }
    const past = tabStops(document.body).find((el) => !card.contains(el) && !rootRef.current?.contains(el) && card.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
    dispatch({ type: 'dismiss' })
    past?.focus()
  }

  /** The props of the button that opens `key`'s board. */
  const opener = (key: K) => {
    const target = factTarget(key, key === state.active, cardId, send, undefined, 'controls')
    const staged = stage
      ? {
          onPointerEnter: (e: PointerEvent) => {
            if (e.pointerType !== 'touch') stage.preview(key)
          },
          onPointerLeave: () => stage.preview(null),
        }
      : null
    return {
      ...target,
      ...staged,
      id: openerId(key),
      type: 'button' as const,
      onFocus: () => {
        if (!returning.current) target.onFocus()
      },
      onClick: (e: MouseEvent) => {
        entering.current = e.detail === 0
        target.onClick()
      },
    }
  }

  return {
    rootRef,
    shown,
    /** The root's style: the anchor name the card hangs from, set on the shown opener's box (`data-anchor`). */
    anchorStyle: { '--fact-anchor': anchorName(id) } as CSSProperties,
    isAnchor: (key: K): boolean => key === shown,
    opener,
    /** Closes the board from inside it (its close button), handing focus back to its opener. */
    close: () => {
      const was = shown
      dispatch({ type: 'dismiss' })
      if (was !== null) focusOpener(was)
    },
    /** The props of the `FactCard` the openers share. */
    card: {
      id: cardId,
      cardRef,
      open,
      kept: state.kept,
      relation: 'controls' as const,
      surface: 'board' as const,
      labelledBy: shown !== null ? openerId(shown) : undefined,
      onPointerEnter: hold,
      onPointerLeave: () => send({ type: 'point', ref: null }),
      onPointerDown: () => {
        if (shown !== null && !state.kept) dispatch({ type: 'keep', ref: shown })
      },
      onKeyDown: leaveBoard,
      onFocus: () => setInBoard(true),
      onBlur: () => setInBoard(false),
    },
  }
}
