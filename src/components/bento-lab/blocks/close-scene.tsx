'use client'

import { useRef, type ReactNode } from 'react'
import b from './blocks.module.css'
import { useSequence } from '../motion'
import { CURVE, DURATION, STAGGER } from '@/lib/design/motion-tokens'

/** Where the closing line starts its rise, in pixels below its place. */
const RISE_FROM = 40

/**
 * The closing scene: as the close comes into view the portal artwork pushes
 * in to its rest (`--push`, which the stylesheet turns into its scale) and
 * the closing line rises into place, once, by time. The action is never
 * moved. With motion off it is the still: artwork pushed in, line in place.
 */
export function CloseScene({ media, children }: { readonly media: ReactNode; readonly children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useSequence(
    ref,
    ({ anime, root, ease }) => {
      const art = root.querySelector<HTMLElement>('[data-close-art]')
      const lines = [...root.querySelectorAll<HTMLElement>('[data-close-line]')]
      const timeline = anime.createTimeline({ autoplay: false })
      if (art) timeline.add(art, { '--push': [0, 1], duration: DURATION.draw, ease: ease(CURVE.standard) }, 0)
      lines.forEach((line, i) => {
        timeline.add(line, { translateY: [RISE_FROM, 0], opacity: [0, 1], duration: DURATION.settle, ease: ease(CURVE.emphasized) }, DURATION.quick + i * STAGGER.step)
      })
      return { timeline }
    },
    [],
  )
  return (
    <div ref={ref} className={b.close} data-scene="close">
      <div className={b.closeArt} data-close-art="">
        {media}
      </div>
      <div className={b.closeScrim} />
      {children}
    </div>
  )
}
