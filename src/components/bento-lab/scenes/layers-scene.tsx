'use client'

import { useRef, useState, type CSSProperties } from 'react'
import l from './layers.module.css'
import kit from '../kit.module.css'
import { LayerPlate } from '@/components/bento-lab/atlas'
import { AtlasDigest } from '@/components/bento-lab/atlas/digest'
import { useSequence } from '@/components/bento-lab/motion'
import { LAYER_META, LAYERS_BY_PIN } from '@/lib/atlas/layers'
import { ATLAS_LAYERS, type AtlasLayerId, type PersonAtlas } from '@/lib/atlas/types'
import { CURVE, DURATION } from '@/lib/design/motion-tokens'

/** The tour lifts the layers in the lead order the digest reads. */
const STEPS = LAYERS_BY_PIN
/** The plates stack outside in (sky on top); the stack draws the last of these at the bottom. */
const PLATES = ATLAS_LAYERS
/** One beat of the tour: a layer lifts, then rests before the next. */
const BEAT = DURATION.settle + DURATION.hold

/**
 * Storyboard "Layers": as the section comes into view the map tilts and parts
 * into its four layers in depth, lifts one at a time in the lead order with
 * its digest tile lit, then rests apart, which is the stylesheet's frame. A
 * tile brings its layer forward at any time and ends the tour. The geometry
 * is CSS (layers.module.css); the sequence tweens unitless variables on it.
 */
export function LayersScene({ atlas }: { readonly atlas: PersonAtlas }) {
  const sceneRef = useRef<HTMLDivElement>(null)
  /** The layer the tour is showing on its own; never a choice. */
  const [tour, setTour] = useState<AtlasLayerId | null>(null)
  /** The layer the reader brought forward. */
  const [focus, setFocus] = useState<AtlasLayerId | null>(null)

  const finish = useSequence(
    sceneRef,
    ({ anime, root, ease }) => {
      const stack = root.querySelector<HTMLElement>('[data-stack]')
      const stage = root.querySelector<HTMLElement>('[data-stage]')
      const plates = [...root.querySelectorAll<HTMLElement>('[data-plate]')]
      if (!stack || !stage) return null
      const move = { duration: DURATION.settle, ease: ease(CURVE.standard) }
      const timeline = anime.createTimeline({ autoplay: false })
      timeline.add(stack, { '--part': [0, 1], duration: DURATION.settle, ease: ease(CURVE.emphasized) }, 0)
      STEPS.forEach((layer, i) => {
        const at = DURATION.settle + i * BEAT
        const plate = plates.find((p) => p.dataset.plate === layer)
        if (plate) timeline.add(plate, { '--raise': 1, '--fade': 0, ...move }, at)
        timeline.add(plates.filter((p) => p !== plate), { '--raise': 0, '--fade': 1, ...move }, at)
        timeline.call(() => setTour(layer), at)
      })
      const rest = DURATION.settle + STEPS.length * BEAT
      timeline.add(plates, { '--raise': 0, '--fade': 0, ...move }, rest)
      timeline.call(() => setTour(null), rest)
      // The field drifts in to its rest, the stylesheet's 0, over the whole tour.
      timeline.add(stage, { '--drift': [1, 0], duration: rest + DURATION.settle, ease: 'linear' }, 0)
      return { timeline, settle: () => setTour(null) }
    },
    [atlas],
  )

  const choose = (layer: AtlasLayerId | null) => {
    finish()
    setFocus(layer)
  }

  return (
    <div ref={sceneRef} className={l.frame} data-scene="layers">
      <div className={`${l.stage} ${kit.starfield}`} data-stage="">
        <div className={l.stack} data-stack="" data-focus={focus ?? undefined}>
          {[...PLATES].reverse().map((layer, k) => (
            <div key={layer} className={l.plate} data-plate={layer} data-layer={layer} style={{ '--k': k } as CSSProperties}>
              <LayerPlate atlas={atlas} layer={layer} />
              <span className={l.plateName} aria-hidden>
                <span className={l.plateN}>{LAYER_META[layer].pin}</span>
                {LAYER_META[layer].name}
              </span>
            </div>
          ))}
        </div>
      </div>
      <AtlasDigest atlas={atlas} focus={focus} spot={tour} onFocus={choose} beside={false} cardAt="above" className={l.legend} />
    </div>
  )
}
