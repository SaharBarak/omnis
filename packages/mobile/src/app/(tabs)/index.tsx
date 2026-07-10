import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getTodayAcrossSystems } from '@pleiad/engine/services/today'

import { BrandMark } from '@/components/brand-mark'
import { TodayBoard } from '@/components/today/board'
import { Eyebrow, Panel } from '@/components/ui/primitives'
import { SPACE, TYPE } from '@/theme/tokens'

/**
 * Today (home) — S5. Live board computed on-device (offline-capable);
 * Hebrew date degrades to an em dash where Hermes lacks the calendar.
 */
export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const today = useMemo(() => new Date(), [])
  const board = useMemo(() => getTodayAcrossSystems(today), [today])

  const rows = useMemo(
    () => [
      { label: 'Kin', value: board.kin.toUpperCase() },
      { label: 'Moon', value: board.moon.toUpperCase() },
      { label: 'Sun', value: board.sun.toUpperCase() },
      { label: 'Gate', value: board.gate.toUpperCase() },
      { label: 'Hebrew', value: (board.hebrewDate ?? '—').toUpperCase() },
    ],
    [board]
  )

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACE.gutter },
      ]}
    >
      <View style={styles.header}>
        <BrandMark size={26} />
        <Eyebrow>
          {today
            .toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })
            .toUpperCase()}
        </Eyebrow>
      </View>

      <Text style={TYPE.zone}>Today, across the systems.</Text>

      <Panel feature>
        <TodayBoard rows={rows} />
        <Text style={[TYPE.bodySm, styles.caption]}>(the calendars never stop)</Text>
      </Panel>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: SPACE.gutter,
    gap: SPACE.section,
    paddingBottom: SPACE.section,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caption: {
    marginTop: 12,
  },
})
