import type { KnowledgeSearchResult } from '@pleiad/api-client'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { CaretRightIcon, MagnifyingGlassIcon } from 'phosphor-react-native'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated'

import { ARTICLES, TOPIC_LABELS } from '@pleiad/engine/data/articles'
import {
  Card,
  Divider,
  LARGE_TITLE_COLLAPSE_DISTANCE,
  ListItem,
  NAVIGATION_BAR_HEIGHT,
  Text,
  TextField,
  TopAppBar,
  useScrollProgress,
} from '@/components/m3'
import { ErrorState } from '@/components/ui/error-state'
import { ENV } from '@/lib/env'
import { useFavorites } from '@/lib/favorites/hooks'
import { mobileRouteFor } from '@/lib/routes'
import { api } from '@/lib/api'
import {
  CALENDAR_ORDER,
  LIBRARY_DOCS,
  LIBRARY_ORDER,
  docKeyFromSourceUrl,
  type LibraryDoc,
} from '@/lib/library/content'
import { muralFor } from '@/lib/library/murals'
import { DURATION, SHAPE, SPACE, alpha, useTheme } from '@/theme/m3'

/**
 * Library — semantic search over the public knowledge corpus above six doc
 * portals. The portals read from bundled content, so the codex works offline;
 * only search needs the wire.
 */

const SEARCH_DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 2
const SEARCH_LIMIT = 6
const STAGGER_MS = 60

/** The M3 three-line list item. Search rows and their skeletons share it. */
const RESULT_HEIGHT = 88

const PORTAL_HEIGHT = 140

/**
 * The mural is atmosphere, not content: it is held under a scrim so the name
 * and the lineage stay the loudest things on the card. Both values are tuned
 * against the *dark* scheme, where a mural at full strength would out-shout
 * `onSurface` text.
 */
const MURAL_OPACITY = 0.5
const MURAL_SCRIM_OPACITY = 0.45

/** A tradition with no mural is washed in its own flavour instead. */
const FLAVOR_WASH_OPACITY = 0.12

function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

function SearchSkeleton() {
  const theme = useTheme()
  const bar = { backgroundColor: theme.colors.surfaceContainerHighest }

  return (
    <View>
      {[0, 1].map((row, index, rows) => (
        <View key={row}>
          <View style={styles.skeletonRow}>
            <View style={[styles.skeletonOverline, bar]} />
            <View style={[styles.skeletonHeadline, bar]} />
            <View style={[styles.skeletonSupporting, bar]} />
          </View>
          {index < rows.length - 1 && <Divider />}
        </View>
      ))}
    </View>
  )
}

function SearchResults({
  query,
  onOpen,
}: {
  query: string
  onOpen: (result: KnowledgeSearchResult) => void
}) {
  const search = useQuery<KnowledgeSearchResult[]>({
    queryKey: ['knowledge-search', query],
    queryFn: () => api.knowledge.search(query, SEARCH_LIMIT),
    staleTime: 5 * 60_000,
  })

  if (search.isPending) return <SearchSkeleton />

  if (search.isError) {
    return (
      <ErrorState
        message="Search needs a connection, but the codex below still reads offline."
        onRetry={() => void search.refetch()}
      />
    )
  }

  if (search.data.length === 0) {
    return (
      <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.quietLine}>
        The library is being written.
      </Text>
    )
  }

  return (
    <View>
      {search.data.map((result, index) => (
        <View key={`${result.sourceUrl}-${index}`}>
          <ListItem
            overline={`${Math.round(result.similarity * 100)}% match`}
            headline={result.title}
            supportingText={result.snippet}
            onPress={() => onOpen(result)}
          />
          {index < search.data.length - 1 && <Divider />}
        </View>
      ))}
    </View>
  )
}

/**
 * A tradition, as a portal rather than a row: its mural carries the card, its
 * flavour accent marks the leading edge, and the lineage line says what the
 * tradition claims. Four of the six have murals; the other two fall back to a
 * tonal card washed in their flavour, which must read as deliberate rather
 * than as a card whose image failed to load.
 */
function TraditionPortal({ doc, onOpen }: { doc: LibraryDoc; onOpen: () => void }) {
  const theme = useTheme()
  const mural = muralFor(doc.key)

  return (
    <Card
      onPress={onOpen}
      accessibilityLabel={`Read the ${doc.name} codex`}
      style={styles.portal}
    >
      {mural === undefined ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: alpha(doc.flavor.accent, FLAVOR_WASH_OPACITY) },
          ]}
        />
      ) : (
        <>
          <Image
            source={mural}
            contentFit="cover"
            style={[StyleSheet.absoluteFill, styles.mural]}
            alt=""
            accessible={false}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: alpha(theme.colors.surface, MURAL_SCRIM_OPACITY) },
            ]}
          />
        </>
      )}

      <View style={styles.portalRow}>
        <View style={[styles.portalAccent, { backgroundColor: doc.flavor.accent }]} />
        <View style={styles.portalBody}>
          <Text variant="titleMedium" color="onSurface">
            {doc.name}
          </Text>
          <Text variant="bodyMedium" color="onSurfaceVariant" numberOfLines={2}>
            {doc.lineage}
          </Text>
        </View>
        <CaretRightIcon size={20} color={theme.colors.onSurfaceVariant} />
      </View>
    </Card>
  )
}

export default function LibraryScreen() {
  const router = useRouter()
  const theme = useTheme()
  const reduced = useReducedMotion()
  const { progress, onScroll } = useScrollProgress(LARGE_TITLE_COLLAPSE_DISTANCE)

  const { favorites } = useFavorites()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounced(query.trim(), SEARCH_DEBOUNCE_MS)
  const searching = debouncedQuery.length >= MIN_QUERY_LENGTH

  const openDoc = (key: LibraryDoc['key']) => {
    router.push({ pathname: '/learn/[system]', params: { system: key } })
  }

  const openFavorite = (href: string) => {
    const route = mobileRouteFor(href)
    if (route !== null) {
      router.push(route)
      return
    }
    void Linking.openURL(`${ENV.apiUrl}${href}`)
  }

  const openResult = (result: KnowledgeSearchResult) => {
    const key = docKeyFromSourceUrl(result.sourceUrl)
    if (key !== null) {
      openDoc(key)
      return
    }
    // A source that isn't one of the bundled docs still has a home on the web.
    void Linking.openURL(result.sourceUrl)
  }

  return (
    <View style={styles.screen}>
      <TopAppBar title="Library" variant="large" progress={progress} />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text variant="bodyLarge" color="onSurfaceVariant">
          Every line on the map has sources.
        </Text>

        <TextField
          label="Search the six traditions"
          value={query}
          onChangeText={setQuery}
          leadingIcon={(color) => <MagnifyingGlassIcon size={24} color={color} />}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search the library"
        />

        {searching && (
          <View style={styles.section}>
            <Text variant="labelLarge" color="onSurfaceVariant">
              From the sources
            </Text>
            <SearchResults query={debouncedQuery} onOpen={openResult} />
          </View>
        )}

        <View style={styles.section}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            The six traditions
          </Text>

          <View style={styles.portals}>
            {LIBRARY_ORDER.map((key, index) => (
              <Animated.View
                key={key}
                entering={
                  reduced
                    ? undefined
                    : FadeInUp.duration(DURATION.medium4).delay(index * STAGGER_MS)
                }
              >
                <TraditionPortal doc={LIBRARY_DOCS[key]} onOpen={() => openDoc(key)} />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Starred first when there is anything starred — a bookmark exists
            to be found again, so it outranks the shelves you browse. */}
        {favorites.length > 0 && (
          <View style={styles.section}>
            <Text variant="labelLarge" color="onSurfaceVariant">
              Starred
            </Text>
            <View>
              {favorites.map((entry, index) => (
                <View key={entry.href}>
                  <ListItem
                    headline={entry.title}
                    supportingText={
                      mobileRouteFor(entry.href) === null
                        ? 'Opens on the web'
                        : undefined
                    }
                    onPress={() => openFavorite(entry.href)}
                  />
                  {index < favorites.length - 1 && <Divider />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* The Q&A library: one question per article, shortest first — the
            shelf people browse when they don't know what to ask yet. */}
        <View style={styles.section}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            Questions, answered
          </Text>
          <View>
            {ARTICLES.map((article, index) => (
              <View key={article.slug}>
                <ListItem
                  overline={`${TOPIC_LABELS[article.topic]} · ${article.minutes} min`}
                  headline={article.title}
                  supportingText={article.question}
                  onPress={() =>
                    router.push({
                      pathname: '/learn/article/[slug]',
                      params: { slug: article.slug },
                    })
                  }
                />
                {index < ARTICLES.length - 1 && <Divider />}
              </View>
            ))}
          </View>
        </View>

        {/* Two reference surfaces that aren't docs: they're things you use.
            The oracles card on Today reaches the first, and nothing reached
            the second at all. */}
        <View style={styles.section}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            Explore
          </Text>
          <View>
            <ListItem
              headline="Oracles"
              supportingText="Today's card, hexagram and rune — and the full libraries"
              onPress={() => router.push('/oracles')}
            />
            <Divider />
            <ListItem
              headline="Tree of Life"
              supportingText="Ten sefirot, twenty-two lettered paths"
              onPress={() => router.push('/tree-of-life')}
            />
          </View>
        </View>

        {/* The calendar atlas. These docs were reachable only by tapping a
            Today board row; they are a shelf of the library too. */}
        <View style={styles.section}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            The calendar atlas
          </Text>

          <View style={styles.portals}>
            {CALENDAR_ORDER.map((key, index) => (
              <Animated.View
                key={key}
                entering={
                  reduced
                    ? undefined
                    : FadeInUp.duration(DURATION.medium4).delay(
                        (LIBRARY_ORDER.length + index) * STAGGER_MS
                      )
                }
              >
                <TraditionPortal doc={LIBRARY_DOCS[key]} onOpen={() => openDoc(key)} />
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
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
  section: {
    gap: SPACE.sm,
  },
  quietLine: {
    paddingVertical: SPACE.md,
  },
  skeletonRow: {
    minHeight: RESULT_HEIGHT,
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.margin,
    paddingVertical: SPACE.sm,
  },
  skeletonOverline: {
    height: 12,
    width: 84,
    borderRadius: SHAPE.extraSmall,
  },
  skeletonHeadline: {
    height: 16,
    width: '62%',
    borderRadius: SHAPE.extraSmall,
  },
  skeletonSupporting: {
    height: 14,
    width: '88%',
    borderRadius: SHAPE.extraSmall,
  },
  portals: {
    gap: SPACE.md,
  },
  portal: {
    // The card owns no padding of its own: the mural runs edge to edge under
    // the text, which sits in its own padded row anchored to the bottom.
    padding: 0,
    minHeight: PORTAL_HEIGHT,
    justifyContent: 'flex-end',
  },
  mural: {
    opacity: MURAL_OPACITY,
  },
  portalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.lg,
  },
  portalAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: SHAPE.full,
  },
  portalBody: {
    flex: 1,
    gap: SPACE.xs,
  },
})
