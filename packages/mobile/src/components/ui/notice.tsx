import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from '@/components/m3'
import { SHAPE, SPACE, useTheme, type M3ColorRole } from '@/theme/m3'

/**
 * An inline banner — caution, info, error, success.
 *
 * M3 ships a colour-role pair for exactly one of these (error), so the other
 * three are mapped onto the container roles whose *meaning* is closest rather
 * than invented as new colours:
 *
 *   warning → tertiary, which this seed derives as a gold — the caution colour
 *   info    → secondary, the quiet supporting role
 *   success → primary, the affirmative one
 *
 * That mapping is a judgement call, not a spec, and it is written down here so
 * the next person doesn't have to reverse-engineer it from the hexes.
 */

export type NoticeVariant = 'warning' | 'info' | 'error' | 'success'

const CONTAINER: Record<NoticeVariant, M3ColorRole> = {
  warning: 'tertiaryContainer',
  info: 'secondaryContainer',
  error: 'errorContainer',
  success: 'primaryContainer',
}

const ON_CONTAINER: Record<NoticeVariant, M3ColorRole> = {
  warning: 'onTertiaryContainer',
  info: 'onSecondaryContainer',
  error: 'onErrorContainer',
  success: 'onPrimaryContainer',
}

export function Notice({
  variant = 'info',
  title,
  children,
  action,
}: {
  variant?: NoticeVariant
  title?: string
  children: ReactNode
  action?: ReactNode
}) {
  const theme = useTheme()
  const container = theme.colors[CONTAINER[variant]]
  const content = theme.colors[ON_CONTAINER[variant]]

  return (
    <View
      accessibilityRole={variant === 'error' ? 'alert' : 'text'}
      style={[styles.root, { backgroundColor: container }]}
    >
      {title !== undefined && (
        <Text variant="titleSmall" color={content}>
          {title}
        </Text>
      )}
      <Text variant="bodyMedium" color={content}>
        {children}
      </Text>
      {action !== undefined && <View style={styles.action}>{action}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    borderRadius: SHAPE.medium,
    padding: SPACE.lg,
    gap: SPACE.xs,
  },
  action: {
    marginTop: SPACE.sm,
    alignSelf: 'flex-start',
  },
})
