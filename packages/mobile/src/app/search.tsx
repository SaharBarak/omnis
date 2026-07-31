import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { CaretLeftIcon, MagnifyingGlassIcon } from 'phosphor-react-native'
import { useMemo, useState } from 'react'
import { SectionList, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  Divider,
  IconButton,
  ListItem,
  Text,
  TextField,
  TopAppBar,
} from '@/components/m3'
import { ENV } from '@/lib/env'
import { usePeople } from '@/lib/people/hooks'
import { mobileRouteFor } from '@/lib/routes'
import {
  MIN_REFERENCE_QUERY,
  searchEntries,
  type SearchEntry,
  type SearchGroup,
} from '@/lib/search'
import { SPACE } from '@/theme/m3'

/**
 * Search (#77) — the mobile answer to the web's ⌘K palette.
 *
 * A screen, not a modal: there is no keyboard shortcut to summon a palette
 * on a phone, and a full screen gives the results room the palette never has.
 * Results group People → Pages → Reference, the order of how specific the
 * answer is to this reader.
 */

const GROUP_ORDER: readonly SearchGroup[] = ['People', 'Pages', 'Reference']

export default function SearchScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { people } = usePeople()

  const [query, setQuery] = useState('')

  const sections = useMemo(() => {
    const results = searchEntries(query, people)
    return GROUP_ORDER.map((group) => ({
      title: group,
      data: results.filter((entry) => entry.group === group),
    })).filter((section) => section.data.length > 0)
  }, [query, people])

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  const open = (entry: SearchEntry) => {
    const route = mobileRouteFor(entry.href)
    if (route !== null) {
      router.push(route)
      return
    }
    // Reference entries can point at pages this app doesn't have. Saying so
    // and handing over beats a tap that does nothing.
    void Linking.openURL(`${ENV.apiUrl}${entry.href}`)
  }

  const trimmed = query.trim()
  const empty =
    trimmed.length === 0
      ? 'Search your people, the app, and every card, hexagram, rune, letter and holiday Pleiad knows.'
      : sections.length === 0
        ? `Nothing matches “${trimmed}”.`
        : null

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="Search"
        navigationIcon={
          <IconButton
            icon={(color) => <CaretLeftIcon size={24} color={color} />}
            onPress={goBack}
            accessibilityLabel="Back"
          />
        }
      />

      <View style={styles.field}>
        <TextField
          label="Search"
          value={query}
          onChangeText={setQuery}
          leadingIcon={(color) => <MagnifyingGlassIcon size={24} color={color} />}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Search everything"
        />
        {trimmed.length > 0 && trimmed.length < MIN_REFERENCE_QUERY && (
          <Text variant="bodySmall" color="onSurfaceVariant" style={styles.hint}>
            One more character and the reference libraries join in.
          </Text>
        )}
      </View>

      {empty !== null ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {empty}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + SPACE.xxl }}
          renderSectionHeader={({ section }) => (
            <Text
              variant="labelLarge"
              color="onSurfaceVariant"
              style={styles.sectionHeader}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <ListItem
              headline={item.title}
              supportingText={item.subtitle}
              onPress={() => open(item)}
            />
          )}
          ItemSeparatorComponent={Divider}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  field: {
    paddingHorizontal: SPACE.margin,
    paddingBottom: SPACE.md,
    gap: SPACE.sm,
  },
  hint: {
    paddingHorizontal: SPACE.xs,
  },
  empty: {
    paddingHorizontal: SPACE.margin,
    paddingTop: SPACE.sm,
  },
  sectionHeader: {
    paddingHorizontal: SPACE.margin,
    paddingTop: SPACE.xl,
    paddingBottom: SPACE.sm,
  },
})
