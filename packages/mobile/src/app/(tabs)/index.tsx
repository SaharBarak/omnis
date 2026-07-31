import type { PersonWithTags } from '@pleiad/api-client'
import {
  dailyHexagram,
  dailyRune,
  dailyTarotCard,
} from '@pleiad/engine/calculations/oracles'
import { getPersonalDailyPrediction } from '@pleiad/engine/services/predictions'
import {
  resolveSystemPreferences,
  type SystemKey,
} from '@pleiad/engine/services/system-preferences'
import { getTodayAcrossSystems } from '@pleiad/engine/services/today'
import type { DailyPrediction, PredictionEvent } from '@pleiad/engine/types/prediction'
import { useRouter } from 'expo-router'
import { GearSixIcon, MagnifyingGlassIcon, PlusIcon } from 'phosphor-react-native'
import { useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { PaywallSheet } from '@/components/billing/paywall-sheet'
import { Glyph } from '@/components/glyph'
import {
  Card,
  Chip,
  Divider,
  IconButton,
  LARGE_TITLE_COLLAPSE_DISTANCE,
  ListItem,
  NAVIGATION_BAR_HEIGHT,
  Text,
  TopAppBar,
  Touchable,
  useScrollProgress,
} from '@/components/m3'
import { CaptureSheet } from '@/components/people/capture-sheet'
import { TodayBoard, type BoardRow } from '@/components/today/board'
import { useProfile } from '@/lib/api'
import { usePeople } from '@/lib/people/hooks'
import { nextGalacticBirthday } from '@/lib/people/reading'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'
import { initialsOf } from '@/lib/text'

/**
 * Today — the home surface.
 *
 * A large top app bar that collapses as you scroll, then three blocks in
 * descending order of how much they're about *you*: the board of what every
 * system says about this date, your own kin reading, and the people whose
 * galactic birthdays land this week.
 */

const BIRTHDAY_WINDOW_DAYS = 7
const RECENT_COUNT = 8
const AVATAR_SIZE = 56

function localIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const INTENSITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2, peak: 3 }

function topEvent(prediction: DailyPrediction): PredictionEvent | null {
  if (prediction.events.length === 0) return null
  return [...prediction.events].sort(
    (a, b) => (INTENSITY_RANK[b.intensity] ?? 0) - (INTENSITY_RANK[a.intensity] ?? 0)
  )[0]
}

/** Your own daily line. Only appears once the profile carries a birth date. */
function KinToday({ birthDate, todayIso }: { birthDate: string; todayIso: string }) {
  const prediction = useMemo(() => {
    try {
      return getPersonalDailyPrediction(todayIso, birthDate)
    } catch {
      return null
    }
  }, [todayIso, birthDate])

  if (prediction === null) return null

  const event = topEvent(prediction)
  const title =
    event?.title ?? `Kin ${prediction.kin} · ${prediction.toneName} ${prediction.sealName}`
  const body =
    event?.description ??
    `Day ${prediction.wavespell.day} of the ${prediction.wavespell.name} wavespell, ${prediction.wavespell.role.toLowerCase()}.`

  return (
    // Elevated, because this is the one card on the screen that is about the
    // person reading it. Everything else is about the date.
    <Card variant="elevated">
      <View style={styles.kinHeader}>
        <Text variant="labelLarge" color="primary">
          Your kin today
        </Text>
        <Chip label={prediction.intensity} variant="suggestion" />
      </View>
      <View style={styles.kinTitleRow}>
        <Glyph seal={prediction.seal} size={38} color={FLAVORS.dreamspell.accent} />
        <Text variant="titleMedium" color="onSurface" style={styles.kinTitleText}>
          {title}
        </Text>
      </View>
      <Text variant="bodyMedium" color="onSurfaceVariant" numberOfLines={3}>
        {body}
      </Text>
    </Card>
  )
}

interface UpcomingBirthday {
  person: PersonWithTags
  daysUntil: number
}

function PersonAvatar({ name }: { name: string }) {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: theme.colors.primaryContainer },
      ]}
    >
      <Text variant="titleMedium" color={theme.colors.onPrimaryContainer}>
        {initialsOf(name)}
      </Text>
    </View>
  )
}

function RecentPeople({
  people,
  onOpen,
  onAdd,
}: {
  people: PersonWithTags[]
  onOpen: (personId: string) => void
  onAdd: () => void
}) {
  const theme = useTheme()

  return (
    <View style={styles.section}>
      <Text variant="titleMedium" color="onSurface" style={styles.sectionTitle}>
        Recent people
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Touchable
          onPress={onAdd}
          radius={SHAPE.full}
          stateLayerColor={theme.colors.onSurface}
          accessibilityRole="button"
          accessibilityLabel="Add a person"
          style={styles.personChip}
        >
          <View
            style={[
              styles.avatar,
              styles.addAvatar,
              { borderColor: theme.colors.outline },
            ]}
          >
            <PlusIcon size={24} color={theme.colors.primary} />
          </View>
          <Text variant="labelMedium" color="onSurfaceVariant" numberOfLines={1}>
            Add
          </Text>
        </Touchable>

        {people.map((person) => (
          <Touchable
            key={person.id}
            onPress={() => onOpen(person.id)}
            radius={SHAPE.full}
            stateLayerColor={theme.colors.onSurface}
            accessibilityRole="button"
            accessibilityLabel={person.name}
            style={styles.personChip}
          >
            <PersonAvatar name={person.name} />
            <Text variant="labelMedium" color="onSurfaceVariant" numberOfLines={1}>
              {person.name.split(/\s+/)[0] ?? ''}
            </Text>
          </Touchable>
        ))}
      </ScrollView>
    </View>
  )
}

export default function TodayScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { progress, onScroll } = useScrollProgress(LARGE_TITLE_COLLAPSE_DISTANCE)

  const today = useMemo(() => new Date(), [])
  const todayIso = useMemo(() => localIsoDate(today), [today])
  const board = useMemo(() => getTodayAcrossSystems(today), [today])

  const profile = useProfile()
  const { people, isPending, isRefetching, refetch } = usePeople()

  const [captureOpen, setCaptureOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)

  const enabledSystems = useMemo(
    () => resolveSystemPreferences(profile.data?.preferences),
    [profile.data?.preferences]
  )

  // Same rows, same preference keys, same order as the web board — the two
  // surfaces read one map so a system switched off is off everywhere.
  const rows = useMemo(
    () =>
      (
        [
          { label: 'Kin', value: board.kin, href: '/calendar', pref: 'dreamspell' },
          { label: 'Moon', value: board.moon, pref: 'moon' },
          { label: 'Sun', value: board.sun, system: 'astrology', pref: 'astrology' },
          { label: 'Sidereal', value: board.sidereal, system: 'panchang', pref: 'sidereal' },
          { label: 'Gate', value: board.gate, system: 'human-design', pref: 'humandesign' },
          { label: 'Hebrew', value: board.hebrewDate ?? '—', system: 'hebrew', pref: 'hebrew' },
          { label: 'Hijri', value: board.hijri ?? '—', system: 'hijri', pref: 'hijri' },
          { label: 'Persian', value: board.persian ?? '—', system: 'persian', pref: 'persian' },
          { label: 'Chinese', value: board.chineseYear ?? '—', system: 'chinese', pref: 'chinese' },
          { label: 'Panchang', value: board.panchang, system: 'panchang', pref: 'panchang' },
          { label: 'Long Count', value: board.longCount, system: 'long-count', pref: 'longcount' },
        ] satisfies ReadonlyArray<BoardRow & { pref: SystemKey }>
      )
        .filter((row) => enabledSystems[row.pref])
        .map(({ pref: _pref, ...row }) => row),
    [board, enabledSystems]
  )

  const oracles = useMemo(() => {
    const seed = profile.data?.id ?? ''
    return {
      tarot: dailyTarotCard(todayIso, seed),
      hexagram: dailyHexagram(todayIso, seed),
      rune: dailyRune(todayIso, seed),
    }
  }, [todayIso, profile.data?.id])

  const birthdays = useMemo<UpcomingBirthday[]>(
    () =>
      people
        .flatMap((person) => {
          try {
            const { daysUntil } = nextGalacticBirthday(person.birth_date, today)
            return daysUntil <= BIRTHDAY_WINDOW_DAYS ? [{ person, daysUntil }] : []
          } catch {
            return []
          }
        })
        .sort((a, b) => a.daysUntil - b.daysUntil),
    [people, today]
  )

  const recent = useMemo(
    () =>
      [...people]
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, RECENT_COUNT),
    [people]
  )

  const birthDate = profile.data?.birth_date ?? null
  const openPerson = (personId: string) => {
    router.push({ pathname: '/person/[id]', params: { id: personId } })
  }

  const dateLine = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="Today"
        variant="large"
        progress={progress}
        actions={
          <>
            <IconButton
              icon={(color) => <MagnifyingGlassIcon size={24} color={color} />}
              onPress={() => router.push('/search')}
              accessibilityLabel="Search"
            />
            <IconButton
              icon={(color) => <GearSixIcon size={24} color={color} />}
              onPress={() => router.push('/settings')}
              accessibilityLabel="Settings"
            />
          </>
        }
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isPending}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.surfaceAt(2)}
          />
        }
      >
        <Text variant="bodyLarge" color="onSurfaceVariant">
          {dateLine}
        </Text>

        <Card variant="outlined">
          <Text variant="titleMedium" color="onSurface" style={styles.boardTitle}>
            Across the systems
          </Text>
          <TodayBoard rows={rows} />
        </Card>

        {enabledSystems.oracles && (
        <Card
          variant="outlined"
          onPress={() => router.push('/oracles')}
          accessibilityLabel="Today's oracles — open the full libraries"
        >
          <Text variant="titleMedium" color="onSurface" style={styles.boardTitle}>
            Today&rsquo;s oracles
          </Text>
          <View style={styles.oracleRows}>
            <Text variant="bodyMedium" color="onSurfaceVariant">
              <Text variant="labelMedium" color="primary">
                {oracles.tarot.card.name}
                {oracles.tarot.reversed ? ' (reversed)' : ''}
              </Text>
              {'  —  '}
              {oracles.tarot.reversed
                ? oracles.tarot.card.reversed
                : oracles.tarot.card.upright}
            </Text>
            <Text variant="bodyMedium" color="onSurfaceVariant">
              <Text variant="labelMedium" color="primary">
                {oracles.hexagram.number} · {oracles.hexagram.english}
              </Text>
              {'  —  '}
              {oracles.hexagram.judgment}
            </Text>
            <Text variant="bodyMedium" color="onSurfaceVariant">
              <Text variant="labelMedium" color="primary">
                {oracles.rune.glyph} {oracles.rune.name}
              </Text>
              {'  —  '}
              {oracles.rune.meaning}
            </Text>
          </View>
        </Card>
        )}

        {birthDate !== null && enabledSystems.dreamspell && (
          <KinToday birthDate={birthDate} todayIso={todayIso} />
        )}

        {birthdays.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" color="onSurface" style={styles.sectionTitle}>
              Galactic birthdays
            </Text>
            <View>
              {birthdays.map(({ person, daysUntil }, index) => (
                <View key={person.id}>
                  <ListItem
                    headline={person.name}
                    leading={<PersonAvatar name={person.name} />}
                    trailing={
                      <Text variant="dataSmall" color="primary">
                        {daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                      </Text>
                    }
                    onPress={() => openPerson(person.id)}
                  />
                  {index < birthdays.length - 1 && <Divider inset />}
                </View>
              ))}
            </View>
          </View>
        )}

        <RecentPeople
          people={recent}
          onOpen={openPerson}
          onAdd={() => setCaptureOpen(true)}
        />
      </Animated.ScrollView>

      <CaptureSheet
        visible={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onLimitExceeded={() => {
          setCaptureOpen(false)
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
  content: {
    paddingHorizontal: SPACE.margin,
    paddingBottom: NAVIGATION_BAR_HEIGHT + SPACE.xxl,
    gap: SPACE.xl,
  },
  boardTitle: {
    marginBottom: SPACE.sm,
  },
  oracleRows: {
    gap: SPACE.md,
  },
  kinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
  kinTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    marginTop: SPACE.md,
    marginBottom: SPACE.xs,
  },
  kinTitleText: {
    flex: 1,
  },
  section: {
    gap: SPACE.sm,
  },
  sectionTitle: {
    marginBottom: SPACE.xs,
  },
  chipRow: {
    gap: SPACE.lg,
    paddingVertical: SPACE.xs,
  },
  personChip: {
    alignItems: 'center',
    gap: SPACE.sm,
    width: 72,
    paddingVertical: SPACE.xs,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAvatar: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
})
