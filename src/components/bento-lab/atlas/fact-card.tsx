'use client'

import { useLayoutEffect, type FocusEventHandler, type KeyboardEventHandler, type PointerEvent, type PointerEventHandler, type ReactNode, type RefObject } from 'react'
import s from './atlas.module.css'
import c from './fact-card.module.css'
import type { InspectEvent } from './inspect'
import kit from '../kit.module.css'
import type { AtlasLayerId } from '@/lib/atlas/types'

/** True where the popover API exists (every evergreen browser; not jsdom). */
const canPop = (el: HTMLElement): boolean => typeof el.showPopover === 'function'

const isOpen = (el: HTMLElement): boolean => {
  try {
    return el.matches(':popover-open')
  } catch {
    return false
  }
}

/** Shows the popover while `open` and hides it after; the stylesheet fades it both ways. */
function usePopover(cardRef: RefObject<HTMLDivElement | null>, open: boolean): void {
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card || !canPop(card)) return
    if (open && !isOpen(card)) card.showPopover()
    if (!open && isOpen(card)) card.hidePopover()
  }, [cardRef, open])
}

/** A name per list of facts for its shown fact's anchor, from React's id: letters and digits only. */
export const anchorName = (id: string): string => `--fact-${id.replace(/[^a-zA-Z0-9]/g, '')}`

/**
 * How a target relates to the card it opens: a short card `describes` its
 * active target (`role="tooltip"`, `aria-describedby`); a board the target
 * `controls` is a disclosure (`aria-expanded`, `aria-controls`), whose
 * structured content is read in order, not as one description.
 */
export type CardRelation = 'describes' | 'controls'

/**
 * What a button that opens a fact's card hands the inspect reducer
 * (BENTO_SITE.md, "Facts explain themselves"): hover previews the card,
 * focus owns it, a press keeps it; a touch opens it by its press alone.
 * `prime` reports the pointer or focus arriving, for cards whose words load
 * late. Only the active target is related to the card.
 */
export function factTarget<Ref>(ref: Ref, active: boolean, cardId: string, send: (event: InspectEvent<Ref>) => void, prime?: () => void, relation: CardRelation = 'describes') {
  return {
    'data-active': active ? '' : undefined,
    ...(relation === 'describes' ? { 'aria-describedby': active ? cardId : undefined } : { 'aria-expanded': active, 'aria-controls': cardId }),
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      prime?.()
      send({ type: 'point', ref })
    },
    onPointerLeave: (e: PointerEvent) => {
      if (e.pointerType !== 'touch') send({ type: 'point', ref: null })
    },
    onFocus: () => {
      prime?.()
      send({ type: 'focus', ref })
    },
    onBlur: () => send({ type: 'blur' }),
    onClick: () => send({ type: 'keep', ref }),
  } as const
}

/** Where the card hangs from its tile: beside it (a column of tiles) or above it (a row). */
export type CardAt = 'side' | 'above'

/** The card's material: frosted glass over the page for a fact's few words, or the page's opaque surface for a board a reader works in. */
export type CardSurface = 'glass' | 'board'

export interface FactCardProps {
  readonly id: string
  readonly cardRef: RefObject<HTMLDivElement | null>
  readonly at: CardAt
  /** The layer whose colour keys a kept card's edge; null beside the map. */
  readonly layer: AtlasLayerId | null
  /** True while the card has words to show and is open. */
  readonly open: boolean
  readonly kept: boolean
  /** As `factTarget`'s relation: a tooltip that describes, or a board a disclosure controls, named by `labelledBy`. */
  readonly relation?: CardRelation
  readonly labelledBy?: string
  /** Glass unless given (BENTO_BOARDS.md "Surface"). */
  readonly surface?: CardSurface
  readonly onPointerEnter: PointerEventHandler<HTMLDivElement>
  readonly onPointerLeave: PointerEventHandler<HTMLDivElement>
  /** For a board a pointer works in: a press inside it keeps it. */
  readonly onPointerDown?: PointerEventHandler<HTMLDivElement>
  /** For a board a keyboard enters: where Tab goes from it, and whether focus is inside it. */
  readonly onKeyDown?: KeyboardEventHandler<HTMLDivElement>
  readonly onFocus?: FocusEventHandler<HTMLDivElement>
  readonly onBlur?: FocusEventHandler<HTMLDivElement>
  readonly children?: ReactNode
}

/**
 * The card a fact opens (BENTO_SITE.md, "Facts explain themselves"): what
 * its list puts in it (a card body, a calendar's board) in a manual popover,
 * so it sits in the top layer and no column clips it. CSS anchor positioning
 * hangs it from the item holding the shown fact, never over that item (the
 * list sets `--fact-anchor`, which the card inherits), and flips it to stay
 * in view; no script measures or places it. A board can take focus, so a
 * keyboard can scroll it where it docks.
 */
export function FactCard({ id, cardRef, at, layer, open, kept, relation = 'describes', labelledBy, surface = 'glass', onPointerEnter, onPointerLeave, onPointerDown, onKeyDown, onFocus, onBlur, children }: FactCardProps) {
  usePopover(cardRef, open)
  return (
    <div
      ref={cardRef}
      id={id}
      popover="manual"
      {...(relation === 'describes' ? { role: 'tooltip' } : { role: 'group', 'aria-labelledby': labelledBy, tabIndex: -1 })}
      className={`${c.card} ${s.tokens} ${surface === 'board' ? c.board : kit.glass}`}
      data-surface={surface}
      data-at={at}
      data-layer={layer ?? undefined}
      data-kept={kept ? '' : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {children}
    </div>
  )
}
