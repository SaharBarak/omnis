'use client'

import { useRef, type ReactNode } from 'react'
import b from './blocks.module.css'
import { useScene } from '../motion'

/** Scale the artwork reaches as the page ends (storyboard 9): a push-in, not a zoom. */
const PUSH = 1.14
/** Where the closing line starts its rise, in pixels below its place. */
const RISE_FROM = 40

/**
 * The closing scene: as the close comes fully into view the portal artwork
 * pushes in and the closing line rises into place, scrubbed by scroll. GSAP
 * owns the artwork wrapper's scale and the line's transform and opacity; the
 * action is never moved. With motion off it is the still: artwork at rest,
 * line in place.
 */
export function CloseScene({ media, children }: { readonly media: ReactNode; readonly children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useScene(
    ref,
    ({ gsap, ScrollTrigger, root }) => {
      const art = root.querySelector('[data-close-art]')
      const lines = gsap.utils.toArray<HTMLElement>('[data-close-line]', root)
      const timeline = gsap.timeline({ defaults: { ease: 'none' } })
      if (art) timeline.fromTo(art, { scale: 1 }, { scale: PUSH, duration: 1 }, 0)
      timeline.fromTo(lines, { y: RISE_FROM, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, 0.1)
      ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom bottom', scrub: true, animation: timeline })
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
