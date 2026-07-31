import type { PropsWithChildren } from 'react'
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated'

import { Button, Card, Chip, Divider, Text } from '@/components/m3'
import { DURATION, SHAPE, SPACE, alpha, useTheme } from '@/theme/m3'
import type { SystemFlavor } from '@/theme/tokens'

export { SEAL_COLOR_HEX } from '@/theme/tokens'

/**
 * The grammar every reading page is written in — one scaffold, every system.
 *
 * A system's flavour reaches exactly two things: the eyebrow above a section,
 * and the meter fills. Layout, spacing, type, and every surface underneath come
 * from the M3 theme and are identical across all of them, so switching systems
 * changes the reading, not the furniture.
 */

const STAGGER_MS = 60

export function ReadingPage({ children }: PropsWithChildren) {
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  )
}

/** One section: a flavoured label, a hairline above it, and the content. */
export function PageSection({
  index,
  flavor,
  eyebrow,
  children,
  style,
}: PropsWithChildren<{
  index: number
  flavor: SystemFlavor
  eyebrow?: string
  style?: StyleProp<ViewStyle>
}>) {
  const reduced = useReducedMotion()

  return (
    <Animated.View
      entering={
        reduced
          ? undefined
          : FadeInUp.duration(DURATION.medium4).delay(index * STAGGER_MS)
      }
      style={[styles.section, style]}
    >
      {index > 0 && <Divider />}
      {eyebrow !== undefined && (
        <Text variant="labelLarge" color={flavor.accentSoft}>
          {eyebrow}
        </Text>
      )}
      {children}
    </Animated.View>
  )
}

/** Label left, value right, hairline under. The workhorse of every reading. */
export function DataRow({
  label,
  value,
  detail,
  mono = false,
  last = false,
}: {
  label: string
  value: string
  detail?: string
  /** Numerals — kin, gates, gematria values. Renders tabular. */
  mono?: boolean
  last?: boolean
}) {
  return (
    <View>
      <View style={styles.dataRow}>
        <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.dataLabel}>
          {label}
        </Text>
        <View style={styles.dataValueBlock}>
          <Text
            variant={mono ? 'dataMedium' : 'bodyLarge'}
            color="onSurface"
            style={styles.right}
          >
            {value}
          </Text>
          {detail !== undefined && (
            <Text variant="bodySmall" color="onSurfaceVariant" style={styles.right}>
              {detail}
            </Text>
          )}
        </View>
      </View>
      {!last && <Divider />}
    </View>
  )
}

/** A word-sized figure — a sign name, a Human Design type. */
export function StatWord({
  value,
  label,
  style,
}: {
  value: string
  label: string
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={style}>
      <Text
        variant="titleLarge"
        color="primary"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text variant="labelMedium" color="onSurfaceVariant">
        {label}
      </Text>
    </View>
  )
}

/**
 * The way out of an honest-partial reading: the chart is missing a birth time
 * or a Hebrew name, and this is the chip that goes and gets it.
 */
export function AddDataChip({
  label,
  onPress,
}: {
  label: string
  /** Kept for call-site symmetry with the other scaffold parts. */
  flavor?: SystemFlavor
  onPress: () => void
}) {
  return <Chip label={label} variant="assist" onPress={onPress} />
}

/** A thin balance bar. No chart library — it's one div's worth of information. */
export function MeterBar({
  label,
  value,
  max,
  flavor,
}: {
  label: string
  value: number
  max: number
  flavor: SystemFlavor
}) {
  const theme = useTheme()
  const ratio = max > 0 ? Math.min(1, value / max) : 0

  return (
    <View style={styles.meterRow}>
      <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.meterLabel}>
        {label}
      </Text>
      <View
        style={[
          styles.meterTrack,
          { backgroundColor: theme.colors.surfaceContainerHighest },
        ]}
      >
        <View
          style={[
            styles.meterFill,
            { backgroundColor: flavor.accent, width: `${Math.round(ratio * 100)}%` },
          ]}
        />
      </View>
      <Text variant="dataSmall" color="onSurfaceVariant" style={styles.meterValue}>
        {String(value)}
      </Text>
    </View>
  )
}

/**
 * A locked system — the reading exists and is already computed; the user just
 * can't read it yet.
 *
 * The preview stays visible underneath at low opacity rather than being
 * replaced by a wall, because what's being sold is the thing behind the veil.
 */
export function LockedPage({
  systemName,
  onUnlock,
  pill = 'Explorer unlocks this layer',
  body,
  children,
}: PropsWithChildren<{
  flavor?: SystemFlavor
  systemName: string
  onUnlock: () => void
  pill?: string
  body?: string
}>) {
  const theme = useTheme()

  return (
    <View style={styles.lockRoot}>
      <View style={styles.lockPreview} pointerEvents="none">
        {children}
      </View>

      {/* A scrim over the preview — legible text needs a floor under it. */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: alpha(theme.colors.scrim, 0.4) },
        ]}
      />

      <View style={styles.lockOverlay} pointerEvents="box-none">
        <Card variant="elevated">
          <Chip label={pill} variant="suggestion" />
          <Text variant="bodyLarge" color="onSurface" style={styles.lockBody}>
            {body ??
              `The ${systemName} reading is already computed and waiting under this veil.`}
          </Text>
          <Button onPress={onUnlock} fullWidth>
            See plans
          </Button>
        </Card>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: SPACE.margin,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.xxl * 2,
    gap: SPACE.xl,
  },
  section: {
    gap: SPACE.md,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  dataLabel: {
    paddingTop: 2,
  },
  dataValueBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  right: {
    textAlign: 'right',
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingVertical: SPACE.xs,
  },
  meterLabel: {
    width: 84,
  },
  meterTrack: {
    flex: 1,
    height: 4,
    borderRadius: SHAPE.full,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: SHAPE.full,
  },
  meterValue: {
    width: 28,
    textAlign: 'right',
  },
  lockRoot: {
    flex: 1,
  },
  lockPreview: {
    flex: 1,
    opacity: 0.4,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
  },
  lockBody: {
    marginTop: SPACE.md,
    marginBottom: SPACE.lg,
  },
})
