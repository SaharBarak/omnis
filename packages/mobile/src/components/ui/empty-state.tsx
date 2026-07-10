import { StyleSheet, Text, View } from 'react-native'

import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/primitives'
import { SPACE, TYPE } from '@/theme/tokens'

/** Composed empty state — DESIGN_LANGUAGE §7. Never a bare "no data". */
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
      <BrandMark size={44} />
      <Text style={[TYPE.section, styles.centered]}>{title}</Text>
      {body != null && <Text style={[TYPE.body, styles.centered]}>{body}</Text>}
      {actionLabel != null && (
        <Button onPress={onAction} style={styles.action}>
          {actionLabel}
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: SPACE.section,
  },
  centered: {
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
})
