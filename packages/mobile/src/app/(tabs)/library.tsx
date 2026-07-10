import type { KnowledgeSearchResult } from '@pleiad/api-client'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { CaretRightIcon, MagnifyingGlassIcon } from 'phosphor-react-native'
import { useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Divider, Eyebrow } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import {
  LIBRARY_DOCS,
  LIBRARY_ORDER,
  docKeyFromSourceUrl,
} from '@/lib/library/content'
import { COLORS, DURATION, FONTS, RADII, SPACE, TYPE } from '@/theme/tokens'

/**
 * S14 Library — F10. Semantic search over the public knowledge corpus
 * (debounced, no auth) above six flavored doc portals. The portals read from
 * bundled content, so the codex works offline; only search needs the wire.
 */

const SEARCH_DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 2
const SEARCH_LIMIT = 6
const STAGGER_MS = 60

function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

function SearchResultRow({
  result,
  onOpen,
}: {
  result: KnowledgeSearchResult
  onOpen: (result: KnowledgeSearchResult) => void
}) {
  return (
    <Pressable
      onPress={() => onOpen(result)}
      style={styles.resultRow}
      accessibilityRole="button"
      accessibilityLabel={result.title}
    >
      <Eyebrow color={COLORS.brandSoft}>
        {`${Math.round(result.similarity * 100)}% MATCH`}
      </Eyebrow>
      <Text style={TYPE.card} numberOfLines={1}>
        {result.title}
      </Text>
      <Text style={styles.resultSnippet} numberOfLines={2}>
        {result.snippet}
      </Text>
    </Pressable>
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

  if (search.isPending) {
    return (
      <View style={styles.resultsBlock}>
        <View style={styles.skeletonRow} />
        <View style={[styles.skeletonRow, styles.skeletonNarrow]} />
      </View>
    )
  }

  if (search.isError) {
    return (
      <Text style={styles.quietLine}>
        Search needs a connection — the codex below still reads offline.
      </Text>
    )
  }

  if (search.data.length === 0) {
    return <Text style={styles.quietLine}>The library is being written.</Text>
  }

  return (
    <View style={styles.resultsBlock}>
      {search.data.map((result, index) => (
        <View key={`${result.sourceUrl}-${index}`}>
          <SearchResultRow result={result} onOpen={onOpen} />
          {index < search.data.length - 1 && <Divider />}
        </View>
      ))}
    </View>
  )
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const reduced = useReducedMotion()

  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const debouncedQuery = useDebounced(query.trim(), SEARCH_DEBOUNCE_MS)
  const searching = debouncedQuery.length >= MIN_QUERY_LENGTH

  const openResult = (result: KnowledgeSearchResult) => {
    const key = docKeyFromSourceUrl(result.sourceUrl)
    if (key !== null) {
      router.push({ pathname: '/learn/[system]', params: { system: key } })
      return
    }
    void Linking.openURL(result.sourceUrl)
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACE.gutter },
        ]}
      >
        <Eyebrow>LIBRARY</Eyebrow>
        <Text style={TYPE.zone}>Every line on the map has sources.</Text>

        <View style={[styles.searchField, focused && styles.searchFieldFocused]}>
          <MagnifyingGlassIcon size={18} color={COLORS.text35} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search the six traditions"
            placeholderTextColor={COLORS.text35}
            style={styles.searchInput}
            keyboardAppearance="dark"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            accessibilityLabel="Search the library"
          />
        </View>

        {searching && (
          <View style={styles.searchSection}>
            <Eyebrow>FROM THE SOURCES</Eyebrow>
            <SearchResults query={debouncedQuery} onOpen={openResult} />
          </View>
        )}

        <View style={styles.portals}>
          <Eyebrow>THE SIX TRADITIONS</Eyebrow>
          <View>
            {LIBRARY_ORDER.map((key, index) => {
              const doc = LIBRARY_DOCS[key]
              return (
                <Animated.View
                  key={key}
                  entering={
                    reduced
                      ? undefined
                      : FadeInUp.duration(DURATION.slow).delay(index * STAGGER_MS)
                  }
                >
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/learn/[system]', params: { system: key } })
                    }
                    style={styles.portalRow}
                    accessibilityRole="button"
                    accessibilityLabel={`Read the ${doc.name} codex`}
                  >
                    <View
                      style={[styles.portalAccent, { backgroundColor: doc.flavor.accent }]}
                    />
                    <View style={styles.portalBody}>
                      <Text style={TYPE.card}>{doc.name}</Text>
                      <Text style={styles.portalLineage} numberOfLines={2}>
                        {doc.lineage}
                      </Text>
                    </View>
                    <CaretRightIcon size={16} color={COLORS.text35} />
                  </Pressable>
                  {index < LIBRARY_ORDER.length - 1 && <Divider />}
                </Animated.View>
              )
            })}
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: SPACE.section,
    gap: SPACE.cardPad,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: RADII.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
    paddingHorizontal: 16,
  },
  searchFieldFocused: {
    borderColor: COLORS.brand,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.text90,
  },
  searchSection: {
    gap: 10,
  },
  resultsBlock: {
    gap: 2,
  },
  resultRow: {
    gap: 5,
    paddingVertical: 14,
  },
  resultSnippet: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  quietLine: {
    ...TYPE.bodySm,
    color: COLORS.text50,
    paddingVertical: 10,
  },
  skeletonRow: {
    height: 64,
    borderRadius: RADII.button,
    backgroundColor: COLORS.surface2,
  },
  skeletonNarrow: {
    width: '72%',
  },
  portals: {
    gap: 10,
    paddingTop: SPACE.unit * 2,
  },
  portalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.cardPad - 4,
    paddingVertical: 16,
  },
  portalAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: RADII.pill,
  },
  portalBody: {
    flex: 1,
    gap: 4,
  },
  portalLineage: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
})
