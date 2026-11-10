'use client'

import type { ReactNode } from 'react'
import c from './circle-frame.module.css'
import { Hung, Notch, kit } from '@/components/bento-lab'
import atlas from '@/components/bento-lab/atlas/atlas.module.css'
import { PrimaryAction } from '@/components/bento-lab/site'
import { RISE_TARGETS, drawLines, frame as f, groundProps, plateIn, rise, useScrollScene, type LineStep } from '@/components/bento-v2'
import { V2_MOTION, V2_SCENES } from '@/lib/design/v2-scenes'
import { v2Href } from '@/lib/site/v2-routes'

const GROUND = groundProps('circle', `${f.frame} ${f.frameFlip} ${f.banded}`)

/** The drawing's pairs, heaviest first, each line with its label. */
const edgeSteps = (root: Element): readonly LineStep[] =>
  [...root.querySelectorAll<SVGElement>('[data-edge]')]
    .sort((x, y) => Number(y.dataset.bits) - Number(x.dataset.bits))
    .map((edge) => ({ lines: [...edge.querySelectorAll('[data-edge-line]')], marks: [...edge.querySelectorAll('[data-edge-label]')] }))

export interface CircleFrameProps {
  /** How many people the circle holds. */
  readonly count: number
  /** The name of the person the circle is drawn around (`hubOf`), when it has one. */
  readonly hub: string | null
  /** The circle drawing, drawn on the server. */
  readonly drawing: ReactNode
  /** The circle's heaviest pairs, drawn on the server. */
  readonly pairs: ReactNode
}

/**
 * A circle (BENTO_V2.md "Home" 5): who holds a group together. The focus is
 * the bento kit's circle drawing, the person whose ties carry the most at the
 * hub; beside it who that is, the circle's heaviest pairs and the action. The drawing and the pairs arrive
 * drawn on the server; the frame plays them: the lines draw in heaviest
 * first as it enters.
 */
export function CircleFrame({ count, hub, drawing, pairs }: CircleFrameProps) {
  const scene = useScrollScene<HTMLElement>((scope) => {
    plateIn(scope, V2_SCENES.plateIn, V2_MOTION.plateFrom)
    rise(scope, V2_SCENES.tilesIn, [...scope.root.querySelectorAll(RISE_TARGETS)])
    drawLines(scope, V2_SCENES.linesIn, edgeSteps(scope.root))
  })

  return (
    <section ref={scene} id="circle" className={f.band} aria-labelledby="v2-circle-title">
      <div {...GROUND}>
        <div className={`${f.panel} ${f.art} ${kit.starfield} ${atlas.tokens} ${f.figureStage}`}>
          <Notch corner="tl" className={`${f.figureTitle} ${f.notchStack}`}>
            <h2 id="v2-circle-title" className={`${f.title} ${f.titleDisplay}`}>
              <Hung className={f.line}>A group,</Hung>
              <Hung className={f.bright}>arranged by what ties it</Hung>
            </h2>
          </Notch>
          <div className={f.drawingSlot}>{drawing}</div>
        </div>

        <div className={`${f.wall} ${c.side}`}>
          <div className={c.lead} data-tile>
            <p className={f.eyebrow}>A circle of {count}</p>
            {hub ? (
              <p className={c.hub}>
                <strong>{hub}</strong> holds this circle together: their ties carry the most, so they sit in the middle, and everyone else sits nearer the people they share the most with.
              </p>
            ) : null}
          </div>
          <div data-tiles>{pairs}</div>
          <div className={f.columnEnd} data-tile>
            <PrimaryAction href={v2Href('/circle')} intent="forward">
              Map a circle
            </PrimaryAction>
          </div>
        </div>
      </div>
    </section>
  )
}
