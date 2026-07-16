import { StyleSheet, View } from 'react-native'

import { BrandMark } from '@/components/brand-mark'
import { Button, Text } from '@/components/m3'
import { SPACE } from '@/theme/m3'

/**
 * An empty surface, composed rather than blank: the mark, a sentence that says
 * what would fill it, and the one action that would.
 */
export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string
  body?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View style={styles.root}>
      <BrandMark size={48} />

      <Text variant="headlineSmall" color="onSurface" style={styles.centered}>
        {title}
      </Text>

      {body !== undefined && (
        <Text variant="bodyLarge" color="onSurfaceVariant" style={styles.centered}>
          {body}
        </Text>
      )}

      {actionLabel !== undefined && (
        <View style={styles.action}>
          <Button onPress={onAction}>{actionLabel}</Button>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.md,
    paddingHorizontal: SPACE.xxl,
  },
  centered: {
    textAlign: 'center',
  },
  action: {
    marginTop: SPACE.sm,
  },
})
