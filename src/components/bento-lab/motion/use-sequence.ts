'use client'

import { useCallback, useEffect, useRef, type DependencyList, type RefObject } from 'react'
import type { Timeline } from 'animejs'
import { ENTER_MARGIN, inView } from './in-view'
import type { IllustrationKit } from './use-illustration'
import { useMotionAllowed } from './use-motion-allowed'
import { CURVE, type Curve } from '@/lib/design/motion-tokens'

/**
 * What a sequence's build hands back: its timeline, built paused, whose end
 * frame is the stylesheet's own, and what to reset in the component (a lit
 * tile, a count of landed lines) when the sequence ends, however it ends.
 */
export interface Sequence {
  readonly timeline: Timeline
  readonly settle?: () => void
}

/**
 * A sequence (BENTO_MOTION.md "Motion engines"): a timeline a section plays
 * once, by time, as it comes into view. Scroll never drives it.
 *
 * - It arms only when its section is out of view once the engine has
 *   loaded: the first frame goes on out of sight. A section a reader can
 *   already see keeps its final frame, and is spent.
 * - It plays when the section enters view (`ENTER_MARGIN`) and never again:
 *   scrolling back, pausing and resuming, or new data leave the final frame.
 * - When it ends, by playing out, by the returned `finish` (input
 *   supersedes it) or by motion turning off, its scope reverts every inline
 *   style it set, so the stylesheet's final frame takes over.
 */
export function useSequence(ref: RefObject<HTMLElement | null>, build: (kit: IllustrationKit) => Sequence | null, deps: DependencyList): () => void {
  const allowed = useMotionAllowed()
  const spent = useRef(false)
  const end = useRef<() => void>(() => undefined)

  useEffect(() => {
    const root = ref.current
    if (!allowed || !root || spent.current) return
    let disposed = false
    let stop: (() => void) | null = null
    void import('animejs').then((anime) => {
      if (disposed || spent.current) return
      spent.current = true
      if (inView(root)) return
      const ease = (curve: Curve = CURVE.standard) => anime.cubicBezier(...curve)
      const built: { sequence: Sequence | null } = { sequence: null }
      // The first frame goes on inside the scope, so reverting the scope removes it with everything else.
      const scope = anime.createScope({ root }).add(() => {
        built.sequence = build({ anime, root, ease })
        built.sequence?.timeline.init()
      })
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return
          observer.disconnect()
          built.sequence?.timeline.play()
        },
        { rootMargin: ENTER_MARGIN },
      )
      let ended = false
      stop = () => {
        if (ended) return
        ended = true
        observer.disconnect()
        scope.revert()
        built.sequence?.settle?.()
      }
      if (!built.sequence) return stop()
      void built.sequence.timeline.then(() => stop?.())
      observer.observe(root)
    })
    end.current = () => {
      spent.current = true
      stop?.()
    }
    return () => {
      disposed = true
      stop?.()
      end.current = () => undefined
    }
    // `build` is read fresh on each run; `deps` names what should rerun it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, ...deps])

  return useCallback(() => end.current(), [])
}
