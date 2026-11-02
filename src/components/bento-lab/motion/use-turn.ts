'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'
import { release } from './inline-style'
import { useMotionAllowed } from './use-motion-allowed'
import { CURVE, DURATION, shortestTurn } from '@/lib/design/motion-tokens'

/** What a turn borrows from the group, returned when it lands or is torn down. */
const TURN_STYLES = ['transform', 'transform-box', 'transform-origin'] as const

/**
 * Turns an SVG group the short way from where its content was to where it is
 * now (BENTO_MOTION.md storyboard H, "new date"). `anchor` is how far the
 * group's content is rotated, in maths degrees (counter-clockwise). Before
 * paint the group is set back to the old position, then anime.js turns it
 * home, so the new data never flashes in place first. anime.js owns only the
 * group's transform, and hands it back once the group is home.
 */
export function useTurn(rootRef: RefObject<Element | null>, selector: string, anchor: number): void {
  const allowed = useMotionAllowed()
  const previous = useRef(anchor)
  useLayoutEffect(() => {
    const from = previous.current
    previous.current = anchor
    const group = rootRef.current?.querySelector<SVGGElement>(selector)
    const turn = shortestTurn(from, anchor)
    if (!allowed || !group || turn === 0) return
    group.style.transformBox = 'view-box'
    group.style.transformOrigin = '50% 50%'
    group.style.transform = `rotate(${turn}deg)`
    let disposed = false
    let stop: (() => void) | null = null
    void import('animejs').then(({ animate, cubicBezier }) => {
      if (disposed) return
      const animation = animate(group, {
        rotate: [turn, 0],
        duration: DURATION.settle,
        ease: cubicBezier(...CURVE.emphasized),
        onComplete: () => release(group, TURN_STYLES),
      })
      stop = () => animation.revert()
    })
    return () => {
      disposed = true
      stop?.()
      release(group, TURN_STYLES)
    }
  }, [anchor, allowed, rootRef, selector])
}
