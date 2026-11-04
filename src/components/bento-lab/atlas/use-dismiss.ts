'use client'

import { useEffect, type Dispatch, type RefObject } from 'react'
import type { InspectEvent } from './inspect'
import { holds } from './mark-targets'

/**
 * Closing an open card on purpose (BENTO_SITE.md, "Keeping and closing"):
 * Escape closes any card, heard in the capture phase and stopped there so one
 * press never also closes a menu or sheet around it; a press outside every
 * `inside` element closes a kept card.
 */
export function useDismiss<Ref>(
  open: boolean,
  kept: boolean,
  dispatch: Dispatch<InspectEvent<Ref>>,
  inside: RefObject<Element | null>,
  alsoInside?: RefObject<Element | null>,
): void {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      dispatch({ type: 'dismiss' })
    }
    const onDown = (e: PointerEvent) => {
      if (kept && !holds(inside.current, e.target) && !holds(alsoInside?.current, e.target)) dispatch({ type: 'dismiss' })
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open, kept, dispatch, inside, alsoInside])
}
