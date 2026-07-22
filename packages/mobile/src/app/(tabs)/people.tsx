import type { PersonWithTags } from '@pleiad/api-client'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { useRouter } from 'expo-router'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from 'phosphor-react-native'
import { useEffect, useMemo, useState } from 'react'
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

import { PaywallSheet } from '@/components/billing/paywall-sheet'
import { Glyph } from '@/components/glyph'
import {
  Divider,
  Fab,
  LARGE_TITLE_COLLAPSE_DISTANCE,
  ListItem,
  NAVIGATION_BAR_HEIGHT,
  Text,
  TextField,
  TopAppBar,
  Touchable,
  useScrollProgress,
} from '@/components/m3'
import { CaptureSheet } from '@/components/people/capture-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useSubscription } from '@/lib/api'
import { useDeletePerson, usePeople } from '@/lib/people/hooks'
import { DURATION, SHAPE, SPACE, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'
import { initialsOf, sentenceCase } from '@/lib/text'

/**
 * People — the library. One M3 list item per person, the dreamspell line as its
 * supporting text, an extended FAB to capture a new one, swipe-left to remove.
 * All four states ship: skeleton, invitation, inline retry, tactile success
 * (via the sheet).
 */

const SKELETON_ROWS = 6
const STAGGER_CAP = 8
const LIST_ITEM_HEIGHT = 72
/** Matches the 40dp leading element `Divider inset` indents past. */
const AVATAR_SIZE = 40

function dreamspellLine(birthDate: string): string {
  try {
    const kin = dateToKin(birthDate)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return `Kin ${kin} · ${sentenceCase(seal.color)} ${tone.name} ${seal.english}`
  } catch {
    return birthDate
  }
}

/** The person's Dreamspell seal number, or null for an uncomputable date. */
function sealNumberOf(birthDate: string): number | null {
  try {
    return kinToSeal(dateToKin(birthDate))
  } catch {
    return null
  }
}

function PersonAvatar({
  name,
  isSelf,
  seal,
}: {
  name: string
  isSelf: boolean
  seal: number | null
}) {
  const theme = useTheme()
  // You are the one person on this list who isn't someone you added, and the
  // primary container is how M3 says so — the old brand-tinted hairline read as
  // an accident.
  const container = isSelf
    ? theme.colors.primaryContainer
    : theme.colors.surfaceContainerHighest
  const content = isSelf ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant

  return (
    <View style={[styles.avatar, { backgroundColor: container }]}>
      <Text variant="labelLarge" color={content}>
        {initialsOf(name)}
      </Text>
      {/* The seal badge ties the face to its kin — the one reading every person
          has, so it rides every avatar. */}
      {seal !== null && (
        <View
          style={[
            styles.avatarBadge,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Glyph seal={seal} size={13} color={FLAVORS.dreamspell.accent} />
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
      accessibilityLabel="Remove person"
      style={[styles.deleteAction, { backgroundColor: theme.colors.errorContainer }]}
    >
      <TrashIcon size={24} color={theme.colors.onErrorContainer} />
    </Touchable>
  )
}

function PersonRow({
  person,
  index,
  animateIn,
  onPress,
  onDelete,
}: {
  person: PersonWithTags
  index: number
  animateIn: boolean
  onPress: () => void
  onDelete: () => void
}) {
  const theme = useTheme()
  const line = useMemo(() => dreamspellLine(person.birth_date), [person.birth_date])
  const seal = useMemo(() => sealNumberOf(person.birth_date), [person.birth_date])

  const confirmDelete = () => {
    Alert.alert(
      `Remove ${person.name}?`,
      'They leave your map. Adding them again recomputes everything.',
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
         * through the person's name for the whole gesture.
         */}
        <View style={{ backgroundColor: theme.colors.surface }}>
          <ListItem
            headline={person.name}
            supportingText={line}
            leading={
              <PersonAvatar name={person.name} isSelf={person.is_self} seal={seal} />
            }
            onPress={onPress}
            accessibilityLabel={person.name}
          />
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  )
}

function RowSeparator() {
  return <Divider inset />
}

/** Skeleton rows matching the final layout — shimmer 2s, never a spinner. */
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
            <View style={[styles.avatar, block]} />
            <View style={styles.skeletonBody}>
              <View style={[styles.skeletonBlock, styles.skeletonName, block]} />
              <View style={[styles.skeletonBlock, styles.skeletonLine, block]} />
            </View>
          </Animated.View>
          {index < SKELETON_ROWS - 1 && <Divider inset />}
        </View>
      ))}
    </View>
  )
}

export default function PeopleScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { progress, onScroll } = useScrollProgress(LARGE_TITLE_COLLAPSE_DISTANCE)

  const { people, isPending, isError, isRefetching, refetch } = usePeople()
  const subscription = useSubscription()
  const deletePerson = useDeletePerson()

  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [hasSettled, setHasSettled] = useState(false)

  // Stagger the cascade only on the first data landing, once per mount.
  useEffect(() => {
    if (!isPending && !hasSettled) {
      const timer = setTimeout(() => setHasSettled(true), 900)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isPending, hasSettled])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (needle.length === 0) return people
    return people.filter(
      (person) =>
        person.name.toLowerCase().includes(needle) ||
        (person.hebrew_name ?? '').toLowerCase().includes(needle)
    )
  }, [people, search])

  // The self entry is free on every plan, so it must not count against the cap —
  // counting it produced "4 of 3 kept". The server excludes it; so do we.
  const trackedCount = useMemo(
    () => people.filter((person) => !person.is_self).length,
    [people]
  )

  const profileLimit = subscription.data?.usage.profiles.limit ?? null
  const countLabel =
    profileLimit !== null && Number.isFinite(profileLimit)
      ? `${trackedCount} of ${profileLimit} kept`
      : `${trackedCount} kept`

  const showFab = !isPending && !isError && people.length > 0

  const openCapture = () => setSheetOpen(true)

  const refreshControl = (
    <RefreshControl
      refreshing={isRefetching && !isPending}
      onRefresh={refetch}
      tintColor={theme.colors.primary}
      colors={[theme.colors.primary]}
      progressBackgroundColor={theme.surfaceAt(2)}
    />
  )

  const renderBody = () => {
    if (isPending) return <SkeletonRows />

    if (isError) {
      return (
        <View style={styles.errorWrap}>
          <ErrorState
            message="Your people are out of reach. We couldn't load the library, but they're safe; check your connection."
            retryLabel={isRefetching ? 'Trying…' : 'Try again'}
            onRetry={() => {
              if (!isRefetching) refetch()
            }}
          />
        </View>
      )
    }

    if (people.length === 0) {
      return (
        <EmptyState
          title="Your map starts with one birthday."
          body="Add the first person you carry with you: the reading is instant."
          actionLabel="Add a person"
          onAction={openCapture}
        />
      )
    }

    if (filtered.length === 0) {
      return (
        <View style={styles.searchEmpty}>
          <Text variant="bodyLarge" color="onSurfaceVariant">
            No one answers to that name yet.
          </Text>
        </View>
      )
    }

    return (
      <Animated.FlatList
        data={filtered}
        keyExtractor={(person) => person.id}
        ItemSeparatorComponent={RowSeparator}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={refreshControl}
        renderItem={({ item, index }) => (
          <PersonRow
            person={item}
            index={index}
            animateIn={!hasSettled}
            onPress={() =>
              router.push({ pathname: '/person/[id]', params: { id: item.id } })
            }
            onDelete={() => deletePerson.mutate(item.id)}
          />
        )}
      />
    )
  }

  return (
    <View style={styles.screen}>
      <TopAppBar title="People" variant="large" progress={progress} />

      <View style={styles.header}>
        <Text variant="labelLarge" color="onSurfaceVariant">
          {countLabel}
        </Text>

        <TextField
          label="Search your people"
          value={search}
          onChangeText={setSearch}
          leadingIcon={(color) => <MagnifyingGlassIcon size={20} color={color} />}
          autoCorrect={false}
        />
      </View>

      <View style={styles.body}>{renderBody()}</View>

      {/*
       * The FAB stands down while the empty state is up — that screen already
       * offers this action as its one filled button, and M3 gives a screen one
       * primary action.
       */}
      {showFab && (
        <View style={styles.fab}>
          <Fab
            icon={(color) => <PlusIcon size={24} color={color} />}
            label="Add person"
            collapseProgress={progress}
            onPress={openCapture}
            accessibilityLabel="Add a person"
          />
        </View>
      )}

      <CaptureSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onLimitExceeded={() => {
          setSheetOpen(false)
          setPaywallOpen(true)
        }}
      />

      <PaywallSheet
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trigger="people-cap"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACE.margin,
    gap: SPACE.md,
  },
  body: {
    flex: 1,
    marginTop: SPACE.lg,
  },
  listContent: {
    paddingBottom: NAVIGATION_BAR_HEIGHT + SPACE.xxl,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '72%',
  },
  errorWrap: {
    paddingHorizontal: SPACE.margin,
  },
  searchEmpty: {
    paddingTop: SPACE.xxl,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: SPACE.margin,
    bottom: SPACE.lg,
  },
})
