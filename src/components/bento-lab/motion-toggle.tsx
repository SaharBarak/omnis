'use client'

import { useCallback, useRef, useSyncExternalStore } from 'react'
import { Pause, Play } from 'lucide-react'
import { isMotionPaused, labRoot, setMotionPaused, subscribeMotion } from './lab-state'

/** One pause for every moving thing on the page: videos, canvases, CSS animation (WCAG 2.2.2). */
export function MotionToggle({ className }: { readonly className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const readPaused = useCallback(
    () => (buttonRef.current ? isMotionPaused(labRoot(buttonRef.current)) : false),
    [],
  )
  const paused = useSyncExternalStore(subscribeMotion, readPaused, () => false)

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      aria-label="Pause motion"
      aria-pressed={paused}
      onClick={() => setMotionPaused(labRoot(buttonRef.current), !paused)}
    >
      {paused ? <Play size={13} aria-hidden /> : <Pause size={13} aria-hidden />}
    </button>
  )
}
