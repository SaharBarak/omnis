import type { Group } from '@pleiad/api-client'
import { useRouter } from 'expo-router'
import { PlusIcon, TrashIcon } from 'phosphor-react-native'
import { useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CircleSheet } from '@/components/circles/circle-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { Button, Divider, Eyebrow, Panel } from '@/components/ui/primitives'
import { ToastHost } from '@/components/ui/toast'
import { useDeleteGroup, useGroup, useGroups } from '@/lib/groups/hooks'
import { COLORS, DURATION, RADII, SPACE, TYPE } from '@/theme/tokens'

/**
 * S11 Circles — the group library (F7). Hairline-divided rows: name, member
 * avatar stack (initials, max five + overflow), member-count eyebrow. FAB
 * opens the create sheet; swipe-left removes with a confirm.
 */

const SKELETON_ROWS = 4
const STAGGER_CAP = 8
const STACK_MAX = 5

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}

/** Overlapping initials circles — max five, then a '+N' overflow disc. */
function AvatarStack({ names }: { names: string[] }) {
  const shown = names.slice(0, STACK_MAX)
  const overflow = names.length - shown.length
  return (
    <View style={styles.stack}>
      {shown.map((name, index) => (
        <View
          key={`${name}-${index}`}
          style={[styles.stackAvatar, index > 0 && styles.stackOverlap]}
        >
          <Text style={styles.stackText}>{initialsOf(name)}</Text>
        </View>
      ))}
      {overflow > 0 && (
        <View style={[styles.stackAvatar, styles.stackOverlap, styles.stackMore]}>
          <Text style={styles.stackText}>+{overflow}</Text>
        </View>
      )}
    </View>
  )
}

function DeleteAction({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.deleteAction}
      accessibilityRole="button"
      accessibilityLabel="Remove circle"
    >
      <TrashIcon size={20} color={COLORS.text90} />
    </Pressable>
  )
}

function CircleRow({
  group,
  index,
  animateIn,
  onPress,
  onDelete,
}: {
  group: Group
  index: number
  animateIn: boolean
  onPress: () => void
  onDelete: () => void
}) {
  // Detail rows share the ['groups', id] cache with the analysis screen, so
  // the stack fills in as each circle's members land (and stays cached).
  const { group: detail } = useGroup(group.id)
  const memberNames = detail?.members.map((member) => member.name) ?? []
  const countLabel =
    detail === undefined
      ? 'CIRCLE'
      : `${detail.members.length} ${detail.members.length === 1 ? 'PERSON' : 'PEOPLE'}`

  const confirmDelete = () => {
    Alert.alert(
      `Remove ${group.name}?`,
      'The circle dissolves. The people stay on your map.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onDelete },
      ]
    )
  }

  return (
    <Animated.View
      entering={
        animateIn
          ? FadeInUp.duration(DURATION.slow).delay(Math.min(index, STAGGER_CAP) * 60)
          : undefined
      }
    >
      <ReanimatedSwipeable
        overshootRight={false}
        renderRightActions={() => <DeleteAction onPress={confirmDelete} />}
      >
        <Pressable
          onPress={onPress}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel={group.name}
        >
          <View style={styles.rowBody}>
            <Eyebrow>{countLabel}</Eyebrow>
            <Text style={TYPE.card} numberOfLines={1}>
              {group.name}
            </Text>
            {group.description !== null && group.description.length > 0 && (
              <Text style={styles.rowDescription} numberOfLines={1}>
                {group.description}
              </Text>
            )}
          </View>
          {memberNames.length > 0 && <AvatarStack names={memberNames} />}
        </Pressable>
      </ReanimatedSwipeable>
    </Animated.View>
  )
}

/** Skeleton rows matching the final layout — shimmer, never a spinner. */
function SkeletonRows() {
  const reduced = useReducedMotion()
  const pulse = useSharedValue(0.45)

  useEffect(() => {
    if (reduced) return
    pulse.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true)
  }, [reduced, pulse])

  const shimmer = useAnimatedStyle(() => ({ opacity: pulse.value }))

  return (
    <View>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <View key={index}>
          <Animated.View style={[styles.row, shimmer]}>
            <View style={styles.rowBody}>
              <View style={[styles.skeletonBlock, styles.skeletonLine]} />
              <View style={[styles.skeletonBlock, styles.skeletonName]} />
            </View>
            <View style={[styles.skeletonBlock, styles.skeletonStack]} />
          </Animated.View>
          {index < SKELETON_ROWS - 1 && <Divider />}
        </View>
      ))}
    </View>
  )
}

export default function CirclesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { groups, isPending, isError, isRefetching, refetch } = useGroups()
  const deleteGroup = useDeleteGroup()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [hasSettled, setHasSettled] = useState(false)

  // Stagger the cascade only on the first data landing, once per mount.
  useEffect(() => {
    if (!isPending && !hasSettled) {
      const timer = setTimeout(() => setHasSettled(true), 900)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isPending, hasSettled])

  const countLabel = `${groups.length} ${groups.length === 1 ? 'CIRCLE' : 'CIRCLES'}`

  const renderBody = () => {
    if (isPending) return <SkeletonRows />

    if (isError) {
      return (
        <Panel style={styles.errorPanel}>
          <Text style={TYPE.card}>Your circles are out of reach.</Text>
          <Text style={styles.errorBody}>
            We couldn't load them. They're safe — check your connection.
          </Text>
          <Button variant="secondary" onPress={refetch} disabled={isRefetching}>
            {isRefetching ? 'Trying…' : 'Try again'}
          </Button>
        </Panel>
      )
    }

    if (groups.length === 0) {
      return (
        <EmptyState
          title="Your family is not your team."
          body="Group your people into circles and read each dynamic on its own."
          actionLabel="Create a circle"
          onAction={() => setSheetOpen(true)}
        />
      )
    }

    return (
      <FlatList
        data={groups}
        keyExtractor={(group) => group.id}
        ItemSeparatorComponent={Divider}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <CircleRow
            group={item}
            index={index}
            animateIn={!hasSettled}
            onPress={() =>
              router.push({ pathname: '/circle/[id]', params: { id: item.id } })
            }
            onDelete={() => deleteGroup.mutate(item.id)}
          />
        )}
      />
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + SPACE.gutter }]}>
      <View style={styles.header}>
        <Eyebrow>{countLabel}</Eyebrow>
        <Text style={TYPE.zone}>Circles</Text>
      </View>

      <View style={styles.body}>{renderBody()}</View>

      <Pressable
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="Create a circle"
      >
        <PlusIcon size={24} color="#FFFFFF" />
      </Pressable>

      <CircleSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />

      <ToastHost />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: SPACE.gutter,
    gap: 6,
  },
  body: {
    flex: 1,
    marginTop: SPACE.unit * 3,
  },
  listContent: {
    paddingBottom: 96,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: SPACE.gutter,
    backgroundColor: COLORS.ground,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowDescription: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stackOverlap: {
    marginLeft: -10,
  },
  stackMore: {
    backgroundColor: COLORS.surface,
  },
  stackText: {
    ...TYPE.eyebrow,
    fontSize: 9,
    letterSpacing: 0.5,
    color: COLORS.text70,
  },
  deleteAction: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.destructive,
  },
  skeletonBlock: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.button,
  },
  skeletonName: {
    height: 16,
    width: '52%',
  },
  skeletonLine: {
    height: 10,
    width: '32%',
  },
  skeletonStack: {
    height: 32,
    width: 96,
    borderRadius: 16,
  },
  errorPanel: {
    marginHorizontal: SPACE.gutter,
    gap: 14,
  },
  errorBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  fab: {
    position: 'absolute',
    right: SPACE.gutter,
    bottom: SPACE.gutter + 4,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.25,
    elevation: 4,
  },
  fabPressed: {
    transform: [{ scale: 0.98 }],
  },
})
