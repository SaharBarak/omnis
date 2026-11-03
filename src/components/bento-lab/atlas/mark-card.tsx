'use client'

import { useLayoutEffect, type CSSProperties, type PointerEventHandler, type RefObject } from 'react'
import s from './atlas.module.css'
import { C, percent, SIZE } from './geometry'
import { HALO_GAP, TARGET_MIN_PX, type PlacedMark } from './mark-geometry'
import kit from '../kit.module.css'
import { LAYER_META } from '@/lib/atlas/layers'
import type { MarkTitle } from '@/lib/atlas/marks'
import type { MarkFact } from '@/lib/atlas/explain'

export interface MarkReading {
  readonly meaning: string | null
  readonly facts: readonly MarkFact[]
}

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
  readonly onPointerLeave: PointerEventHandler<HTMLDivElement>
}

/** Shifts the card back inside the drawing's square when its natural place would cross an edge. */
function useInside(cardRef: RefObject<HTMLDivElement | null>, open: boolean, key: string | null): void {
  useLayoutEffect(() => {
    const card = cardRef.current
    const square = card?.parentElement
    if (!card || !square || !open) return
    card.style.removeProperty('--nudge-x')
    card.style.removeProperty('--nudge-y')
    const c = card.getBoundingClientRect()
    const q = square.getBoundingClientRect()
    const shift = (lo: number, hi: number, min: number, max: number) => (lo < min ? min - lo : hi > max ? max - hi : 0)
    card.style.setProperty('--nudge-x', `${shift(c.left, c.right, q.left, q.right)}px`)
    card.style.setProperty('--nudge-y', `${shift(c.top, c.bottom, q.top, q.bottom)}px`)
  }, [cardRef, open, key])
}

/**
 * The card a mark opens (BENTO_SITE.md, "Marks explain themselves"): the
 * layer, what the mark is, the person's value at it as the strong line, then
 * its meaning and facts. It hangs from the mark toward the drawing's centre,
 * and under 720 px docks to the edge away from the mark. Every string is set
 * as text.
 */
export function MarkCard({ id, cardRef, mark, title, reading, open, kept, onPointerLeave }: MarkCardProps) {
  useInside(cardRef, open, mark?.key ?? null)
  if (!mark || !title) return <div ref={cardRef} id={id} role="tooltip" className={`${s.card} ${s.tokens} ${kit.glass}`} hidden />
  const meta = LAYER_META[mark.layer]
  const at = percent(mark.anchor)
  const style = {
    '--x': at.left,
    '--y': at.top,
    '--halo': String((mark.r + HALO_GAP) / SIZE),
    '--target': `${TARGET_MIN_PX}px`,
  } as CSSProperties
  return (
    <div
      ref={cardRef}
      id={id}
      role="tooltip"
      className={`${s.card} ${s.tokens} ${kit.glass}`}
      style={style}
      data-layer={mark.layer}
      data-side={mark.anchor[0] < C ? 'right' : 'left'}
      data-drop={mark.anchor[1] < C ? 'down' : 'up'}
      data-dock={mark.anchor[1] < C ? 'bottom' : 'top'}
      data-open={open ? '' : undefined}
      data-kept={kept ? '' : undefined}
      onPointerLeave={onPointerLeave}
    >
      <span className={s.cardEyebrow} data-layer={mark.layer}>
        {meta.pin} {meta.name}
      </span>
      <span className={s.cardLabel}>{title.label}</span>
      <strong className={s.cardValue}>{title.value}</strong>
      {reading?.meaning && <span className={s.cardMeaning}>{reading.meaning}</span>}
      {reading && reading.facts.length > 0 && (
        <dl className={s.cardFacts}>
          {reading.facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
