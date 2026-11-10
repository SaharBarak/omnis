'use client'

import { useEffect, type Dispatch, type RefObject } from 'react'
import type { InspectEvent } from './inspect'
import { holds } from './mark-targets'

/**
 * Closing an open card on purpose (BENTO_SITE.md, "Keeping and closing"):
 * Escape closes any card, heard in the capture phase and stopped there so one
 * press never also closes a menu or sheet around it; a press outside every
 * `inside` element closes a kept card. When Escape closes a card that holds
 * focus (`alsoInside`, a board a keyboard entered), `returnFocus` hands focus
 * back to what opened it.
 */
export function useDismiss<Ref>(
  open: boolean,
  kept: boolean,
  dispatch: Dispatch<InspectEvent<Ref>>,
  inside: RefObject<Element | null>,
  alsoInside?: RefObject<Element | null>,
  returnFocus?: () => void,
): void {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      const focusInCard = holds(alsoInside?.current ?? null, document.activeElement)
      dispatch({ type: 'dismiss' })
      if (focusInCard) returnFocus?.()
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
  }, [open, kept, dispatch, inside, alsoInside, returnFocus])
}
