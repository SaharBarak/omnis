'use client'

import { useEffect, type DependencyList, type RefObject } from 'react'
import { useMotionAllowed } from './use-motion-allowed'
import { CURVE, type Curve } from '@/lib/design/motion-tokens'

export type Anime = typeof import('animejs')

/** What a build may hand back: anime's scope runs it on revert, after the scope's own animations are undone. */
export type IllustrationCleanup = () => void

export interface IllustrationKit {
  readonly anime: Anime
  readonly root: HTMLElement | SVGElement
  readonly ease: (curve: Curve) => ReturnType<Anime['cubicBezier']>
}

/**
 * anime.js for SVG illustrations (BENTO_MOTION.md "Motion engines"). The
 * engine loads on first use, never in a page's first bundle; `build` runs in
 * a scope rooted at `ref`, reverted on cleanup, so StrictMode's double effect
 * and data changes leave no stale animation. A build that sets up something
 * anime does not own (an observer, a shared cue) returns its cleanup, and the
 * scope runs it on revert. Does nothing when motion is off: the server markup
 * is already the final frame.
 */
export function useIllustration(
  ref: RefObject<HTMLElement | SVGElement | null>,
  build: (kit: IllustrationKit) => IllustrationCleanup | void,
  deps: DependencyList,
): void {
  const allowed = useMotionAllowed()
  useEffect(() => {
    const root = ref.current
    if (!allowed || !root) return
    let disposed = false
    let revert: (() => void) | null = null
    void import('animejs').then((anime) => {
      if (disposed) return
      const ease = (curve: Curve = CURVE.standard) => anime.cubicBezier(...curve)
      const scope = anime.createScope({ root }).add(() => build({ anime, root, ease }))
      revert = () => scope.revert()
    })
    return () => {
      disposed = true
      revert?.()
    }
    // `build` is read fresh on each run; `deps` names what should rerun it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, ...deps])
}
