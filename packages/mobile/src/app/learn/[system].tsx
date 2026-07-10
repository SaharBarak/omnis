import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { ArrowSquareOutIcon, CaretLeftIcon } from 'phosphor-react-native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '@/components/ui/empty-state'
import { Eyebrow } from '@/components/ui/primitives'
import { ENV } from '@/lib/env'
import { LIBRARY_DOCS, type LibrarySystemKey } from '@/lib/library/content'
import { COLORS, DURATION, RADII, SPACE, TYPE } from '@/theme/tokens'

/**
 * S14 doc reader — F10. One flavored header band, calm typography, sections
 * separated by flavor-tinted hairlines. Content is bundled
 * (lib/library/content.ts) so the codex reads fully offline; the footer chip
 * hands off to the full web codex.
 */

const STAGGER_MS = 60

export default function LearnDocScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const reduced = useReducedMotion()
  const { system } = useLocalSearchParams<{ system: string }>()

  const doc =
    system !== undefined && system in LIBRARY_DOCS
      ? LIBRARY_DOCS[system as LibrarySystemKey]
      : undefined

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/library')
  }

  if (doc === undefined) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + SPACE.gutter }]}>
        <EmptyState
          title="This page of the codex is blank."
          body="The system you followed doesn't exist here."
          actionLabel="Back to the library"
          onAction={goBack}
        />
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + SPACE.unit * 2 }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={goBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <CaretLeftIcon size={20} color={COLORS.text70} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Flavored header band — accent bar, name, lineage. */}
        <Animated.View
          entering={reduced ? undefined : FadeInUp.duration(DURATION.slow)}
          style={styles.headerBand}
        >
          <View style={[styles.accentBar, { backgroundColor: doc.flavor.accent }]} />
          <View style={styles.headerText}>
            <Eyebrow color={doc.flavor.accentSoft}>{doc.name.toUpperCase()}</Eyebrow>
            <Text style={TYPE.zone}>{doc.title}</Text>
            <Text style={styles.lineage}>{doc.lineage}</Text>
          </View>
        </Animated.View>

        {doc.intro.map((paragraph, index) => (
          <Animated.Text
            key={index}
            entering={
              reduced
                ? undefined
                : FadeInUp.duration(DURATION.slow).delay((index + 1) * STAGGER_MS)
            }
            style={styles.intro}
          >
            {paragraph}
          </Animated.Text>
        ))}

        {doc.sections.map((section, index) => (
          <Animated.View
            key={section.title}
            entering={
              reduced
                ? undefined
                : FadeInUp.duration(DURATION.slow).delay(
                    (doc.intro.length + index + 1) * STAGGER_MS
                  )
            }
            style={styles.section}
          >
            <View
              style={[styles.sectionHairline, { backgroundColor: doc.flavor.accent }]}
            />
            <Text style={TYPE.section}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </Animated.View>
        ))}

        <Pressable
          onPress={() => {
            void Linking.openURL(`${ENV.apiUrl}/learn/${doc.key}`)
          }}
          style={[styles.webChip, { borderColor: doc.flavor.accent }]}
          accessibilityRole="button"
          accessibilityLabel="Read the full codex on the web"
        >
          <Text style={[TYPE.eyebrow, { color: doc.flavor.accentSoft }]}>
            READ THE FULL CODEX ON THE WEB
          </Text>
          <ArrowSquareOutIcon size={14} color={doc.flavor.accentSoft} />
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.gutter - 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACE.gutter,
    paddingTop: SPACE.cardPad,
    paddingBottom: SPACE.section * 2,
    gap: SPACE.cardPad,
  },
  headerBand: {
    flexDirection: 'row',
    gap: SPACE.cardPad - 4,
    paddingBottom: SPACE.unit * 2,
  },
  accentBar: {
    width: 3,
    borderRadius: RADII.pill,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  lineage: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  intro: {
    ...TYPE.body,
    color: COLORS.text70,
  },
  section: {
    gap: 10,
    paddingTop: SPACE.unit * 3,
  },
  sectionHairline: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.35,
    marginBottom: 6,
  },
  sectionBody: {
    ...TYPE.body,
    color: COLORS.text70,
  },
  webChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: SPACE.cardPad,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
})
