import './lenis.css'
import { Fragment, type ReactNode } from 'react'
import { CircleFrame } from './_home/circle-frame'
import { CloseFrame } from './_home/close-frame'
import { Hero } from './_home/hero'
import { MapFrame } from './_home/map-frame'
import { PairFrame } from './_home/pair-frame'
import { WhyFrame } from './_home/why-frame'
import { CircleDrawing } from '@/components/bento-lab/atlas/circle-drawing'
import { CirclePairs } from '@/components/bento-lab/scenes/circle-pairs'
import { ScrollEngine, frame } from '@/components/bento-v2'
import { birthLine } from '@/lib/atlas/birth-line'
import { buildCircleAtlas, buildPairAtlas, buildPersonAtlas } from '@/lib/atlas/build'
import { hubOf } from '@/lib/atlas/circle-hub'
import { DEMO_ATLAS_PEOPLE, demoPerson } from '@/lib/atlas/demo'
import { DIGEST } from '@/lib/atlas/layers'
import { isoDay } from '@/lib/atlas/light'
import { buildBentoLab } from '@/lib/data/bento-lab'
import { V2_FOOTER, V2_RUN, type V2Section } from '@/lib/design/v2-chapters'
import { buildV2Home } from '@/lib/site/v2-home'
import { daySources } from '@/lib/today-sources'

export const revalidate = 3600

/** The lists the two drawings' descriptions point at. */
const PAIR_TIES = 'v2-pair-ties'
const CIRCLE_PAIRS = 'v2-circle-pairs'

/**
 * Bento v2 home (docs/redesign/BENTO_V2.md "Home"): its scrolled frames,
 * every chart computed here by the engine; Lenis and the scenes live for this
 * page only. The pair and circle drawings are drawn here and handed to their
 * frames, so the atlases they are drawn from never ship to the browser. The
 * frames are set in the order of `V2_RUN`, the table that sets each one's
 * ground, so the page can only show the alternation its tests hold.
 */
export default async function BentoV2Home() {
  const now = new Date()
  const today = isoDay(now)
  const maya = demoPerson('maya')
  const ari = demoPerson('ari')
  const atlas = buildPersonAtlas(maya.input, today)
  /* The rows, figures and boards, read at the day's noon, UTC, once a day. */
  const { board, figures, boards } = await daySources(today)
  const pair = buildPairAtlas(maya, ari, today)
  const circle = buildCircleAtlas(DEMO_ATLAS_PEOPLE)
  const home = buildV2Home({
    day: today,
    lab: buildBentoLab(now),
    people: [maya, ari],
    pair,
    board,
    figures,
    boards,
  })

  const frames: Readonly<Record<V2Section, ReactNode>> = {
    top: <Hero home={home} systems={DIGEST.length} />,
    map: <MapFrame home={home} atlas={atlas} name={maya.name} birth={birthLine(maya)} />,
    pair: <PairFrame home={home} tiesId={PAIR_TIES} pair={pair} />,
    circle: (
      <CircleFrame
        count={circle.people.length}
        hub={hubOf(circle)?.name ?? null}
        drawing={<CircleDrawing circle={circle} describedBy={CIRCLE_PAIRS} fit />}
        pairs={<CirclePairs circle={circle} id={CIRCLE_PAIRS} className={frame.wallList} />}
      />
    ),
    why: <WhyFrame home={home} />,
    start: <CloseFrame home={home} year={now.getUTCFullYear()} />,
  }

  return (
    <ScrollEngine>
      <main id="main" className={frame.stack}>
        {V2_RUN.filter((section) => section !== V2_FOOTER).map((section) => (
          <Fragment key={section}>{frames[section]}</Fragment>
        ))}
      </main>
      {frames[V2_FOOTER]}
    </ScrollEngine>
  )
}
