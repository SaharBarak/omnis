'use client'

import { Fragment, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import s from './atlas.module.css'
import { percent, SQUARE, type View } from './geometry'
import { focusRingOf, HALO_GAP, hitMark, inView, reachFor, TARGET_MIN_PX, toDrawing, type Linear, type PlacedMark } from './mark-geometry'
import type { InspectEvent } from './inspect'
import kit from '../kit.module.css'
import type { AtlasMarkRef, MarkTitle } from '@/lib/atlas/marks'
import type { AtlasLayerId } from '@/lib/atlas/types'

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

/** The zoom group's live scale: mid-transition, the scale on screen now. */
const liveZoom = (svg: SVGSVGElement): number => {
  const group = svg.querySelector('[data-zoom]')
  return group ? (linearOf(getComputedStyle(group).transform)?.[0] ?? 1) : 1
}

/**
 * The scale the zoom group is heading for: the drawing's `--atlas-zoom`
 * while the stylesheet applies the zoom, otherwise none. Read from CSS, so the
 * breakpoint that turns the zoom on lives in the stylesheet alone.
 */
const settledZoom = (svg: SVGSVGElement): number => {
  const group = svg.querySelector('[data-zoom]')
  if (!group || !linearOf(getComputedStyle(group).transform)) return 1
  return Number(getComputedStyle(svg.parentElement ?? svg).getPropertyValue('--atlas-zoom')) || 1
}

/** Each layer group's live turn, read where the browser has one: a ring still turning to a new date. */
const liveTurns = (svg: SVGSVGElement): Partial<Record<AtlasLayerId, Linear>> =>
  Object.fromEntries(
    Array.from(svg.querySelectorAll<SVGGElement>('g[data-layer]')).flatMap((group) => {
      const turn = linearOf(getComputedStyle(group).transform)
      return turn ? [[group.dataset.layer as AtlasLayerId, turn]] : []
    }),
  )

/** The mark under a pointer event, read through the drawing's live zoom and, where its rings turn, their live turns. */
function markAt<Ref>(svg: SVGSVGElement, marks: readonly PlacedMark<Ref>[], at: { readonly x: number; readonly y: number }, view: View, turns: boolean): PlacedMark<Ref> | null {
  const box = svg.getBoundingClientRect()
  if (box.width === 0) return null
  const zoom = liveZoom(svg)
  return hitMark(marks, { point: toDrawing([at.x, at.y], box, zoom, view), reach: reachFor(box.width, zoom, view), turns: turns ? liveTurns(svg) : undefined })
}

const KEYS: Readonly<Record<string, (index: number, last: number) => number>> = {
  ArrowRight: (i, last) => Math.min(i + 1, last),
  ArrowDown: (i, last) => Math.min(i + 1, last),
  ArrowLeft: (i) => Math.max(i - 1, 0),
  ArrowUp: (i) => Math.max(i - 1, 0),
  Home: () => 0,
  End: (_, last) => last,
}

export interface MarkTargetsProps<Ref = AtlasMarkRef> {
  /** The marks that answer, in reading order. */
  readonly marks: readonly PlacedMark<Ref>[]
  readonly titleOf: (ref: Ref) => MarkTitle | null
  readonly activeKey: string | null
  /** id of the open card, the active button's description. */
  readonly cardId: string
  /** Whether a related target is the card: the pointer moving onto it keeps it open. */
  readonly isInCard: (target: EventTarget | null) => boolean
  readonly onEvent: (event: InspectEvent<Ref>) => void
  /** The pointer or focus arrived: start loading the meanings. */
  readonly onIntent: () => void
  /** The drawing's view box: a person's atlas is the square. */
  readonly view?: View
  /** Whether the drawing's rings turn, so the pointer is read through their live turns. */
  readonly turns?: boolean
  /** The toolbar's name. */
  readonly label?: string
}

/**
 * The atlas's marks as targets (BENTO_SITE.md, "Marks explain themselves").
 * The pointer is read by one nearest-mark layer; the keyboard reaches each
 * mark as a button in a toolbar with a roving tab stop. The buttons only
 * carry focus and names: the pointer passes through them.
 */
export function MarkTargets<Ref = AtlasMarkRef>({
  marks,
  titleOf,
  activeKey,
  cardId,
  isInCard,
  onEvent,
  onIntent,
  view = SQUARE,
  turns = true,
  label = 'Marks on the map',
}: MarkTargetsProps<Ref>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [stop, setStop] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const hintId = useId()
  const reachable = marks.filter((m) => inView(m, zoom, view))
  const tabStop = reachable.some((m) => m.key === stop) ? stop : (reachable[0]?.key ?? null)

  useLayoutEffect(() => {
    const svg = rootRef.current?.parentElement?.querySelector('svg')
    if (!svg) return
    const measure = () => setZoom(settledZoom(svg))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
    return () => observer.disconnect()
  }, [marks])

  const under = (e: PointerEvent | MouseEvent): PlacedMark<Ref> | null => {
    const svg = rootRef.current?.parentElement?.querySelector('svg')
    return svg ? markAt(svg, marks, { x: e.clientX, y: e.clientY }, view, turns) : null
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
    if (!step || reachable.length === 0) return
    e.preventDefault()
    const at = reachable.findIndex((m) => m.key === (e.target as HTMLElement).dataset.target)
    const next = reachable[step(Math.max(at, 0), reachable.length - 1)]
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
      {reachable.length > 0 && (
        <div
          className={s.targetRing}
          role="toolbar"
          aria-label={label}
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
          {reachable.map((m) => {
            const title = titleOf(m.ref)
            if (!title) return null
            const ring = focusRingOf(m)
            return (
              <Fragment key={m.key}>
                <button
                  type="button"
                  className={s.target}
                  data-target={m.key}
                  data-layer={m.layer}
                  data-area={m.area ? '' : undefined}
                  style={{ ...percent(m.anchor, view), '--ring': `${((2 * (m.r + HALO_GAP)) / view.width) * 100}%` } as CSSProperties}
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
                {ring && (
                  <svg className={s.areaRing} viewBox={`0 0 ${view.width} ${view.height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
                    <path d={ring} />
                  </svg>
                )}
              </Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
