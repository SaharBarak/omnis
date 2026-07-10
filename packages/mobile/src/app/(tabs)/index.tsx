import type { PersonWithTags } from '@pleiad/api-client'
import { getPersonalDailyPrediction } from '@pleiad/engine/services/predictions'
import { getTodayAcrossSystems } from '@pleiad/engine/services/today'
import type { DailyPrediction, PredictionEvent } from '@pleiad/engine/types/prediction'
import { useRouter } from 'expo-router'
import { PlusIcon } from 'phosphor-react-native'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BrandMark } from '@/components/brand-mark'
import { CaptureSheet } from '@/components/people/capture-sheet'
import { PaywallSheet } from '@/components/people/paywall-sheet'
import { TodayBoard } from '@/components/today/board'
import { Divider, Eyebrow, Panel, Pill } from '@/components/ui/primitives'
import { ToastHost } from '@/components/ui/toast'
import { useProfile, useSubscription } from '@/lib/api'
import { usePeople } from '@/lib/people/hooks'
import { nextGalacticBirthday } from '@/lib/people/reading'
import { COLORS, FLAVORS, FONTS, RADII, SPACE, TYPE } from '@/theme/tokens'

/**
 * Today (home) — S5, enriched per F9. The split-flap board stays the set
 * piece; beneath it: your personal daily line (on-device engine), galactic
 * birthdays landing within a week, and the recent-people row.
 */

const BIRTHDAY_WINDOW_DAYS = 7
const RECENT_COUNT = 5

function localIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}

const INTENSITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2, peak: 3 }

function topEvent(prediction: DailyPrediction): PredictionEvent | null {
  if (prediction.events.length === 0) return null
  return [...prediction.events].sort(
    (a, b) => (INTENSITY_RANK[b.intensity] ?? 0) - (INTENSITY_RANK[a.intensity] ?? 0)
  )[0]
}

/** Personal daily line — engine-computed, shown once the profile carries a date. */
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
    `Day ${prediction.wavespell.day} of the ${prediction.wavespell.name} wavespell — ${prediction.wavespell.role.toLowerCase()}.`

  return (
    <Panel>
      <View style={styles.kinHeader}>
        <Eyebrow color={FLAVORS.dreamspell.accentSoft}>YOUR KIN TODAY</Eyebrow>
        <Pill accent={FLAVORS.dreamspell.accent}>
          {prediction.intensity.toUpperCase()}
        </Pill>
      </View>
      <Text style={[TYPE.card, styles.kinTitle]}>{title}</Text>
      <Text style={styles.kinBody} numberOfLines={2}>
        {body}
      </Text>
    </Panel>
  )
}

interface UpcomingBirthday {
  person: PersonWithTags
  daysUntil: number
}

function GalacticBirthdays({
  birthdays,
  onOpen,
}: {
  birthdays: UpcomingBirthday[]
  onOpen: (personId: string) => void
}) {
  return (
    <View style={styles.section}>
      <Eyebrow color={FLAVORS.dreamspell.accentSoft}>GALACTIC BIRTHDAYS</Eyebrow>
      <View>
        {birthdays.map(({ person, daysUntil }, index) => (
          <View key={person.id}>
            <Pressable
              onPress={() => onOpen(person.id)}
              style={styles.birthdayRow}
              accessibilityRole="button"
              accessibilityLabel={`${person.name} — galactic birthday ${
                daysUntil === 0 ? 'today' : `in ${daysUntil} days`
              }`}
            >
              <Text style={TYPE.card} numberOfLines={1}>
                {person.name}
              </Text>
              <Text style={styles.birthdayValue}>
                {daysUntil === 0 ? 'TODAY' : `IN ${daysUntil}D`}
              </Text>
            </Pressable>
            {index < birthdays.length - 1 && <Divider />}
          </View>
        ))}
      </View>
    </View>
  )
}

function RecentPeople({
  people,
  isPending,
  onOpen,
  onAdd,
}: {
  people: PersonWithTags[]
  isPending: boolean
  onOpen: (personId: string) => void
  onAdd: () => void
}) {
  return (
    <View style={styles.section}>
      <Eyebrow>RECENT PEOPLE</Eyebrow>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {isPending ? (
          Array.from({ length: 4 }, (_, index) => (
            <View key={index} style={styles.chip}>
              <View style={[styles.chipAvatar, styles.chipSkeleton]} />
              <View style={styles.chipNameSkeleton} />
            </View>
          ))
        ) : people.length === 0 ? (
          <Pressable
            onPress={onAdd}
            style={styles.chip}
            accessibilityRole="button"
            accessibilityLabel="Add a person"
          >
            <View style={[styles.chipAvatar, styles.chipAdd]}>
              <PlusIcon size={18} color={COLORS.brandSoft} />
            </View>
            <Text style={styles.chipName}>ADD</Text>
          </Pressable>
        ) : (
          people.map((person) => (
            <Pressable
              key={person.id}
              onPress={() => onOpen(person.id)}
              style={styles.chip}
              accessibilityRole="button"
              accessibilityLabel={person.name}
            >
              <View style={styles.chipAvatar}>
                <Text style={styles.chipInitials}>{initialsOf(person.name)}</Text>
              </View>
              <Text style={styles.chipName} numberOfLines={1}>
                {person.name.split(/\s+/)[0]?.toUpperCase() ?? ''}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const today = useMemo(() => new Date(), [])
  const todayIso = useMemo(() => localIsoDate(today), [today])
  const board = useMemo(() => getTodayAcrossSystems(today), [today])

  const profile = useProfile()
  const subscription = useSubscription()
  const { people, isPending, isError, refetch } = usePeople()

  const [captureOpen, setCaptureOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)

  const rows = useMemo(
    () => [
      { label: 'Kin', value: board.kin.toUpperCase() },
      { label: 'Moon', value: board.moon.toUpperCase() },
      { label: 'Sun', value: board.sun.toUpperCase() },
      { label: 'Gate', value: board.gate.toUpperCase() },
      { label: 'Hebrew', value: (board.hebrewDate ?? '—').toUpperCase() },
    ],
    [board]
  )

  // People whose kin recurs today or within the week — omitted when none.
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

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACE.gutter },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BrandMark size={26} />
          <Eyebrow>
            {today
              .toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })
              .toUpperCase()}
          </Eyebrow>
        </View>

        <Text style={TYPE.zone}>Today, across the systems.</Text>

        <Panel feature>
          <TodayBoard rows={rows} />
          <Text style={[TYPE.bodySm, styles.caption]}>(the calendars never stop)</Text>
        </Panel>

        {birthDate !== null && <KinToday birthDate={birthDate} todayIso={todayIso} />}

        {birthdays.length > 0 && (
          <GalacticBirthdays birthdays={birthdays} onOpen={openPerson} />
        )}

        {isError ? (
          <View style={styles.section}>
            <Eyebrow>RECENT PEOPLE</Eyebrow>
            <Text style={styles.errorLine}>
              Your people are out of reach right now.{' '}
              <Text style={styles.errorRetry} onPress={refetch}>
                Try again
              </Text>
            </Text>
          </View>
        ) : (
          <RecentPeople
            people={recent}
            isPending={isPending}
            onOpen={openPerson}
            onAdd={() => setCaptureOpen(true)}
          />
        )}
      </ScrollView>

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
        limit={subscription.data?.usage.profiles.limit ?? 3}
        planName={subscription.data?.planName ?? 'Free'}
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
  content: {
    paddingHorizontal: SPACE.gutter,
    gap: SPACE.section,
    paddingBottom: SPACE.section,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caption: {
    marginTop: 12,
  },
  kinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kinTitle: {
    marginTop: 12,
  },
  kinBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
    marginTop: 6,
  },
  section: {
    gap: 10,
  },
  birthdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.cardPad,
    paddingVertical: 14,
  },
  birthdayValue: {
    ...TYPE.stat,
    fontSize: 16,
    lineHeight: 22,
  },
  chipRow: {
    gap: 14,
    paddingVertical: 4,
  },
  chip: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  chipAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipAdd: {
    borderColor: COLORS.brandSoft,
    borderStyle: 'dashed',
  },
  chipInitials: {
    ...TYPE.eyebrow,
    color: COLORS.text70,
    letterSpacing: 1,
  },
  chipName: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.text50,
  },
  chipSkeleton: {
    borderWidth: 0,
  },
  chipNameSkeleton: {
    height: 8,
    width: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface2,
  },
  errorLine: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  errorRetry: {
    color: COLORS.brandSoft,
  },
})
