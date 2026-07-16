import {
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'

/**
 * Scroll position as a 0→1 shared value, for the components M3 asks to react to
 * scrolling: the large top app bar collapses on it, the extended FAB shrinks on
 * it, and the top bar's surface tint fades in on it.
 *
 * The handler is a **worklet** — it runs on the UI thread, so the collapse
 * tracks the finger even when JS is busy, and nothing crosses the bridge per
 * frame. It also has to be one: this project builds with the React Compiler,
 * which rejects mutating a shared value from inside an ordinary JS callback.
 *
 * The returned `onScroll` therefore only works on an **Animated** scrollable —
 * `Animated.ScrollView` or `Animated.FlatList`, not the plain ones.
 */
export function useScrollProgress(distance: number): {
  progress: SharedValue<number>
  onScroll: ReturnType<typeof useAnimatedScrollHandler>
} {
  const progress = useSharedValue(0)

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet'
      const offset = event.contentOffset.y
      progress.value = Math.max(0, Math.min(1, offset / distance))
    },
  })

  return { progress, onScroll }
}
