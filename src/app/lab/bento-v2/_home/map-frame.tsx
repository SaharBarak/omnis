'use client'

import { useState } from 'react'
import m from './map-frame.module.css'
import { Hung } from '@/components/bento-lab'
import { LivePill, MapWindow, RISE_TARGETS, countUp, frame as f, groundProps, plateIn, rise, useScrollScene } from '@/components/bento-v2'
import type { PersonAtlas } from '@/lib/atlas/types'
import { V2_MOTION, V2_SCENES } from '@/lib/design/v2-scenes'
import type { V2Home } from '@/lib/site/v2-home'

const GROUND = groundProps('map', `${f.frame} ${f.frameFlip} ${f.banded}`)

/**
 * The map (BENTO_V2.md "Home" 2): what a map looks like. A viewport-high band
 * on the page's ground holds the frame, smaller and centred, on whatever
 * ground the run gives it (`V2_SECTIONS`). The focus is the product itself,
 * Maya's map in a window; beside it the title, one sentence and four counts
 * read from the tables. The plate opens as it
 * comes up the viewport, its words rise and the counts count; once the window
 * has risen, its defined channels carry their currents.
 */
export function MapFrame({ home, atlas, name, birth }: { readonly home: V2Home; readonly atlas: PersonAtlas; readonly name: string; readonly birth: string }) {
  const [landed, setLanded] = useState(false)
  const scene = useScrollScene<HTMLElement>((scope) => {
    plateIn(scope, V2_SCENES.plateIn, V2_MOTION.plateFrom)
    rise(scope, V2_SCENES.tilesIn, [...scope.root.querySelectorAll(RISE_TARGETS)], () => setLanded(true))
    countUp(scope, V2_SCENES.tilesIn, V2_MOTION.countMs)
  })

  return (
    <section ref={scene} id="map" className={f.band} aria-labelledby="v2-map-title">
      <div {...GROUND}>
        <div className={f.wall}>
          <div className={m.head} data-tile>
            <p className={f.eyebrow}>The Pleiad map</p>
            <h2 id="v2-map-title" className={`${f.title} ${f.titleDisplay}`}>
              <Hung className={f.line}>One map per person,</Hung>
              <Hung className={f.bright}>from one birth date</Hung>
            </h2>
            <p className={f.lead}>Each system is computed by its own rules and laid on one plate, so you can read them together or bring one forward.</p>
          </div>
          <ul className={`${f.wallList} ${m.counts}`} data-tiles>
            {home.counts.map((count) => (
              <li key={count.label} className={m.count}>
                <Hung className={f.figure} figures="tabular" data-count={count.value}>
                  {count.value}
                </Hung>
                <span className={f.caption}>{count.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={m.slot} data-tile>
          <MapWindow
            atlas={atlas}
            title={`${name}'s map`}
            meta={birth}
            badge={<LivePill>Computed by the engine</LivePill>}
            className={m.window}
            currents={landed}
          />
        </div>
      </div>
    </section>
  )
}
