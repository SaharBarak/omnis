'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motionAllowed, subscribeMotion, THEME_ROOT, watchLabRoot } from '../lab-state'

/** The lab root attribute the first-paint entrance rules key off (kit.module.css, atlas.module.css). */
export const ENTRANCE_ATTRIBUTE = 'data-entrance'

/** A CSS animation that ends: an entrance, not a loop. */
const isEntrance = (animation: Animation): boolean =>
  animation instanceof CSSAnimation && Number.isFinite(Number(animation.effect?.getComputedTiming().endTime))

/**
 * First-paint entrances run only while the lab root carries `data-entrance`
 * (BENTO_MOTION.md "Lifecycle"). The server markup has it, so the page draws
 * itself before any script. It comes off once every entrance under the root
 * has finished, or the moment motion is paused, so pausing and resuming never
 * restarts one: the rules that run them no longer match. A client navigation
 * puts it back before paint, so the new page's content draws in too.
 */
export function useEntrance(): void {
  const pathname = usePathname()
  useLayoutEffect(() => {
    const root = document.querySelector(THEME_ROOT)
    if (!root) return
    if (!motionAllowed(root)) {
      root.removeAttribute(ENTRANCE_ATTRIBUTE)
      return
    }
    root.setAttribute(ENTRANCE_ATTRIBUTE, '')
    let live = true
    const end = () => {
      if (live) root.removeAttribute(ENTRANCE_ATTRIBUTE)
    }
    const onMotion = () => {
      if (!motionAllowed(root)) end()
    }
    const frame = requestAnimationFrame(() => {
      const entrances = root.getAnimations({ subtree: true }).filter(isEntrance)
      void Promise.allSettled(entrances.map((animation) => animation.finished)).then(end)
    })
    const stopRoot = watchLabRoot(root, onMotion)
    const stopPause = subscribeMotion(onMotion)
    return () => {
      live = false
      cancelAnimationFrame(frame)
      stopRoot()
      stopPause()
    }
  }, [pathname])
}
