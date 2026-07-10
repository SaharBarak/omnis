import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '@/components/ui/empty-state'

/** Circles — designed empty state; feature slice arrives per milestone plan. */
export default function CirclesScreen() {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <EmptyState
        title="Your family is not your team."
        body="Group your people into circles and read each dynamic on its own."
        actionLabel="Create a circle"      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
})
