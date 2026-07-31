import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated'

import { SegmentedButton, type Segment } from '@/components/m3'
import { DURATION, SHAPE, SPACE } from '@/theme/m3'
import type { SystemFlavor } from '@/theme/tokens'

/**
 * The reader's systems, as an M3 single-select segmented button driving the
 * pager. The set is whatever their preferences leave standing, so the count
 * is not fixed.
 *
 * Flavour vs. the M3 selected state — the one design call on this screen:
 *
 * The old pills each wore their own system's accent on their border, which
 * meant selection was signalled by colour alone and six competing colours were
 * on screen at once. M3's selected segment owns `secondaryContainer` plus a
 * checkmark; two signals, one of which survives a colour-blind user and a
 * sunlit screen. Selection is a *control* state and it is the same in every
 * control in the app, so the control's colour is not a system's to take.
 *
 * So M3 wins the segment, and flavour moves to where it actually means
 * something — the page. It survives in three places, none of which fight the
 * selected state because none of them are selection: the band below (the
 * page's top edge, crossfading to the incoming system as you swipe), the
 * section eyebrows, and the meter fills. Identity belongs to the reading, not
 * to the tab that opens it.
 */

export interface FlavorTab {
  key: string
  label: string
  flavor: SystemFlavor
}

export function FlavorTabs({
  tabs,
  activeIndex,
  onSelect,
}: {
  tabs: FlavorTab[]
  activeIndex: number
  onSelect: (index: number) => void
}) {
  const reduced = useReducedMotion()

  const segments = useMemo<Segment[]>(
    () => tabs.map(({ key, label }) => ({ key, label })),
    [tabs]
  )

  const flavor = tabs[activeIndex]?.flavor

  return (
    <View style={styles.root}>
      {/* The set runs past M3's five-segment cap, which is exactly what
          `scrollable` is for — the labels stay readable rather than shrinking. */}
      <SegmentedButton
        segments={segments}
        selectedIndex={activeIndex}
        onSelect={onSelect}
        scrollable
      />

      <View style={styles.band}>
        {flavor !== undefined && (
          <Animated.View
            key={flavor.accent}
            entering={reduced ? undefined : FadeIn.duration(DURATION.short4)}
            style={[StyleSheet.absoluteFill, { backgroundColor: flavor.accent }]}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: SPACE.md,
  },
  band: {
    height: 2,
    marginHorizontal: SPACE.margin,
    borderRadius: SHAPE.full,
    overflow: 'hidden',
  },
})
