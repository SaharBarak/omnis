import { useEffect, useState } from 'react'
import {
  runOnJS,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

/**
 * Score count-up — DESIGN_LANGUAGE §5.2: count up from 0 once per mount,
 * tabular mono. Reanimated drives the timing curve; the rounded value lands
 * in React state so it can feed Text AND MeterBar widths together.
 * Reduced motion: the final number renders instantly.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const reduced = useReducedMotion()
  const progress = useSharedValue(0)
  const [display, setDisplay] = useState(() => (reduced ? target : 0))

  useEffect(() => {
    if (reduced) {
      setDisplay(target)
      return
    }
    progress.value = 0
    progress.value = withTiming(1, { duration: durationMs })
  }, [reduced, target, durationMs, progress])

  useAnimatedReaction(
    () => progress.value,
    (value) => {
      if (reduced) return
      runOnJS(setDisplay)(Math.round(value * target))
    },
    [target, reduced]
  )

  return display
}
