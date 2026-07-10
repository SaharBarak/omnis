import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '@/components/ui/empty-state'

/** People — designed empty state; feature slice arrives per milestone plan. */
export default function PeopleScreen() {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <EmptyState
        title="Your map starts with one birthday."
        body="Add the first person you carry with you — the reading is instant."
        actionLabel="Add a person"      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
})
