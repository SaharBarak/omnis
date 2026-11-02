'use client'

import { useId, useRef, useState, type CSSProperties } from 'react'
import l from './layers.module.css'
import kit from '../kit.module.css'
import { LayerPlate } from '@/components/bento-lab/atlas'
import { AtlasDigest } from '@/components/bento-lab/atlas/digest'
import { useMotionAllowed, useScene } from '@/components/bento-lab/motion'
import { LAYER_META } from '@/lib/atlas/layers'
import { ATLAS_LAYERS, type AtlasLayerId, type PersonAtlas } from '@/lib/atlas/types'

/** Read outside in (sky first); the stack draws the last of these at the bottom. */
const STEPS = ATLAS_LAYERS
/** Track length in units of 70svh: opening, one per layer, closing. */
const UNITS = STEPS.length + 2
/** Where in a layer's timeline unit the scroll lands when its tile is chosen: past the lift, inside the hold. */
const HOLD_AT = 0.7

/** The layer lifted at a timeline time: unit 0 opens the stack, units 1..4 are the layers. */
const stepAt = (time: number): AtlasLayerId | null => STEPS[Math.floor(time) - 1] ?? null

/**
 * Storyboard "Layers": the map pins, parts into its four layers in depth, lifts
 * one per scroll step with its digest tile lit, then closes back into one map.
 * The track's height and the exploded stack are CSS (layers.module.css); GSAP
 * scrubs CSS variables on them. With motion off the stack stays apart and a
 * tile brings its layer forward instead.
 */
export function LayersScene({ atlas }: { readonly atlas: PersonAtlas }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const travel = useRef<((layer: AtlasLayerId) => void) | null>(null)
  const [active, setActive] = useState<AtlasLayerId | null>(null)
  const [focus, setFocus] = useState<AtlasLayerId | null>(null)
  const allowed = useMotionAllowed()
  const afterId = useId()

  useScene(
    trackRef,
    ({ gsap, ScrollTrigger, root }) => {
      const stack = root.querySelector<HTMLElement>('[data-stack]')
      const plates = gsap.utils.toArray<HTMLElement>('[data-plate]', root)
      if (!stack) return
      const stage = root.querySelector<HTMLElement>('[data-stage]')
      const timeline = gsap.timeline({ defaults: { ease: 'none' } })
      // Progress only (0 to 1); layers.module.css turns it into tilt, gap, lift and dimming per breakpoint.
      timeline.fromTo(stack, { '--part': 0 }, { '--part': 1, duration: 1 })
      STEPS.forEach((layer) => {
        const plate = plates.find((p) => p.dataset.plate === layer)
        const others = plates.filter((p) => p !== plate)
        timeline
          .to(plate ?? [], { '--raise': 1, '--fade': 0, duration: 0.4 }, '>')
          .to(others, { '--raise': 0, '--fade': 1, duration: 0.4 }, '<')
          .to({}, { duration: 0.6 })
      })
      timeline
        .to(plates, { '--raise': 0, '--fade': 0, duration: 0.4 })
        .to(stack, { '--part': 0, duration: 0.6 }, '<')
      if (stage) timeline.fromTo(stage, { '--drift': 0 }, { '--drift': 1, duration: timeline.duration() }, 0)
      const trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        animation: timeline,
        onUpdate: () => setActive(stepAt(timeline.time())),
      })
      travel.current = (layer) => {
        const progress = (STEPS.indexOf(layer) + 1 + HOLD_AT) / timeline.duration()
        window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: 'smooth' })
      }
      return () => {
        travel.current = null
      }
    },
    [atlas],
  )

  // Focus is the motion-off mode; motion turning on hands the stack back to the scene.
  if (allowed && focus !== null) setFocus(null)
  const choose = (layer: AtlasLayerId | null) => {
    if (allowed && layer && travel.current) travel.current(layer)
    else if (!allowed) setFocus(layer)
  }
  const lit = allowed ? active : focus

  return (
    <>
      <a href={`#${afterId}`} className={kit.skip}>
        Skip past the layers
      </a>
      <div ref={trackRef} className={l.track} data-scene="layers" style={{ '--units': UNITS } as CSSProperties}>
      <div className={l.frame}>
        <div className={`${l.stage} ${kit.starfield}`} data-stage="">
          <div className={l.stack} data-stack="" data-focus={allowed ? undefined : (focus ?? undefined)}>
            {[...STEPS].reverse().map((layer, k) => (
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
        <AtlasDigest atlas={atlas} focus={lit} onFocus={choose} mode={allowed ? 'travel' : 'toggle'} className={l.legend} />
      </div>
      </div>
      <span id={afterId} />
    </>
  )
}
