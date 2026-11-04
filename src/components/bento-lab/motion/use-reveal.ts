'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { ENTER_MARGIN, inView } from './in-view'
import { useMotionAllowed } from './use-motion-allowed'

/**
 * Where an entrance stands (BENTO_MOTION.md "Policy"):
 * - `rest`: the final frame. Server markup, motion off, already in view when script arrived, or the entrance is over.
 * - `armed`: below the fold with motion on; the entrance holds its first frame out of sight.
 * - `shown`: it entered view and plays, once.
 */
export type RevealPhase = 'rest' | 'armed' | 'shown'

/**
 * One entrance per element, never replayed: armed only when the element is
 * out of sight as motion turns on, so nothing the reader can see is ever
 * hidden, and no content waits on script. Once armed it never arms again,
 * so pausing and resuming motion, or scrolling back, leaves the final frame.
 */
export function useReveal(ref: RefObject<Element | null>): RevealPhase {
  const allowed = useMotionAllowed()
  const [phase, setPhase] = useState<RevealPhase>('rest')
  const armedOnce = useRef(false)
  if (!allowed && phase !== 'rest') setPhase('rest')

  useEffect(() => {
    const el = ref.current
    if (!allowed || !el || armedOnce.current || inView(el)) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setPhase('shown')
        observer.disconnect()
      },
      { rootMargin: ENTER_MARGIN },
    )
    const arm = requestAnimationFrame(() => {
      armedOnce.current = true
      setPhase((current) => (current === 'rest' ? 'armed' : current))
      observer.observe(el)
    })
    return () => {
      cancelAnimationFrame(arm)
      observer.disconnect()
    }
  }, [allowed, ref])

  return phase
}
