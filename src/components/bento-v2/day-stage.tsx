'use client'

import { useRef, useState } from 'react'
import { BoardFace } from './day-board'
import t from './day-stage.module.css'
import { useFit } from './use-fit'
import atlas from '@/components/bento-lab/atlas/atlas.module.css'
import { useMotionAllowed } from '@/components/bento-lab/motion/use-motion-allowed'
import type { V2DayRow } from '@/lib/site/v2-day'

/** A calendar on the stage: arriving, or leaving until its exit has played. */
interface Staged {
  readonly id: number
  readonly row: V2DayRow
  readonly leaving: boolean
}

/** The faces after the stage is given `row`: those there leave (at once where no exit plays), and the row arrives. */
export const restage = (faces: readonly Staged[], row: V2DayRow | null, id: number, exits: boolean): readonly Staged[] => [
  ...(exits ? faces.map((face) => (face.leaving ? face : { ...face, leaving: true })) : []),
  ...(row ? [{ id, row, leaving: false }] : []),
]

/** One face, fitted to the stage as one figure. */
function Face({ face, onGone }: { readonly face: Staged; readonly onGone: (id: number) => void }) {
  const room = useRef<HTMLDivElement>(null)
  const figure = useRef<HTMLDivElement>(null)
  useFit(room, figure)
  return (
    <div
      ref={room}
      className={t.face}
      data-leaving={face.leaving ? '' : undefined}
      onAnimationEnd={(e) => {
        if (face.leaving && e.target === e.currentTarget) onGone(face.id)
      }}
    >
      <div ref={figure} className={t.figure}>
        <BoardFace row={face.row} />
      </div>
    </div>
  )
}

/**
 * The stage (BENTO_V2.md "The stage"): the calendar of the row under the
 * pointer, drawn as one figure in the room its caller gives (`className`
 * places it), in place of a card over the page. A face arrives as the one
 * before it leaves; with motion off the exchange is a cut. A figure only:
 * inert and hidden from assistive technology, since focus and a press open
 * the same calendar's board; while it holds a calendar the pointer can rest
 * on it (WCAG 1.4.13).
 */
export function DayStage({
  row,
  className,
  onPointerEnter,
  onPointerLeave,
}: {
  readonly row: V2DayRow | null
  readonly className?: string
  /** The pointer reaching and leaving the calendar shown, for the owner's hover grace (`useStage`'s `hold` and `release`). */
  readonly onPointerEnter?: () => void
  readonly onPointerLeave?: () => void
}) {
  const exits = useMotionAllowed()
  const [held, setHeld] = useState<{ readonly row: V2DayRow | null; readonly faces: readonly Staged[]; readonly count: number }>({ row: null, faces: [], count: 0 })
  if (held.row !== row) setHeld({ row, faces: restage(held.faces, row, held.count, exits), count: held.count + 1 })
  const gone = (id: number) => setHeld((now) => ({ ...now, faces: now.faces.filter((face) => face.id !== id) }))
  const shown = exits ? held.faces : held.faces.filter((face) => !face.leaving)
  return (
    <div className={[t.stage, atlas.tokens, className].filter(Boolean).join(' ')} data-held={row ? '' : undefined} aria-hidden onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <div className={t.faces} inert>
        {shown.map((face) => (
          <Face key={face.id} face={face} onGone={gone} />
        ))}
      </div>
    </div>
  )
}
