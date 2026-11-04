'use client'

import { useLayoutEffect, type PointerEventHandler, type RefObject } from 'react'
import s from './atlas.module.css'
import { CardBody } from './card-body'
import { C, SIZE, type Point } from './geometry'
import { HALO_GAP, TARGET_MIN_PX, type PlacedMark } from './mark-geometry'
import kit from '../kit.module.css'
import type { MarkReading } from '@/lib/atlas/explain'
import { LAYER_META } from '@/lib/atlas/layers'
import type { MarkTitle } from '@/lib/atlas/marks'

export interface MarkCardProps {
  readonly id: string
  readonly cardRef: RefObject<HTMLDivElement | null>
  /** The mark the card is about: the open one, or the last one while the card leaves. */
  readonly mark: PlacedMark | null
  readonly title: MarkTitle | null
  /** The meaning and facts, once explain.ts has loaded. */
  readonly reading: MarkReading | null
  readonly open: boolean
  readonly kept: boolean
  readonly onPointerEnter: PointerEventHandler<HTMLDivElement>
  readonly onPointerLeave: PointerEventHandler<HTMLDivElement>
}

export interface Size {
  readonly width: number
  readonly height: number
}

const within = (start: number, size: number, room: number): number => Math.min(Math.max(start, 0), Math.max(room - size, 0))

/**
 * Where the card's top-left corner sits in the drawing's square, in px. It
 * hangs from its mark toward the centre on both axes, `gap` off the mark,
 * and is then moved inside the square.
 */
export function placeCard(anchor: Point, card: Size, square: Size, gap: number): Point {
  const x = anchor[0] < square.width / 2 ? anchor[0] + gap : anchor[0] - gap - card.width
  const y = anchor[1] < square.height / 2 ? anchor[1] - gap : anchor[1] + gap - card.height
  return [within(x, card.width, square.width), within(y, card.height, square.height)]
}

/** The card's gap from its mark, in px at the square's width: off the mark's halo, never closer than half the least target. */
export const cardGap = (mark: PlacedMark, width: number): number => Math.max(((mark.r + HALO_GAP) / SIZE) * width, TARGET_MIN_PX / 2)

/**
 * Places the card from layout sizes, which ignore the travel transition, and
 * places it again whenever the card or the square changes size: when the
 * meanings arrive, or the page resizes.
 */
function usePlacement(cardRef: RefObject<HTMLDivElement | null>, mark: PlacedMark | null, open: boolean): void {
  useLayoutEffect(() => {
    const card = cardRef.current
    const square = card?.parentElement
    if (!card || !square || !mark || !open) return
    const place = () => {
      const width = square.clientWidth
      const height = square.clientHeight
      const gap = cardGap(mark, width)
      card.style.setProperty('--gap', `${gap}px`)
      const anchor: Point = [(mark.anchor[0] / SIZE) * width, (mark.anchor[1] / SIZE) * height]
      const [x, y] = placeCard(anchor, { width: card.offsetWidth, height: card.offsetHeight }, { width, height }, gap)
      card.style.setProperty('--at-x', `${x}px`)
      card.style.setProperty('--at-y', `${y}px`)
    }
    place()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(place)
    observer.observe(card)
    observer.observe(square)
    return () => observer.disconnect()
  }, [cardRef, mark, open])
}

/**
 * The card a mark opens (BENTO_SITE.md, "Marks explain themselves"): the
 * layer, what the mark is, the person's value at it as the strong line, then
 * its meaning and facts. It hangs from the mark toward the drawing's centre,
 * and under 720 px docks to the edge away from the mark. Every string is set
 * as text.
 */
export function MarkCard({ id, cardRef, mark, title, reading, open, kept, onPointerEnter, onPointerLeave }: MarkCardProps) {
  usePlacement(cardRef, mark, open)
  if (!mark || !title) return <div ref={cardRef} id={id} role="tooltip" className={`${s.card} ${s.tokens} ${kit.glass}`} hidden />
  const meta = LAYER_META[mark.layer]
  return (
    <div
      ref={cardRef}
      id={id}
      role="tooltip"
      className={`${s.card} ${s.tokens} ${kit.glass}`}
      data-layer={mark.layer}
      data-side={mark.anchor[0] < C ? 'right' : 'left'}
      data-dock={mark.anchor[1] < C ? 'bottom' : 'top'}
      data-open={open ? '' : undefined}
      data-kept={kept ? '' : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <CardBody head={{ layer: mark.layer, eyebrow: `${meta.pin} ${meta.name}`, label: title.label, value: title.value }} reading={reading} />
    </div>
  )
}
