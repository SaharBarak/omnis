'use client'

import { useMemo, type ReactNode } from 'react'
import { CycleCells } from './cycle-cells'
import { DayBoardBody } from './day-board'
import k from './kin.module.css'
import f from './frame/frame.module.css'
import { useBoardDisclosure, type StagePort } from './use-board-disclosure'
import { GlyphDisc, Hung } from '@/components/bento-lab'
import { FactCard } from '@/components/bento-lab/atlas/fact-card'
import { BarDot } from '@/components/bento-lab/blocks/board-art'
import type { V2DayRow } from '@/lib/site/v2-day'
import type { V2Kin } from '@/lib/site/v2-home'

const KIN = ['kin'] as const

/** The kin's number, its tone and name, its words and its place in the wavespell: what the tile shows, and what opens its board. */
function KinBody({ kin }: { readonly kin: V2Kin }) {
  const { wave } = kin
  return (
    <>
      <span className={k.main}>
        <Hung className={`${f.numeral} ${k.numeral}`} figures="tabular">
          {kin.kin}
        </Hung>
        <span className={k.name}>
          <BarDot n={kin.tone} className={k.tone} />
          <Hung className={k.title}>{kin.name}</Hung>
          <span className={k.words}>
            {kin.power} · {kin.action}
          </span>
        </span>
      </span>
      <span className={k.wave}>
        <CycleCells cells={wave.length} today={wave.day} className={k.cells} />
        <span className={k.waveText}>
          Day {wave.day} of {wave.length}, {wave.name}: {wave.theme}
        </span>
      </span>
    </>
  )
}

/**
 * A day's kin on the gold tile (BENTO_V2.md "Kin tile"): its number, the
 * tone as a bar-and-dot numeral beside its name, the words the affirmation
 * gives it (the seal's power, the tone's action), the seal's glyph, and the
 * day's place in its thirteen-day wavespell as a row of squares, today's
 * beating while it is on screen (BENTO_MOTION.md "Loops", status pulse).
 *
 * Where the kin carries its board (`kin.row`), the tile is a disclosure of
 * it, as each day row is of its calendar's (BENTO_BOARDS.md "The kin's
 * board"): hover previews it, focus owns it, a press keeps it; Enter moves
 * focus into it and Escape hands it back. The head stays outside the
 * button, so the live pill and the glyph are not read as its name. With
 * `stage` the caller has a stage (BENTO_V2.md "The stage"): the tile
 * under the pointer is drawn there and hover opens no board.
 */
export function KinFace({
  kin,
  head,
  closeKey,
  stage,
}: {
  readonly kin: V2Kin
  readonly head?: ReactNode
  readonly closeKey?: string
  readonly stage?: StagePort<V2DayRow>
}) {
  const row = kin.row
  const port = useMemo(() => (stage && row ? { preview: (key: 'kin' | null) => stage.preview(key ? row : null), busy: stage.busy } : undefined), [stage, row])
  const { rootRef, shown, anchorStyle, isAnchor, opener, card, close } = useBoardDisclosure(row ? KIN : [], closeKey, port)
  return (
    <div ref={rootRef} className={k.tile} style={anchorStyle}>
      <div className={k.head}>
        {head}
        <GlyphDisc src={kin.seal.src} />
      </div>
      {kin.row ? (
        <>
          <button className={k.open} data-anchor={isAnchor('kin') ? '' : undefined} {...opener('kin')}>
            <KinBody kin={kin} />
          </button>
          <FactCard at="side" layer={null} {...card}>
            {shown && <DayBoardBody row={kin.row} onClose={close} />}
          </FactCard>
        </>
      ) : (
        <div className={k.open}>
          <KinBody kin={kin} />
        </div>
      )}
    </div>
  )
}
