'use client'

import { useLayoutEffect, type CSSProperties, type PointerEventHandler, type RefObject } from 'react'
import s from './atlas.module.css'
import { CardBody, type CardHead } from './card-body'
import d from './digest.module.css'
import kit from '../kit.module.css'
import type { MarkReading } from '@/lib/atlas/explain'

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

export interface FactCardProps {
  readonly id: string
  readonly cardRef: RefObject<HTMLDivElement | null>
  /** The anchor name the shown fact carries (`anchor-name`), one per digest. */
  readonly anchor: string
  readonly head: CardHead | null
  readonly reading: MarkReading | null
  readonly open: boolean
  readonly kept: boolean
  readonly onPointerEnter: PointerEventHandler<HTMLDivElement>
  readonly onPointerLeave: PointerEventHandler<HTMLDivElement>
}

/**
 * The card a digest fact opens (BENTO_SITE.md, "Facts explain themselves"):
 * the drawing's card body in a manual popover, so it sits in the top layer
 * and no column clips it. CSS anchor positioning hangs it from the shown
 * fact and flips it to stay in view; no script measures or places it.
 */
export function FactCard({ id, cardRef, anchor, head, reading, open, kept, onPointerEnter, onPointerLeave }: FactCardProps) {
  usePopover(cardRef, open && head !== null)
  return (
    <div
      ref={cardRef}
      id={id}
      popover="manual"
      role="tooltip"
      className={`${d.card} ${s.tokens} ${kit.glass}`}
      style={{ '--fact-anchor': anchor } as CSSProperties}
      data-layer={head?.layer ?? undefined}
      data-kept={kept ? '' : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {head && <CardBody head={head} reading={reading} />}
    </div>
  )
}
