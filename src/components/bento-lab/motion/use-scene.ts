'use client'

import { useEffect, type DependencyList, type RefObject } from 'react'
import { useMotionAllowed } from './use-motion-allowed'

export type Gsap = typeof import('gsap').gsap
export type ScrollTriggerApi = typeof import('gsap/ScrollTrigger').ScrollTrigger

/** What a build may hand back: gsap.context runs it on revert, after the scene's own tweens and triggers are undone. */
export type SceneCleanup = () => void

export interface SceneKit {
  readonly gsap: Gsap
  readonly ScrollTrigger: ScrollTriggerApi
  readonly root: HTMLElement
}

/**
 * GSAP + ScrollTrigger for scroll scenes (BENTO_MOTION.md "Motion engines").
 * The engine loads on first use; `build` runs inside a gsap.context scoped to
 * `ref`, reverted on cleanup, so a route change, StrictMode or new data leave
 * no trigger behind. A build that hands something to the component (a
 * scroll-to function) returns its cleanup, which the context runs on revert. Layout (the track's height, the sticky frame) is CSS, so
 * a scene only moves what is already in place. Does nothing when motion is
 * off; the CSS layout is then the final frame.
 */
export function useScene(ref: RefObject<HTMLElement | null>, build: (kit: SceneKit) => SceneCleanup | void, deps: DependencyList): void {
  const allowed = useMotionAllowed()
  useEffect(() => {
    const root = ref.current
    if (!allowed || !root) return
    let disposed = false
    let revert: (() => void) | null = null
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed) return
      gsap.registerPlugin(ScrollTrigger)
      const ctx = gsap.context(() => build({ gsap, ScrollTrigger, root }), root)
      revert = () => ctx.revert()
      void document.fonts.ready.then(() => {
        if (!disposed) ScrollTrigger.refresh()
      })
    })
    return () => {
      disposed = true
      revert?.()
    }
    // `build` is read fresh on each run; `deps` names what should rerun it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, ...deps])
}
