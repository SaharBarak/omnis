import { Image } from 'expo-image'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowSquareOutIcon, CaretLeftIcon } from 'phosphor-react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import Animated, {
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  Button,
  Divider,
  IconButton,
  Text,
  TopAppBar,
  useScrollProgress,
} from '@/components/m3'
import { EmptyState } from '@/components/ui/empty-state'
import { ENV } from '@/lib/env'
import { LIBRARY_DOCS, type LibrarySystemKey } from '@/lib/library/content'
import { muralFor } from '@/lib/library/murals'
import { DURATION, SPACE, SHAPE, alpha, useTheme } from '@/theme/m3'

/**
 * The doc reader. Content is bundled (lib/library/content.ts) so the codex
 * reads fully offline; the footer button hands off to the full web codex.
 */

const STAGGER_MS = 60

const BANNER_HEIGHT = 200
/** How far the mural travels while the page scrolls it away — a half-speed drift. */
const BANNER_PARALLAX = 48

/** The banner is a backdrop for the header text, so it is held well under it. */
const MURAL_OPACITY = 0.5
const MURAL_SCRIM_OPACITY = 0.45

export default function LearnDocScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const theme = useTheme()
  const reduced = useReducedMotion()
  const { system } = useLocalSearchParams<{ system: string }>()
  const { progress, onScroll } = useScrollProgress(BANNER_HEIGHT)

  // The mural collapses with the scroll rather than sliding away with the
  // content: it fades as it drifts, so the top app bar's tint takes over.
  const bannerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -BANNER_PARALLAX]) }],
  }))

  const doc =
    system !== undefined && system in LIBRARY_DOCS
      ? LIBRARY_DOCS[system as LibrarySystemKey]
      : undefined

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/library')
  }

  const backButton = (
    <IconButton
      icon={(color) => <CaretLeftIcon size={24} color={color} />}
      onPress={goBack}
      accessibilityLabel="Back"
    />
  )

  if (doc === undefined) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="" navigationIcon={backButton} />
        <EmptyState
          title="This page of the codex is blank."
          body="The system you followed doesn't exist here."
          actionLabel="Back to the library"
          onAction={goBack}
        />
      </View>
    )
  }

  const mural = muralFor(doc.key)

  return (
    <View style={styles.screen}>
      <TopAppBar title={doc.name} navigationIcon={backButton} progress={progress} />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACE.xxl * 2 },
        ]}
      >
        <View style={[styles.header, mural !== undefined && styles.headerWithMural]}>
          {mural !== undefined && (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, reduced ? undefined : bannerStyle]}
            >
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
            </Animated.View>
          )}

          <View style={styles.headerRow}>
            <View style={[styles.accentRail, { backgroundColor: doc.flavor.accent }]} />
            <View style={styles.headerText}>
              <Text variant="labelLarge" color={doc.flavor.accentSoft}>
                {doc.name}
              </Text>
              <Text variant="headlineSmall" color="onSurface">
                {doc.title}
              </Text>
              <Text variant="bodyMedium" color="onSurfaceVariant">
                {doc.lineage}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {doc.intro.map((paragraph, index) => (
            <Animated.View
              key={index}
              entering={
                reduced
                  ? undefined
                  : FadeInUp.duration(DURATION.medium4).delay((index + 1) * STAGGER_MS)
              }
            >
              <Text variant="bodyLarge" color="onSurfaceVariant">
                {paragraph}
              </Text>
            </Animated.View>
          ))}

          {doc.sections.map((section, index) => (
            <Animated.View
              key={section.title}
              entering={
                reduced
                  ? undefined
                  : FadeInUp.duration(DURATION.medium4).delay(
                      (doc.intro.length + index + 1) * STAGGER_MS
                    )
              }
              style={styles.section}
            >
              <Divider />
              <Text variant="titleMedium" color="onSurface">
                {section.title}
              </Text>
              <Text variant="bodyLarge" color="onSurfaceVariant">
                {section.body}
              </Text>
            </Animated.View>
          ))}

          <View style={styles.webLink}>
            <Button
              variant="outlined"
              fullWidth
              onPress={() => {
                void Linking.openURL(`${ENV.apiUrl}${doc.webPath ?? `/learn/${doc.key}`}`)
              }}
              icon={(color) => <ArrowSquareOutIcon size={18} color={color} />}
            >
              Read the full codex on the web
            </Button>
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
    gap: SPACE.xl,
  },
  header: {
    justifyContent: 'flex-end',
    overflow: 'hidden',
    paddingHorizontal: SPACE.margin,
    paddingBottom: SPACE.lg,
  },
  headerWithMural: {
    minHeight: BANNER_HEIGHT,
    paddingTop: SPACE.xxl,
  },
  mural: {
    opacity: MURAL_OPACITY,
  },
  headerRow: {
    flexDirection: 'row',
    gap: SPACE.md,
  },
  accentRail: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: SHAPE.full,
  },
  headerText: {
    flex: 1,
    gap: SPACE.sm,
  },
  body: {
    paddingHorizontal: SPACE.margin,
    gap: SPACE.lg,
  },
  section: {
    gap: SPACE.md,
    paddingTop: SPACE.sm,
  },
  webLink: {
    paddingTop: SPACE.lg,
  },
})
