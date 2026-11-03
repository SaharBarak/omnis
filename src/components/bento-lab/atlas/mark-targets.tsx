'use client'

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import s from './atlas.module.css'
import { percent, SIZE } from './geometry'
import { HALO_GAP, hitMark, reachFor, TARGET_MIN_PX, toDrawing, type Linear, type PlacedMark } from './mark-geometry'
import type { InspectEvent } from './inspect'
import kit from '../kit.module.css'
import type { AtlasMarkRef, MarkTitle } from '@/lib/atlas/marks'
import type { AtlasLayerId } from '@/lib/atlas/types'

/** The rings that turn on a new date (useTurn), read live so a turning ring is hit where it shows. */
const TURNING: readonly AtlasLayerId[] = ['sky', 'maya']

/** Whether an event's related target sits inside `container`; a target outside the document, or none, does not. */
export const holds = (container: Element | null | undefined, target: EventTarget | null | undefined): boolean =>
  target instanceof Node && (container?.contains(target) ?? false)

/** The linear part of a computed `transform`; null at rest. */
export const linearOf = (transform: string): Linear | null => {
  const values = transform.match(/matrix(3d)?\(([^)]+)\)/)
  if (!values) return null
  const n = values[2].split(',').map(Number)
  return values[1] ? [n[0], n[1], n[4], n[5]] : [n[0], n[1], n[2], n[3]]
}

/** The mark under a pointer event, read through the drawing's live zoom and ring turns. */
function markAt(svg: SVGSVGElement, marks: readonly PlacedMark[], clientX: number, clientY: number): PlacedMark | null {
  const box = svg.getBoundingClientRect()
  if (box.width === 0) return null
  const zoomGroup = svg.querySelector('[data-zoom]')
  const zoom = zoomGroup ? (linearOf(getComputedStyle(zoomGroup).transform)?.[0] ?? 1) : 1
  const turns = Object.fromEntries(
    TURNING.flatMap((layer) => {
      const group = svg.querySelector(`g[data-layer="${layer}"]`)
      const turn = group ? linearOf(getComputedStyle(group).transform) : null
      return turn ? [[layer, turn]] : []
    }),
  )
  return hitMark(marks, { point: toDrawing([clientX, clientY], box, zoom), reach: reachFor(box.width, zoom), turns })
}

const KEYS: Readonly<Record<string, (index: number, last: number) => number>> = {
  ArrowRight: (i, last) => Math.min(i + 1, last),
  ArrowDown: (i, last) => Math.min(i + 1, last),
  ArrowLeft: (i) => Math.max(i - 1, 0),
  ArrowUp: (i) => Math.max(i - 1, 0),
  Home: () => 0,
  End: (_, last) => last,
}

export interface MarkTargetsProps {
  /** The marks that answer, in reading order. */
  readonly marks: readonly PlacedMark[]
  readonly titleOf: (ref: AtlasMarkRef) => MarkTitle | null
  readonly activeKey: string | null
  /** id of the open card, the active button's description. */
  readonly cardId: string
  /** Whether a related target is the card: the pointer moving onto it keeps it open. */
  readonly isInCard: (target: EventTarget | null) => boolean
  readonly onEvent: (event: InspectEvent) => void
  /** The pointer or focus arrived: start loading the meanings. */
  readonly onIntent: () => void
}

/**
 * The atlas's marks as targets (BENTO_SITE.md, "Marks explain themselves").
 * The pointer is read by one nearest-mark layer; the keyboard reaches each
 * mark as a button in a toolbar with a roving tab stop. The buttons only
 * carry focus and names: the pointer passes through them.
 */
export function MarkTargets({ marks, titleOf, activeKey, cardId, isInCard, onEvent, onIntent }: MarkTargetsProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [stop, setStop] = useState<string | null>(null)
  const hintId = useId()
  const tabStop = marks.some((m) => m.key === stop) ? stop : (marks[0]?.key ?? null)

  const under = (e: PointerEvent | MouseEvent): PlacedMark | null => {
    const svg = rootRef.current?.parentElement?.querySelector('svg')
    return svg ? markAt(svg, marks, e.clientX, e.clientY) : null
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    const mark = under(e)
    e.currentTarget.toggleAttribute('data-hot', mark !== null)
    onEvent({ type: 'point', ref: mark?.ref ?? null })
  }

  const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.removeAttribute('data-hot')
    if (isInCard(e.relatedTarget)) return
    onEvent({ type: 'point', ref: null })
  }

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const mark = under(e)
    onEvent(mark ? { type: 'keep', ref: mark.ref } : { type: 'dismiss' })
  }

  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = KEYS[e.key]
    if (!step || marks.length === 0) return
    e.preventDefault()
    const at = marks.findIndex((m) => m.key === (e.target as HTMLElement).dataset.target)
    const next = marks[step(Math.max(at, 0), marks.length - 1)]
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-target="${next.key}"]`)?.focus()
  }

  return (
    <div
      ref={rootRef}
      className={s.targets}
      style={{ '--target': `${TARGET_MIN_PX}px` } as CSSProperties}
      onPointerEnter={onIntent}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {marks.length > 0 && (
        <div
          className={s.targetRing}
          role="toolbar"
          aria-label="Marks on the map"
          aria-describedby={hintId}
          onKeyDown={move}
          onFocus={onIntent}
          onBlur={(e) => {
            if (!holds(e.currentTarget, e.relatedTarget)) onEvent({ type: 'blur' })
          }}
        >
          <span id={hintId} className={kit.srOnly}>
            Arrow keys move between marks. Enter keeps a card open; Escape closes it.
          </span>
          {marks.map((m) => {
            const title = titleOf(m.ref)
            if (!title) return null
            return (
              <button
                key={m.key}
                type="button"
                className={s.target}
                data-target={m.key}
                data-layer={m.layer}
                style={{ ...percent(m.anchor), '--ring': `${((2 * (m.r + HALO_GAP)) / SIZE) * 100}%` } as CSSProperties}
                tabIndex={m.key === tabStop ? 0 : -1}
                aria-label={`${title.label}: ${title.value}`}
                aria-describedby={activeKey === m.key ? cardId : undefined}
                onFocus={() => {
                  setStop(m.key)
                  onEvent({ type: 'focus', ref: m.ref })
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onEvent({ type: 'keep', ref: m.ref })
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
