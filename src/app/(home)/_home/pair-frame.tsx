'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { EDGE_CEILING } from '@pleiad/engine/services/rarity'
import p from './pair-frame.module.css'
import { Hung, Notch, kit } from '@/components/bento-lab'
import atlas from '@/components/bento-lab/atlas/atlas.module.css'
import { PairStage, usePairControl } from '@/components/bento-lab/atlas/pair-stage'
import { PrimaryAction } from '@/components/bento-lab/site'
import { RISE_TARGETS, drawLines, frame as f, groundProps, plateIn, rise, useScrollScene, type LineStep } from '@/components/bento-v2'
import type { PairAtlas } from '@/lib/atlas/types'
import { V2_MOTION, V2_SCENES } from '@/lib/design/v2-scenes'
import type { V2Home } from '@/lib/site/v2-home'
import { v2Href } from '@/lib/site/v2-routes'

const PERCENT = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 })
const GROUND = groundProps('pair', `${f.frame} ${f.banded}`)

/** The bits a tie bar fills at most: the rarest tie listed sets the scale. */
const scaleOf = (ties: V2Home['pair']['ties']): number => Math.max(1, ...ties.map((t) => t.bits))

/** The drawing's ties by rank, rarest first; both orientations' copies of a rank draw together. */
const tieRanks = (root: Element): readonly LineStep[] => {
  const ranks = new Set([...root.querySelectorAll<SVGElement>('[data-tie]')].map((g) => g.dataset.tie ?? ''))
  return [...ranks]
    .sort((a, b) => Number(a) - Number(b))
    .map((rank) => ({
      lines: [...root.querySelectorAll(`[data-tie="${rank}"] [data-tie-line]`)],
      marks: [...root.querySelectorAll(`[data-tie="${rank}"] [data-tie-end], [data-tie="${rank}"] [data-tie-label]`)],
    }))
}

export interface PairFrameProps {
  readonly home: V2Home
  /** The id the drawing's description points at: the frame's tie list. */
  readonly tiesId: string
  /** The example pair's atlas: every mark and tie on its drawing answers. */
  readonly pair: PairAtlas
}

/**
 * Two people (BENTO_V2.md "Home" 4): what two maps share. The focus is the
 * bento kit's live pair stage, two maps with a line for every tie rare
 * enough to draw, every mark and tie answering with a card; on the plate
 * beside it the pair and its rarity, which ties get a line, the rarest ties
 * weighed in bits, each row one control with its tie, and the action. The
 * lines draw in rarest first as it enters; once they land, their currents run.
 */
export function PairFrame({ home, tiesId, pair }: PairFrameProps) {
  const control = usePairControl(pair)
  const [landed, setLanded] = useState(false)
  const { listRef, rowProps, rowButtonProps } = control
  const scene = useScrollScene<HTMLElement>((scope) => {
    plateIn(scope, V2_SCENES.plateIn, V2_MOTION.plateFrom)
    rise(scope, V2_SCENES.tilesIn, [...scope.root.querySelectorAll(RISE_TARGETS)])
    drawLines(scope, V2_SCENES.linesIn, tieRanks(scope.root), () => setLanded(true))
  })
  const [a, b] = home.pair.people
  const bitsScale = scaleOf(home.pair.ties)

  return (
    <section ref={scene} id="pair" className={f.band} aria-labelledby="v2-pair-title">
      <div {...GROUND}>
        <div className={`${f.panel} ${f.art} ${kit.starfield} ${atlas.tokens} ${f.figureStage}`}>
          <Notch corner="tl" className={`${f.figureTitle} ${f.notchStack}`}>
            <h2 id="v2-pair-title" className={`${f.title} ${f.titleDisplay}`}>
              <Hung className={f.line}>Two people,</Hung>
              <Hung className={f.bright}>their rare ties drawn</Hung>
            </h2>
          </Notch>
          <div className={f.drawingSlot}>
            <PairStage control={control} currents={landed} describedBy={tiesId} />
          </div>
        </div>

        <div className={f.wall}>
          <div className={p.head} data-tile>
            <p className={f.eyebrow}>
              {a.name} and {b.name} · rarity {home.pair.rarity} of 100
            </p>
            <p className={f.lead}>
              A tie gets a line only when fewer than {PERCENT.format(EDGE_CEILING)} of random pairs share it. The thicker the line, the more it says about these two.
            </p>
          </div>
          <ol ref={listRef} id={tiesId} className={f.wallList} data-tiles>
            {home.pair.ties.map((tie) => (
              <li key={tie.index} {...rowProps(tie.index)}>
                <button className={p.tie} {...rowButtonProps(tie.index)}>
                  <span className={p.tieName}>{tie.name}</span>
                  <span className={f.caption}>{tie.system}</span>
                  <span className={p.bar} aria-hidden>
                    <i style={{ transform: `scaleX(${tie.bits / bitsScale})` }} />
                  </span>
                  <span className={p.odds}>{tie.odds}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className={`${f.caption} ${p.verified}`} data-tile>
            <Check size={14} aria-hidden /> Weighed by measured base rates
          </p>
          <div className={f.columnEnd} data-tile>
            <PrimaryAction href={v2Href('/pair')} intent="forward">
              Map two people
            </PrimaryAction>
          </div>
        </div>
      </div>
    </section>
  )
}
