import type { CSSProperties } from 'react'
import c from './cycle-cells.module.css'
import f from './frame/frame.module.css'
import { beat } from '@/components/bento-lab/motion/loops'

/** A cycle drawn as cells: how many units, today's place (1 first), cells per row, empty cells before the first, and whether each carries its number. */
export interface CycleCellsProps {
  readonly cells: number
  readonly today: number
  readonly columns?: number
  readonly offset?: number
  readonly numbered?: boolean
  readonly className?: string
}

/**
 * A cycle as cells (BENTO_V2.md "Kin tile", "Rows open their calendar's
 * board"): one per unit, in the host's colour, the past filled and today
 * marked with the status pulse (BENTO_MOTION.md "Loops"). The pulse runs on
 * a ring round today's cell, never on its fill or its number, so the number
 * keeps one contrast and no text is looped. Laid in rows of
 * `columns` after `offset` empty cells, as a month starts on its first
 * weekday. Drawn for the eye: the host says the place in words.
 */
export function CycleCells({ cells, today, columns = cells, offset = 0, numbered = false, className }: CycleCellsProps) {
  return (
    <span className={[c.cells, className].filter(Boolean).join(' ')} style={{ '--columns': columns } as CSSProperties} data-numbered={numbered ? '' : undefined} aria-hidden>
      {Array.from({ length: offset }, (_, i) => (
        <i key={`before-${i}`} data-day="none" />
      ))}
      {Array.from({ length: cells }, (_, i) => {
        const n = i + 1
        const day = n === today ? 'today' : n < today ? 'past' : undefined
        return (
          <i key={n} data-day={day}>
            {day === 'today' && (
              <>
                <b className={c.fill} />
                <b className={`${c.ring} ${f.beat}`} {...beat} />
              </>
            )}
            {numbered && <span className={c.n}>{n}</span>}
          </i>
        )
      })}
    </span>
  )
}
