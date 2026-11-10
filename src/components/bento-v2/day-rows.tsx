'use client'

import type { CSSProperties } from 'react'
import { DayBoardBody } from './day-board'
import d from './day.module.css'
import f from './frame/frame.module.css'
import { useBoardDisclosure } from './use-board-disclosure'
import { FactCard } from '@/components/bento-lab/atlas/fact-card'
import { DayArtwork } from '@/components/bento-lab/blocks/board-art'
import kit from '@/components/bento-lab/kit.module.css'
import { beat } from '@/components/bento-lab/motion/loops'
import type { V2DayRow } from '@/lib/site/v2-day'
import type { DayCycle } from '@/lib/today-figures'

/** A row's colour, and where its day stands in its cycle as a share from 0 to 1. */
const rowStyle = (tone: string, cycle: DayCycle | undefined): CSSProperties =>
  ({ '--tile': `var(${tone})`, ...(cycle ? { '--at': cycle.at / cycle.of } : {}) }) as CSSProperties

/** The row's rule: its cycle drawn to the day, the day a dot that beats, or a plain rule where the value has no cycle. */
function Track({ cycle }: { readonly cycle: DayCycle | undefined }) {
  if (!cycle) return <span className={d.track} aria-hidden />
  return (
    <span className={d.track} aria-hidden>
      <i className={d.ink} />
      <i className={`${d.now} ${f.beat}`} {...beat} />
    </span>
  )
}

/**
 * The day across the calendars (BENTO_V2.md "Day rows", "Cycle tracks",
 * "Rows open their calendar's board"): a ruled list. Each row is the
 * engine's drawing of its value in one square slot, its calendar's name,
 * then the value and what it is on one line; its rule is the value's place
 * in its cycle, drawn to the day, so every row's dot stands in one column:
 * where each calendar is today. A row the engine draws no figure for is its
 * value under its calendar's name, over a plain rule. The track is drawn for
 * the eye; its place is read aloud with the row.
 *
 * Every row is a disclosure that opens its calendar's board, as a digest
 * fact opens its card: hover previews it, focus owns it, a press keeps it,
 * and so does a press inside it. Enter keeps it and moves focus into it;
 * Tab moves through its controls, then on to the next row, Shift+Tab before
 * its first goes back to its own, and Escape hands focus back to the row.
 * The list holds one board, hung from the row it shows; the row under it
 * steps forward. New rows, or a new `closeKey`, close it, handing focus back
 * to a row if it was inside.
 *
 * `fit` rows take the room their panel gives them without sizing it, and
 * show the whole rows that fit, in order.
 */
export function DayRows({
  rows,
  fit = false,
  closeKey,
  className,
}: {
  readonly rows: readonly V2DayRow[]
  readonly fit?: boolean
  readonly closeKey?: string
  readonly className?: string
}) {
  const fields = rows.map((row) => row.field)
  const { rootRef, shown: shownField, anchorStyle, isAnchor, opener, card, close } = useBoardDisclosure(fields, closeKey)
  const shown = rows.find((row) => row.field === shownField) ?? null

  return (
    <div ref={rootRef} className={d.list} style={anchorStyle}>
      <div role="list" className={[d.rows, fit ? d.fit : '', className].filter(Boolean).join(' ')}>
        {rows.map((row) => (
          <div key={row.field} className={d.slot} data-anchor={isAnchor(row.field) ? '' : undefined}>
            <div role="listitem" className={d.item}>
              <button className={d.row} data-art={row.face?.art.kind} style={rowStyle(row.tone, row.face?.cycle)} {...opener(row.field)}>
                <span className={d.art} aria-hidden>
                  {row.face ? <DayArtwork art={row.face.art} /> : <i className={d.dot} />}
                </span>
                <span className={d.text}>
                  <span className={d.label}>{row.label}</span>
                  <span className={d.line}>
                    <span className={d.value}>{row.face?.big ?? row.value}</span>
                    {row.face && <span className={d.meaning}>{row.face.small}</span>}
                  </span>
                  {row.face?.cycle && <span className={kit.srOnly}>, {row.face.cycle.said}</span>}
                </span>
                <Track cycle={row.face?.cycle} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <FactCard at="side" layer={null} {...card}>
        {shown && <DayBoardBody key={shown.field} row={shown} onClose={close} />}
      </FactCard>
    </div>
  )
}
