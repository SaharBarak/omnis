'use client'

import { useEffect, useRef, type Dispatch } from 'react'
import type { InspectEvent } from './inspect'
import { DURATION } from '@/lib/design/motion-tokens'

const leaving = <Ref,>(event: InspectEvent<Ref>): boolean => event.type === 'point' && event.ref === null

/**
 * Hover grace (WCAG 1.4.13): the pointer leaving the targets closes the card
 * a beat later (`quick`), so it can cross the gap onto the card. Any other
 * event, or the pointer reaching the card (`hold`), cancels the pending
 * close; leaving again while one is pending does not restart it.
 */
export function useGrace<Ref>(dispatch: Dispatch<InspectEvent<Ref>>) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hold = () => {
    if (timer.current === null) return
    clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current)
  }, [])
  const send = (event: InspectEvent<Ref>) => {
    if (!leaving(event)) {
      hold()
      dispatch(event)
      return
    }
    timer.current ??= setTimeout(() => {
      timer.current = null
      dispatch(event)
    }, DURATION.quick)
  }
  return { send, hold }
}
