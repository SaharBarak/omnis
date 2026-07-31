import { ARTICLE_BY_SLUG, TOPIC_LABELS } from '@pleiad/engine/data/articles'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowSquareOutIcon, CaretLeftIcon } from 'phosphor-react-native'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  Button,
  Chip,
  Divider,
  IconButton,
  Text,
  TopAppBar,
  useScrollProgress,
} from '@/components/m3'
import { EmptyState } from '@/components/ui/empty-state'
import { ENV } from '@/lib/env'
import { FavoriteStar } from '@/components/favorite-star'
import { mobileRouteFor } from '@/lib/routes'
import { DURATION, SPACE } from '@/theme/m3'

/**
 * One Q&A article. Same text as the web's /app/library/<slug> — the content
 * is shared data, not a mobile retelling of it.
 *
 * "Related" links point at web paths in the data. Ones with a mobile home are
 * mapped to it; the rest hand off to the browser rather than pretending a
 * screen exists.
 */

const STAGGER_MS = 60
const COLLAPSE_DISTANCE = 120

export default function ArticleScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const reduced = useReducedMotion()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { progress, onScroll } = useScrollProgress(COLLAPSE_DISTANCE)

  const article = slug === undefined ? undefined : ARTICLE_BY_SLUG[slug]

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

  if (article === undefined) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="" navigationIcon={backButton} />
        <EmptyState
          title="No such article."
          body="This piece isn't in the library."
          actionLabel="Back to the library"
          onAction={goBack}
        />
      </View>
    )
  }

  const openRelated = (href: string) => {
    const mapped = mobileRouteFor(href)
    if (mapped !== null) {
      router.push(mapped)
      return
    }
    void Linking.openURL(`${ENV.apiUrl}${href}`)
  }

  return (
    <View style={styles.screen}>
      <TopAppBar
        title={article.title}
        navigationIcon={backButton}
        progress={progress}
        actions={
          <FavoriteStar
            href={`/app/library/${article.slug}`}
            title={article.title}
          />
        }
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACE.xxl },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.meta}>
            <Chip label={TOPIC_LABELS[article.topic]} variant="suggestion" />
            <Text variant="labelMedium" color="onSurfaceVariant">
              {article.minutes} min read
            </Text>
          </View>
          {/* The question is the article's whole organizing idea, so it leads. */}
          <Text variant="headlineSmall" color="onSurface">
            {article.question}
          </Text>
        </View>

        {article.sections.map((section, index) => (
          <Animated.View
            key={section.heading ?? `section-${index}`}
            entering={
              reduced
                ? undefined
                : FadeInUp.duration(DURATION.medium4).delay((index + 1) * STAGGER_MS)
            }
            style={styles.section}
          >
            {section.heading !== undefined && (
              <>
                <Divider />
                <Text variant="titleMedium" color="onSurface">
                  {section.heading}
                </Text>
              </>
            )}
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph.slice(0, 40)} variant="bodyLarge" color="onSurfaceVariant">
                {paragraph}
              </Text>
            ))}
          </Animated.View>
        ))}

        {article.related.length > 0 && (
          <View style={styles.related}>
            <Divider />
            <Text variant="labelLarge" color="onSurfaceVariant">
              Read next
            </Text>
            {article.related.map((link) => (
              <Button
                key={link.href}
                variant="outlined"
                fullWidth
                onPress={() => openRelated(link.href)}
                icon={
                  mobileRouteFor(link.href) === null
                    ? (color) => <ArrowSquareOutIcon size={18} color={color} />
                    : undefined
                }
              >
                {link.label}
              </Button>
            ))}
          </View>
        )}
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
    gap: SPACE.lg,
  },
  header: {
    gap: SPACE.md,
    paddingTop: SPACE.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  section: {
    gap: SPACE.md,
  },
  related: {
    gap: SPACE.md,
    paddingTop: SPACE.md,
  },
})
