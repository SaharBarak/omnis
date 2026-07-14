import type { PersonWithTags } from '@pleiad/api-client'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { useRouter } from 'expo-router'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from 'phosphor-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
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

import { CaptureSheet } from '@/components/people/capture-sheet'
import { PaywallSheet } from '@/components/billing/paywall-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { Button, Divider, Eyebrow, Panel } from '@/components/ui/primitives'
import { ToastHost } from '@/components/ui/toast'
import { useSubscription } from '@/lib/api'
import { useDeletePerson, usePeople } from '@/lib/people/hooks'
import { COLORS, DURATION, FLAVORS, RADII, SPACE, TYPE } from '@/theme/tokens'

/**
 * S6 People — the library. Hairline-divided rows (never boxed), inline
 * dreamspell line per person, capture FAB, swipe-to-remove. All four states
 * ship: skeleton, invitation, inline retry, tactile success (via the sheet).
 */

const SKELETON_ROWS = 6
const STAGGER_CAP = 8

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}

function dreamspellLine(birthDate: string): string {
  try {
    const kin = dateToKin(birthDate)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return `KIN ${kin} · ${seal.color} ${tone.name} ${seal.english}`.toUpperCase()
  } catch {
    return birthDate
  }
}

function DeleteAction({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.deleteAction}
      accessibilityRole="button"
      accessibilityLabel="Remove person"
    >
      <TrashIcon size={20} color={COLORS.text90} />
    </Pressable>
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
  const line = useMemo(() => dreamspellLine(person.birth_date), [person.birth_date])

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
          accessibilityLabel={person.name}
        >
          <View style={[styles.avatar, person.is_self && styles.avatarSelf]}>
            <Text style={styles.avatarText}>{initialsOf(person.name)}</Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={TYPE.card} numberOfLines={1}>
              {person.name}
            </Text>
            <Text style={styles.rowLine} numberOfLines={1}>
              {line}
            </Text>
          </View>
        </Pressable>
      </ReanimatedSwipeable>
    </Animated.View>
  )
}

/** Skeleton rows matching the final layout — shimmer 2s, never a spinner. */
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
            <View style={[styles.avatar, styles.skeletonBlock]} />
            <View style={styles.rowBody}>
              <View style={[styles.skeletonBlock, styles.skeletonName]} />
              <View style={[styles.skeletonBlock, styles.skeletonLine]} />
            </View>
          </Animated.View>
          {index < SKELETON_ROWS - 1 && <Divider />}
        </View>
      ))}
    </View>
  )
}

export default function PeopleScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
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
  // counting it produced "4 OF 3 KEPT". The server excludes it; so do we.
  const trackedCount = useMemo(
    () => people.filter((person) => !person.is_self).length,
    [people]
  )

  const profileLimit = subscription.data?.usage.profiles.limit ?? null
  const countLabel =
    profileLimit !== null && Number.isFinite(profileLimit)
      ? `${trackedCount} OF ${profileLimit} KEPT`
      : `${trackedCount} KEPT`

  const openCapture = () => setSheetOpen(true)

  const renderBody = () => {
    if (isPending) return <SkeletonRows />

    if (isError) {
      return (
        <Panel style={styles.errorPanel}>
          <Text style={TYPE.card}>Your people are out of reach.</Text>
          <Text style={styles.errorBody}>
            We couldn't load the library. They're safe — check your connection.
          </Text>
          <Button variant="secondary" onPress={refetch} disabled={isRefetching}>
            {isRefetching ? 'Trying…' : 'Try again'}
          </Button>
        </Panel>
      )
    }

    if (people.length === 0) {
      return (
        <EmptyState
          title="Your map starts with one birthday."
          body="Add the first person you carry with you — the reading is instant."
          actionLabel="Add a person"
          onAction={openCapture}
        />
      )
    }

    if (filtered.length === 0) {
      return (
        <View style={styles.searchEmpty}>
          <Text style={styles.searchEmptyText}>No one answers to that name yet.</Text>
        </View>
      )
    }

    return (
      <FlatList
        data={filtered}
        keyExtractor={(person) => person.id}
        ItemSeparatorComponent={Divider}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
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
    <View style={[styles.screen, { paddingTop: insets.top + SPACE.gutter }]}>
      <View style={styles.header}>
        <Eyebrow>{countLabel}</Eyebrow>
        <Text style={TYPE.zone}>People</Text>
      </View>

      <View style={styles.searchField}>
        <MagnifyingGlassIcon size={18} color={COLORS.text35} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search your people"
          placeholderTextColor={COLORS.text35}
          style={styles.searchInput}
          keyboardAppearance="dark"
          autoCorrect={false}
          accessibilityLabel="Search your people"
        />
      </View>

      <View style={styles.body}>{renderBody()}</View>

      <Pressable
        onPress={openCapture}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="Add a person"
      >
        <PlusIcon size={24} color="#FFFFFF" />
      </Pressable>

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
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SPACE.gutter,
    marginTop: SPACE.cardPad,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: RADII.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
  },
  searchInput: {
    flex: 1,
    fontFamily: TYPE.body.fontFamily,
    fontSize: TYPE.bodySm.fontSize,
    color: COLORS.text90,
    paddingVertical: 0,
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
  rowLine: {
    ...TYPE.eyebrow,
    color: COLORS.text50,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarSelf: {
    borderColor: COLORS.brandSoft,
  },
  avatarText: {
    ...TYPE.eyebrow,
    color: COLORS.text70,
    letterSpacing: 1,
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
    width: '72%',
  },
  errorPanel: {
    marginHorizontal: SPACE.gutter,
    gap: 14,
  },
  errorBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  searchEmpty: {
    paddingTop: SPACE.section,
    alignItems: 'center',
  },
  searchEmptyText: {
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
