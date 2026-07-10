import type { PropsWithChildren } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated'

import { Button, Eyebrow, Pill } from '@/components/ui/primitives'
import { COLORS, DURATION, RADII, SPACE, TYPE, type SystemFlavor } from '@/theme/tokens'

/**
 * S8 page grammar — one scaffold, five flavored skins (DESIGN_LANGUAGE §1.3).
 * Sections separate with flavor-tinted hairlines, never card boxes; content
 * staggers up 60ms per section on the page's first view.
 */

const STAGGER_MS = 60

/** Dreamspell seal colors — vivid, untouched (DESIGN_LANGUAGE §1.3). */
export const SEAL_COLOR_HEX: Record<string, string> = {
  red: 'hsl(4, 72%, 58%)',
  white: 'hsl(0, 0%, 96%)',
  blue: 'hsl(215, 65%, 62%)',
  yellow: 'hsl(45, 90%, 55%)',
}

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

/** One content section: flavored hairline (after the first), eyebrow, body. */
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
        reduced ? undefined : FadeInUp.duration(DURATION.slow).delay(index * STAGGER_MS)
      }
      style={[styles.section, style]}
    >
      {index > 0 && (
        <View style={[styles.flavorHairline, { backgroundColor: flavor.accent }]} />
      )}
      {eyebrow !== undefined && <Eyebrow color={flavor.accentSoft}>{eyebrow}</Eyebrow>}
      {children}
    </Animated.View>
  )
}

/** Hairline data row: mono label left, value right. Lists, never boxes. */
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
  mono?: boolean
  last?: boolean
}) {
  return (
    <View style={[styles.dataRow, !last && styles.dataRowBorder]}>
      <Text style={styles.dataLabel}>{label}</Text>
      <View style={styles.dataValueBlock}>
        <Text style={[mono ? styles.dataValueMono : styles.dataValue]}>{value}</Text>
        {detail !== undefined && <Text style={styles.dataDetail}>{detail}</Text>}
      </View>
    </View>
  )
}

/** Word-sized stat (sign names, HD words) — mono, brandBright, statLabel. */
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
      <Text style={styles.statWord} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={TYPE.statLabel}>{label}</Text>
    </View>
  )
}

/** Flavored action chip — the honest-partial-state path back to the sheet. */
export function AddDataChip({
  label,
  flavor,
  onPress,
}: {
  label: string
  flavor: SystemFlavor
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.addChip, { borderColor: flavor.accent }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[TYPE.eyebrow, { color: flavor.accentSoft }]}>{label}</Text>
    </Pressable>
  )
}

/** Thin horizontal balance bar — no chart lib, flavor accent fill. */
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
  const ratio = max > 0 ? Math.min(1, value / max) : 0
  return (
    <View style={styles.meterRow}>
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterTrack}>
        <View
          style={[
            styles.meterFill,
            { backgroundColor: flavor.accent, width: `${Math.round(ratio * 100)}%` },
          ]}
        />
      </View>
      <Text style={styles.meterValue}>{value}</Text>
    </View>
  )
}

/**
 * Entitlement lock — blurred-feel preview (opacity, no real blur) under a
 * centered flavor-accented lock panel. Dreamspell never renders this.
 */
export function LockedPage({
  flavor,
  systemName,
  onUnlock,
  children,
}: PropsWithChildren<{
  flavor: SystemFlavor
  systemName: string
  onUnlock: () => void
}>) {
  return (
    <View style={styles.lockRoot}>
      <View style={styles.lockPreview} pointerEvents="none">
        {children}
      </View>
      <View style={styles.lockOverlay} pointerEvents="box-none">
        <View style={styles.lockPanel}>
          <Pill accent={flavor.accent}>EXPLORER UNLOCKS THIS LAYER</Pill>
          <Text style={styles.lockBody}>
            The {systemName} reading is already computed and waiting under this veil.
          </Text>
          <Button variant="secondary" onPress={onUnlock} style={styles.lockButton}>
            See plans
          </Button>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: SPACE.gutter,
    paddingTop: SPACE.cardPad,
    paddingBottom: SPACE.section * 2,
    gap: SPACE.section,
  },
  section: {
    gap: 14,
  },
  flavorHairline: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.35,
    marginBottom: 4,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.cardPad,
    paddingVertical: 14,
  },
  dataRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  dataLabel: {
    ...TYPE.eyebrow,
    paddingTop: 3,
  },
  dataValueBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  dataValue: {
    ...TYPE.body,
    color: COLORS.text90,
    textAlign: 'right',
  },
  dataValueMono: {
    ...TYPE.stat,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
  },
  dataDetail: {
    ...TYPE.bodySm,
    color: COLORS.text50,
    textAlign: 'right',
  },
  statWord: {
    ...TYPE.stat,
    fontSize: 18,
    lineHeight: 24,
  },
  addChip: {
    alignSelf: 'flex-start',
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  meterLabel: {
    ...TYPE.eyebrow,
    width: 76,
  },
  meterTrack: {
    flex: 1,
    height: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface2,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  meterValue: {
    ...TYPE.statLabel,
    width: 24,
    textAlign: 'right',
  },
  lockRoot: {
    flex: 1,
  },
  lockPreview: {
    flex: 1,
    opacity: 0.35,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.section,
  },
  lockPanel: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: COLORS.cardFill,
    borderRadius: RADII.feature,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.featurePad,
  },
  lockBody: {
    ...TYPE.body,
    color: COLORS.text70,
  },
  lockButton: {
    alignSelf: 'stretch',
  },
})
