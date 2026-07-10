import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '@/components/ui/empty-state'

/** Library — designed empty state; feature slice arrives per milestone plan. */
export default function LibraryScreen() {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <EmptyState
        title="Every line on the map has sources."
        body="Six traditions, explained calmly. Search lands here soon."
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
})
