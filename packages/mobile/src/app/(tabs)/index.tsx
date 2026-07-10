import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { dateToKin } from '@pleiad/engine/calculations/dreamspell'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'

import { BrandMark } from '@/components/brand-mark'
import { Eyebrow, Panel, StatNumber } from '@/components/ui/primitives'
import { COLORS, FLAVORS, SPACE, TYPE } from '@/theme/tokens'

/**
 * Today (home) — S5. v0 slice: live on-device kin for today. Split-flap
 * board, daily reading, checklist and people rows arrive with M1/M2.
 */
export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const today = new Date()
  const isoDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
  const kin = dateToKin(isoDate)
  const seal = SEALS[(kin - 1) % 20]
  const tone = TONES[(kin - 1) % 13]

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

      <Panel feature style={styles.board}>
        <Eyebrow color={FLAVORS.dreamspell.accentSoft}>Dreamspell</Eyebrow>
        <View style={styles.boardRow}>
          <StatNumber value={`KIN ${kin}`} label={`${tone?.name ?? ''} ${seal?.english ?? ''}`} />
        </View>
        <Text style={TYPE.bodySm}>
          The calendars never stop. Full board — moon, sun, gate, Hebrew date —
          lands here next.
        </Text>
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
  board: {
    gap: 12,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
})
