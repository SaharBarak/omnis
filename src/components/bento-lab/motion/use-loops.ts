'use client'

import { useEffect } from 'react'
import { BEAT, LOOP } from './loops'

const SELECTOR = `[${LOOP}]`

const loopsIn = (node: Node): readonly Element[] => (node instanceof Element ? [...(node.matches(SELECTOR) ? [node] : []), ...node.querySelectorAll(SELECTOR)] : [])

/**
 * A status pulse that starts is set back to the page's clock, so every pulse
 * on the page beats in one phase however late it came into view.
 */
const inPhase = (event: AnimationEvent): void => {
  const { target } = event
  if (!(target instanceof Element) || target.getAttribute(LOOP) !== BEAT) return
  for (const animation of target.getAnimations({ subtree: true })) {
    if (animation instanceof CSSAnimation && animation.animationName === event.animationName) animation.startTime = 0
  }
}

/**
 * The on-screen gate of every loop on the page: one observer marks each
 * `[data-loop]` element `data-in-view` while any part of it shows, and drops
 * it when it leaves, so a pulse or a current off screen costs nothing.
 * Elements that mount later are watched as they arrive and released as they
 * go. Server markup carries no `data-in-view`, so a loop's first frame is its
 * resting one. Status pulses share one phase (`inPhase`).
 */
export function useLoops(): void {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return
    const seen = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.toggleAttribute('data-in-view', entry.isIntersecting)
    })
    loopsIn(document.documentElement).forEach((el) => seen.observe(el))
    const mounts = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => loopsIn(node).forEach((el) => seen.observe(el)))
        record.removedNodes.forEach((node) => loopsIn(node).forEach((el) => seen.unobserve(el)))
      }
    })
    mounts.observe(document.body, { childList: true, subtree: true })
    const phased = typeof CSSAnimation !== 'undefined'
    if (phased) document.addEventListener('animationstart', inPhase)
    return () => {
      mounts.disconnect()
      seen.disconnect()
      if (phased) document.removeEventListener('animationstart', inPhase)
    }
  }, [])
}
