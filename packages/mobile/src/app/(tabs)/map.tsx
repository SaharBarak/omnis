import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '@/components/ui/empty-state'

/** Map — designed empty state; feature slice arrives per milestone plan. */
export default function MapScreen() {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <EmptyState
        title="Your map needs two stars."
        body="Add two people and Pleiad draws the lines between them."
        actionLabel="Add people"      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
})
