import {
  dailyHexagram,
  dailyRune,
  dailyTarotCard,
} from '@pleiad/engine/calculations/oracles'
import { HEXAGRAMS, TRIGRAMS } from '@pleiad/engine/data/iching'
import { ELDER_FUTHARK } from '@pleiad/engine/data/runes'
import { TAROT_DECK, type TarotSuit } from '@pleiad/engine/data/tarot'
import { useRouter } from 'expo-router'
import { CaretLeftIcon } from 'phosphor-react-native'
import { useMemo, useState } from 'react'
import { SectionList, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { FavoriteStar } from '@/components/favorite-star'
import {
  Card,
  Divider,
  IconButton,
  SegmentedButton,
  Text,
  TopAppBar,
} from '@/components/m3'
import { useProfile } from '@/lib/api'
import { SPACE } from '@/theme/m3'

/**
 * Oracles (#74) — tarot, I Ching and the Elder Futhark.
 *
 * Each system opens with today's draw and unfolds into its full reference
 * library. The draw is seeded by date × account, so it holds all day, matches
 * the web exactly, and differs per person.
 *
 * One system at a time, chosen by a segmented button, rather than the web's
 * three stacked expanders: 166 reference rows in one scroll view is a phone
 * scrolling past two libraries to reach the third.
 */

type OracleKey = 'tarot' | 'iching' | 'runes'

const SEGMENTS = [
  { key: 'tarot', label: 'Tarot' },
  { key: 'iching', label: 'I Ching' },
  { key: 'runes', label: 'Runes' },
] as const

const ACCENTS: Record<OracleKey, string> = {
  tarot: '#A87BD1',
  iching: '#7FA8D4',
  runes: '#C9CDD4',
}

const SUIT_LABELS: Record<TarotSuit, string> = {
  wands: 'Wands — fire, will, work',
  cups: 'Cups — water, feeling, bonds',
  swords: 'Swords — air, mind, conflict',
  pentacles: 'Pentacles — earth, body, means',
}

const AETT_LABELS: Record<1 | 2 | 3, string> = {
  1: "Freyr's aett",
  2: "Hagal's aett",
  3: "Tyr's aett",
}

interface Entry {
  readonly key: string
  readonly label: string
  readonly value?: string
  readonly detail: string
}

interface Section {
  readonly title: string
  readonly data: readonly Entry[]
}

function trigramLines(lines: readonly number[]): string {
  // Bottom-up in the data; a trigram is read top-down on the page.
  return [...lines]
    .reverse()
    .map((line) => (line === 1 ? '⚊' : '⚋'))
    .join(' ')
}

function tarotSections(): Section[] {
  const suits = Object.keys(SUIT_LABELS) as TarotSuit[]
  return [
    {
      title: 'Major Arcana — the archetypes',
      data: TAROT_DECK.filter((card) => card.arcana === 'major').map((card) => ({
        key: String(card.id),
        label: `${card.number} · ${card.name}`,
        detail: `${card.upright} · Reversed: ${card.reversed}`,
      })),
    },
    ...suits.map((suit) => ({
      title: SUIT_LABELS[suit],
      data: TAROT_DECK.filter((card) => card.suit === suit).map((card) => ({
        key: String(card.id),
        label: card.name,
        detail: `${card.upright} · Reversed: ${card.reversed}`,
      })),
    })),
  ]
}

function ichingSections(): Section[] {
  return [
    {
      title: 'The eight trigrams',
      data: TRIGRAMS.map((trigram) => ({
        key: trigram.pinyin,
        label: `${trigram.name} (${trigram.pinyin})`,
        value: trigramLines(trigram.lines),
        detail: trigram.attribute,
      })),
    },
    {
      title: 'The sixty-four hexagrams',
      data: HEXAGRAMS.map((hexagram) => ({
        key: String(hexagram.number),
        label: `${hexagram.number} · ${hexagram.english} (${hexagram.pinyin})`,
        value: `${hexagram.trigrams[1]} / ${hexagram.trigrams[0]}`,
        detail: hexagram.judgment,
      })),
    },
  ]
}

function runeSections(): Section[] {
  return ([1, 2, 3] as const).map((aett) => ({
    title: AETT_LABELS[aett],
    data: ELDER_FUTHARK.filter((rune) => rune.aett === aett).map((rune) => ({
      key: String(rune.id),
      label: `${rune.glyph}  ${rune.name}`,
      value: rune.transliteration,
      detail: `${rune.literal} — ${rune.meaning}`,
    })),
  }))
}

function DrawHero({
  accent,
  eyebrow,
  title,
  subtitle,
  body,
}: {
  accent: string
  eyebrow: string
  title: string
  subtitle?: string
  body: string
}) {
  return (
    <Card variant="elevated">
      <Text variant="labelLarge" color={accent}>
        {eyebrow}
      </Text>
      <View style={styles.heroTitle}>
        <Text variant="headlineSmall" color="onSurface">
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {subtitle}
          </Text>
        )}
      </View>
      <Text variant="bodyMedium" color="onSurfaceVariant">
        {body}
      </Text>
    </Card>
  )
}

export default function OraclesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const profile = useProfile()

  const [index, setIndex] = useState(0)
  const active: OracleKey = SEGMENTS[index]?.key ?? 'tarot'

  const today = useMemo(() => new Date(), [])
  const todayIso = useMemo(() => {
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [today])
  const seed = profile.data?.id ?? ''

  const draws = useMemo(
    () => ({
      tarot: dailyTarotCard(todayIso, seed),
      hexagram: dailyHexagram(todayIso, seed),
      rune: dailyRune(todayIso, seed),
    }),
    [todayIso, seed]
  )

  const sections = useMemo(() => {
    switch (active) {
      case 'tarot':
        return tarotSections()
      case 'iching':
        return ichingSections()
      case 'runes':
        return runeSections()
    }
  }, [active])

  const dateLine = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const hero = () => {
    switch (active) {
      case 'tarot':
        return (
          <DrawHero
            accent={ACCENTS.tarot}
            eyebrow={`Today’s card · ${dateLine}`}
            title={draws.tarot.card.name}
            subtitle={draws.tarot.reversed ? 'reversed' : 'upright'}
            body={
              draws.tarot.reversed
                ? draws.tarot.card.reversed
                : draws.tarot.card.upright
            }
          />
        )
      case 'iching':
        return (
          <DrawHero
            accent={ACCENTS.iching}
            eyebrow={`Today’s hexagram · ${dateLine}`}
            title={`${draws.hexagram.number} · ${draws.hexagram.english}`}
            subtitle={`${draws.hexagram.pinyin} — ${draws.hexagram.trigrams[1]} over ${draws.hexagram.trigrams[0]}`}
            body={draws.hexagram.judgment}
          />
        )
      case 'runes':
        return (
          <DrawHero
            accent={ACCENTS.runes}
            eyebrow={`Today’s rune · ${dateLine}`}
            title={`${draws.rune.glyph} ${draws.rune.name}`}
            subtitle={`${draws.rune.literal} · aett ${draws.rune.aett}`}
            body={draws.rune.meaning}
          />
        )
    }
  }

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="Oracles"
        navigationIcon={
          <IconButton
            icon={(color) => <CaretLeftIcon size={24} color={color} />}
            onPress={goBack}
            accessibilityLabel="Back"
          />
        }
        actions={<FavoriteStar href="/app/oracles" title="Oracles" />}
      />

      <SectionList
        sections={sections as Section[]}
        keyExtractor={(item) => `${active}-${item.key}`}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACE.xxl },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <SegmentedButton
              segments={SEGMENTS.map(({ key, label }) => ({ key, label }))}
              selectedIndex={index}
              onSelect={setIndex}
            />
            {hero()}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text
            variant="labelLarge"
            color={ACCENTS[active]}
            style={styles.sectionHeader}
          >
            {(section as Section).title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowHead}>
              <Text variant="titleSmall" color="onSurface" style={styles.rowLabel}>
                {item.label}
              </Text>
              {item.value !== undefined && (
                <Text variant="dataMedium" color="onSurfaceVariant">
                  {item.value}
                </Text>
              )}
            </View>
            <Text variant="bodyMedium" color="onSurfaceVariant">
              {item.detail}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={Divider}
        ListFooterComponent={
          <Text variant="bodySmall" color="onSurfaceVariant" style={styles.footer}>
            Draws are seeded by the date and your account — the same reading all
            day, on every device, and a different one tomorrow.
          </Text>
        }
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
  },
  header: {
    gap: SPACE.lg,
    paddingBottom: SPACE.lg,
  },
  heroTitle: {
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
  },
  sectionHeader: {
    paddingTop: SPACE.xl,
    paddingBottom: SPACE.sm,
  },
  row: {
    gap: SPACE.xs,
    paddingVertical: SPACE.md,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
  rowLabel: {
    flexShrink: 1,
  },
  footer: {
    paddingTop: SPACE.xl,
  },
})
