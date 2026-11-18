'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { StagePort } from './use-board-disclosure'
import { DURATION } from '@/lib/design/motion-tokens'

/**
 * A stage's owner (BENTO_V2.md "The stage"): what is drawn there, for every
 * opener list that shares it. A preview shows at once; leaving clears it a
 * beat later (`quick`, the hover grace of WCAG 1.4.13), so the pointer can
 * pass from one opener to the next, or onto the stage (`hold`, `release`),
 * without the stage emptying between. While anything suspends it (a list's
 * open board, the caller's own reason) it is empty and takes no preview:
 * what was shown is forgotten, never brought back when the reason ends.
 */
export function useStage<T>(suspended = false) {
  const [shown, setShown] = useState<T | null>(null)
  const [owners, setOwners] = useState<ReadonlySet<string>>(() => new Set())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blocked = suspended || owners.size > 0
  const gate = useRef(blocked)
  const [was, setWas] = useState(blocked)
  if (was !== blocked) {
    setWas(blocked)
    if (blocked) setShown(null)
  }

  const hold = useCallback(() => {
    if (timer.current === null) return
    clearTimeout(timer.current)
    timer.current = null
  }, [])
  const release = useCallback(() => {
    timer.current ??= setTimeout(() => {
      timer.current = null
      setShown(null)
    }, DURATION.quick)
  }, [])
  const preview = useCallback(
    (value: T | null) => {
      if (value === null) return release()
      hold()
      if (!gate.current) setShown(value)
    },
    [hold, release],
  )
  const busy = useCallback((owner: string, open: boolean) => {
    setOwners((now) => {
      if (now.has(owner) === open) return now
      const next = new Set(now)
      if (open) next.add(owner)
      else next.delete(owner)
      return next
    })
  }, [])

  useEffect(() => {
    gate.current = blocked
    if (blocked) hold()
  }, [blocked, hold])
  useEffect(() => hold, [hold])

  const port: StagePort<T> = useMemo(() => ({ preview, busy }), [preview, busy])
  return { shown: blocked ? null : shown, port, hold, release }
}
