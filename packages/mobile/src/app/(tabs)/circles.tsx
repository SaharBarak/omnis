import type { Group } from '@pleiad/api-client'
import { useRouter } from 'expo-router'
import { PlusIcon, TrashIcon } from 'phosphor-react-native'
import { useEffect, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { CircleSheet } from '@/components/circles/circle-sheet'
import {
  Divider,
  Fab,
  LARGE_TITLE_COLLAPSE_DISTANCE,
  ListItem,
  NAVIGATION_BAR_HEIGHT,
  Text,
  TopAppBar,
  Touchable,
  useScrollProgress,
} from '@/components/m3'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useDeleteGroup, useGroup, useGroups } from '@/lib/groups/hooks'
import { DURATION, SHAPE, SPACE, useTheme } from '@/theme/m3'
import { initialsOf } from '@/lib/text'

/**
 * Circles — the group library (F7). One M3 list item per circle: member count
 * as the overline, the name, the description, and a member avatar stack
 * (initials, max five + overflow) as the trailing element. The extended FAB
 * opens the create sheet; swipe-left removes with a confirm.
 */

const SKELETON_ROWS = 4
const STAGGER_CAP = 8
const STACK_MAX = 5
const LIST_ITEM_HEIGHT = 88
const STACK_AVATAR_SIZE = 32

/** Overlapping initials circles — max five, then a '+N' overflow disc. */
function AvatarStack({ names }: { names: string[] }) {
  const theme = useTheme()
  const shown = names.slice(0, STACK_MAX)
  const overflow = names.length - shown.length

  const disc = {
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderColor: theme.colors.outlineVariant,
  }

  return (
    <View style={styles.stack}>
      {shown.map((name, index) => (
        <View
          key={`${name}-${index}`}
          style={[styles.stackAvatar, disc, index > 0 && styles.stackOverlap]}
        >
          <Text variant="labelSmall" color="onSurfaceVariant">
            {initialsOf(name)}
          </Text>
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.stackAvatar,
            disc,
            styles.stackOverlap,
            // The counter reads as the odd one out, so it sits a step lower on
            // the surface ladder than the faces it's counting.
            { backgroundColor: theme.colors.surfaceContainerHigh },
          ]}
        >
          <Text variant="labelSmall" color="onSurfaceVariant">
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  )
}

function DeleteAction({ onPress }: { onPress: () => void }) {
  const theme = useTheme()
  return (
    <Touchable
      onPress={onPress}
      stateLayerColor={theme.colors.onErrorContainer}
      accessibilityRole="button"
      accessibilityLabel="Remove circle"
      style={[styles.deleteAction, { backgroundColor: theme.colors.errorContainer }]}
    >
      <TrashIcon size={24} color={theme.colors.onErrorContainer} />
    </Touchable>
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
  const theme = useTheme()

  // Detail rows share the ['groups', id] cache with the analysis screen, so
  // the stack fills in as each circle's members land (and stays cached).
  const { group: detail } = useGroup(group.id)
  const memberNames = detail?.members.map((member) => member.name) ?? []

  const countLabel =
    detail === undefined
      ? 'Circle'
      : `${detail.members.length} ${detail.members.length === 1 ? 'person' : 'people'}`

  const description =
    group.description !== null && group.description.length > 0 ? group.description : undefined

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
          ? FadeInUp.duration(DURATION.medium2).delay(Math.min(index, STAGGER_CAP) * 60)
          : undefined
      }
    >
      <ReanimatedSwipeable
        overshootRight={false}
        renderRightActions={() => <DeleteAction onPress={confirmDelete} />}
      >
        {/*
         * The row is opaque — and it has to be, because it slides over the
         * delete action underneath it. A transparent row would show the red
         * through the circle's name for the whole gesture.
         */}
        <View style={{ backgroundColor: theme.colors.surface }}>
          <ListItem
            overline={countLabel}
            headline={group.name}
            supportingText={description}
            trailing={memberNames.length > 0 ? <AvatarStack names={memberNames} /> : undefined}
            onPress={onPress}
            accessibilityLabel={group.name}
          />
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  )
}

/**
 * Full-bleed, not inset: a circle row has no leading element, so its text
 * starts at the screen margin. M3's inset divider indents past a 40dp leading
 * avatar, and here that would start the rule well to the right of the text.
 */
function RowSeparator() {
  return <Divider />
}

/** Skeleton rows matching the final layout — shimmer, never a spinner. */
function SkeletonRows() {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const pulse = useSharedValue(0.45)

  useEffect(() => {
    if (reduced) return
    pulse.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true)
  }, [reduced, pulse])

  const shimmer = useAnimatedStyle(() => ({ opacity: pulse.value }))
  const block = { backgroundColor: theme.colors.surfaceContainerHighest }

  return (
    <View>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <View key={index}>
          <Animated.View style={[styles.skeletonRow, shimmer]}>
            <View style={styles.skeletonBody}>
              <View style={[styles.skeletonBlock, styles.skeletonLine, block]} />
              <View style={[styles.skeletonBlock, styles.skeletonName, block]} />
            </View>
            <View style={[styles.skeletonBlock, styles.skeletonStack, block]} />
          </Animated.View>
          {index < SKELETON_ROWS - 1 && <Divider />}
        </View>
      ))}
    </View>
  )
}

export default function CirclesScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { progress, onScroll } = useScrollProgress(LARGE_TITLE_COLLAPSE_DISTANCE)

  const { groups, isPending, isError, isRefetching, refetch } = useGroups()
  const deleteGroup = useDeleteGroup()

  // The empty state carries this same action as its one filled button.
  const showFab = !isPending && !isError && groups.length > 0

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

  const countLabel = `${groups.length} ${groups.length === 1 ? 'circle' : 'circles'}`

  const renderBody = () => {
    if (isPending) return <SkeletonRows />

    if (isError) {
      return (
        <View style={styles.errorWrap}>
          <ErrorState
            message="Your circles are out of reach. We couldn't load them — they're safe; check your connection."
            retryLabel={isRefetching ? 'Trying…' : 'Try again'}
            onRetry={() => {
              if (!isRefetching) refetch()
            }}
          />
        </View>
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
      <Animated.FlatList
        data={groups}
        keyExtractor={(group) => group.id}
        ItemSeparatorComponent={RowSeparator}
        contentContainerStyle={styles.listContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isPending}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.surfaceAt(2)}
          />
        }
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
    <View style={styles.screen}>
      <TopAppBar title="Circles" variant="large" progress={progress} />

      <View style={styles.header}>
        <Text variant="labelLarge" color="onSurfaceVariant">
          {countLabel}
        </Text>
      </View>

      <View style={styles.body}>{renderBody()}</View>


      {/*
       * The FAB stands down while the empty state is up. That screen already
       * offers this exact action as its one filled button, and M3 allows a
       * screen one primary action — two of them, three inches apart, saying the
       * same thing, is just a question about which one is the real one.
       */}
      {showFab && (
        <View style={styles.fab}>
          <Fab
            icon={(color) => <PlusIcon size={24} color={color} />}
            label="Create circle"
            collapseProgress={progress}
            onPress={() => setSheetOpen(true)}
            accessibilityLabel="Create a circle"
          />
        </View>
      )}

      <CircleSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACE.margin,
  },
  body: {
    flex: 1,
    marginTop: SPACE.lg,
  },
  listContent: {
    paddingBottom: NAVIGATION_BAR_HEIGHT + SPACE.xxl,
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: STACK_AVATAR_SIZE,
    height: STACK_AVATAR_SIZE,
    borderRadius: STACK_AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stackOverlap: {
    marginLeft: -10,
  },
  deleteAction: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    minHeight: LIST_ITEM_HEIGHT,
    paddingHorizontal: SPACE.margin,
    paddingVertical: SPACE.sm,
  },
  skeletonBody: {
    flex: 1,
    gap: SPACE.sm,
  },
  skeletonBlock: {
    borderRadius: SHAPE.extraSmall,
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
    height: STACK_AVATAR_SIZE,
    width: 96,
    borderRadius: SHAPE.large,
  },
  errorWrap: {
    paddingHorizontal: SPACE.margin,
  },
  fab: {
    position: 'absolute',
    right: SPACE.margin,
    bottom: SPACE.lg,
  },
})
