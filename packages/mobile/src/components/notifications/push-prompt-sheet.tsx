import { StyleSheet, View } from 'react-native'

import { BottomSheet, Button, Text } from '@/components/m3'
import { usePushOptIn } from '@/lib/notifications/opt-in'
import { registerForPush } from '@/lib/notifications/push'
import { SPACE } from '@/theme/m3'

/**
 * F9 opt-in moment — the one-time morning-digest invitation, shown after
 * the first person lands on the map (never on launch). Either answer
 * dismisses it for good; the permission dialog itself only appears on
 * accept.
 */
export function PushPromptHost() {
  const visible = usePushOptIn((state) => state.visible)
  const dismiss = usePushOptIn((state) => state.dismiss)

  const enable = () => {
    dismiss()
    // Permission dialog + token registration run behind the close; every
    // dead end (denied, Expo Go, simulator) resolves silently.
    void registerForPush()
  }

  return (
    <BottomSheet visible={visible} onClose={dismiss}>
      <View style={styles.copy}>
        <Text variant="labelLarge" color="primary">
          Daily sky
        </Text>
        <Text variant="headlineSmall">The calendars move every morning.</Text>
        <Text variant="bodyLarge" color="onSurfaceVariant">
          One quiet note a day: today&apos;s kin, the moon, and which of your
          people resonate with the sky. Nothing else, ever.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button fullWidth onPress={enable}>
          Enable the morning digest
        </Button>
        <Button variant="text" fullWidth onPress={dismiss}>
          Not now
        </Button>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  copy: {
    gap: SPACE.sm,
  },
  actions: {
    gap: SPACE.sm,
    marginTop: SPACE.xl,
  },
})
