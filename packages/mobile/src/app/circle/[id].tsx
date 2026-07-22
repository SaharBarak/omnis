import type { GroupMember } from '@pleiad/api-client'
import {
  analyzeGroup,
  analyzeGroupMember,
  type FullGroupAnalysis,
  type GroupMemberAnalysis,
} from '@pleiad/engine/services/group-analysis'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CaretLeftIcon, PencilSimpleIcon, ShareNetworkIcon } from 'phosphor-react-native'
import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { PaywallSheet } from '@/components/billing/paywall-sheet'
import { CircleSheet, type CircleSheetInitial } from '@/components/circles/circle-sheet'
import { IconButton, Text, TopAppBar, Touchable } from '@/components/m3'
import { ShareSheet } from '@/components/share/share-sheet'
import {
  LockedPage,
  MeterBar,
  PageSection,
  ReadingPage,
  SEAL_COLOR_HEX,
} from '@/components/person/scaffold'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useSubscription } from '@/lib/api'
import { useGroup } from '@/lib/groups/hooks'
import { useCountUp } from '@/lib/motion/use-count-up'
import { initialsOf, sentenceCase } from '@/lib/text'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'
import { FLAVORS, type SystemFlavor } from '@/theme/tokens'

/**
 * S12 Circle analysis (F7) — the whole reading computed on-device from the
 * members' birth data via the engine's analyzeGroup. Distributions and
 * balance are open to every plan; the INSIGHTS section is practitioner-gated
 * (Subscription.features.groupAnalysis) — loading/error counts as locked so
 * a gated section never flashes open.
 */

const TOP_ROWS = 5
const SKELETON_ROWS = 3
const AVATAR_SIZE = 48

interface CircleAnalysis {
  analysis: FullGroupAnalysis | null
  analyzable: GroupMemberAnalysis[]
  /** Members whose birth data the engine couldn't read — named honestly. */
  excluded: GroupMember[]
}

function computeCircleAnalysis(
  group: { id: string; name: string; members: GroupMember[] } | undefined
): CircleAnalysis {
  if (group === undefined) return { analysis: null, analyzable: [], excluded: [] }

  const analyzable: GroupMemberAnalysis[] = []
  const readable: GroupMember[] = []
  const excluded: GroupMember[] = []
  for (const member of group.members) {
    try {
      analyzable.push(analyzeGroupMember(member))
      readable.push(member)
    } catch {
      excluded.push(member)
    }
  }

  if (readable.length === 0) return { analysis: null, analyzable, excluded }

  try {
    const analysis = analyzeGroup({
      id: group.id,
      owner_id: '',
      name: group.name,
      description: null,
      created_at: '',
      updated_at: '',
      members: readable,
    })
    return { analysis, analyzable, excluded }
  } catch {
    return { analysis: null, analyzable, excluded }
  }
}

const COLOR_FLAVORS: Array<{ key: 'red' | 'white' | 'blue' | 'yellow'; flavor: SystemFlavor }> = [
  { key: 'red', flavor: { name: 'Red', accent: SEAL_COLOR_HEX.red, accentSoft: SEAL_COLOR_HEX.red } },
  { key: 'white', flavor: { name: 'White', accent: SEAL_COLOR_HEX.white, accentSoft: SEAL_COLOR_HEX.white } },
  { key: 'blue', flavor: { name: 'Blue', accent: SEAL_COLOR_HEX.blue, accentSoft: SEAL_COLOR_HEX.blue } },
  { key: 'yellow', flavor: { name: 'Yellow', accent: SEAL_COLOR_HEX.yellow, accentSoft: SEAL_COLOR_HEX.yellow } },
]

/** Average compatibility — counts up once per mount, tabular. */
function AverageScore({ score }: { score: number }) {
  const display = useCountUp(score)
  return (
    <View>
      <Text variant="dataLarge" color="primary">
        {`${display}%`}
      </Text>
      <Text variant="labelMedium" color="onSurfaceVariant">
        Average compatibility
      </Text>
    </View>
  )
}

/** Skeleton blocks in the shape of the meters they become. Never a spinner. */
function SkeletonRows() {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const pulse = useSharedValue(0.45)

  useEffect(() => {
    if (reduced) return
    pulse.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true)
  }, [reduced, pulse])

  const shimmer = useAnimatedStyle(() => ({ opacity: pulse.value }))

  return (
    <Animated.View style={[styles.stateBlock, shimmer]}>
      {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonBlock,
            { backgroundColor: theme.colors.surfaceContainerHighest },
            index === SKELETON_ROWS - 1 && styles.skeletonNarrow,
          ]}
        />
      ))}
    </Animated.View>
  )
}

function InsightLines({ analysis }: { analysis: FullGroupAnalysis }) {
  if (analysis.insights.length === 0) {
    return (
      <Text variant="bodyMedium" color="onSurfaceVariant">
        The circle reads even: no single pattern dominates yet.
      </Text>
    )
  }
  return (
    <View style={styles.insightList}>
      {analysis.insights.map((insight, index) => (
        <View key={index} style={styles.insightRow}>
          <Text variant="labelLarge" color={FLAVORS.integration.accentSoft}>
            {sentenceCase(insight.type)}
          </Text>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {insight.english}
          </Text>
        </View>
      ))}
    </View>
  )
}

function MemberCell({
  name,
  caption,
  captionColor,
  onPress,
}: {
  name: string
  caption: string
  captionColor: string
  onPress: () => void
}) {
  const theme = useTheme()

  return (
    <Touchable
      onPress={onPress}
      radius={SHAPE.medium}
      stateLayerColor={theme.colors.onSurface}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={styles.memberCell}
    >
      <View
        style={[styles.memberAvatar, { backgroundColor: theme.colors.primaryContainer }]}
      >
        <Text variant="labelLarge" color={theme.colors.onPrimaryContainer}>
          {initialsOf(name)}
        </Text>
      </View>
      <Text
        variant="bodySmall"
        color="onSurface"
        numberOfLines={1}
        style={styles.memberName}
      >
        {name}
      </Text>
      <Text variant="labelMedium" color={captionColor} numberOfLines={1}>
        {caption}
      </Text>
    </Touchable>
  )
}

function MemberGrid({
  members,
  excluded,
  onOpen,
}: {
  members: GroupMemberAnalysis[]
  excluded: GroupMember[]
  onOpen: (personId: string) => void
}) {
  const theme = useTheme()

  return (
    <View style={styles.memberGrid}>
      {members.map((member) => (
        <MemberCell
          key={member.id}
          name={member.name}
          caption={`Kin ${member.dreamspell.kin}`}
          captionColor={FLAVORS.dreamspell.accentSoft}
          onPress={() => onOpen(member.id)}
        />
      ))}
      {excluded.map((member) => (
        <MemberCell
          key={member.id}
          name={member.name}
          caption="No birth data"
          captionColor={theme.colors.onSurfaceVariant}
          onPress={() => onOpen(member.id)}
        />
      ))}
    </View>
  )
}

export default function CircleScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { group, isPending, isError, isRefetching, refetch } = useGroup(id)
  const subscription = useSubscription()

  const [editOpen, setEditOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const { analysis, analyzable, excluded } = useMemo(
    () => computeCircleAnalysis(group),
    [group]
  )

  // Practitioner gate — loading/error = locked so insights never flash open.
  const insightsUnlocked = subscription.data?.features.groupAnalysis === true

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/circles')
  }

  const openPerson = (personId: string) => {
    router.push({ pathname: '/person/[id]', params: { id: personId } })
  }

  const sheetInitial: CircleSheetInitial | undefined =
    group === undefined
      ? undefined
      : {
          id: group.id,
          name: group.name,
          description: group.description,
          memberIds: group.members.map((member) => member.id),
        }

  const renderBody = () => {
    if (isPending) return <SkeletonRows />

    if (isError || group === undefined) {
      return (
        <View style={styles.stateBlock}>
          <ErrorState
            message="This circle is out of reach. We couldn't load it, but it's safe; check your connection."
            retryLabel={isRefetching ? 'Trying…' : 'Try again'}
            onRetry={() => {
              if (!isRefetching) refetch()
            }}
          />
        </View>
      )
    }

    if (group.members.length < 2) {
      return (
        <EmptyState
          title="A circle needs two people."
          body="Add members and the dynamic reads itself: seals, tones, balance."
          actionLabel="Add people"
          onAction={() => setEditOpen(true)}
        />
      )
    }

    if (analysis === null) {
      return (
        <EmptyState
          title="This circle can't be read yet."
          body="None of its members carry a readable birth date."
          actionLabel="Edit the circle"
          onAction={() => setEditOpen(true)}
        />
      )
    }

    const memberCount = analyzable.length
    const topSeals = analysis.dreamspell.sealDistribution
      .filter((item) => item.count > 0)
      .slice(0, TOP_ROWS)
    const topTones = analysis.dreamspell.toneDistribution
      .filter((item) => item.count > 0)
      .slice(0, TOP_ROWS)

    return (
      <ReadingPage>
        <Text variant="labelLarge" color="onSurfaceVariant">
          {`${group.members.length} ${group.members.length === 1 ? 'person' : 'people'} · Circle`}
        </Text>

        {excluded.length > 0 && (
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {excluded.length === 1
              ? `${excluded[0].name} is missing a readable birth date and sits outside this reading.`
              : `${excluded.length} members are missing a readable birth date and sit outside this reading.`}
          </Text>
        )}

        <PageSection index={0} flavor={FLAVORS.dreamspell} eyebrow="Seal distribution">
          {topSeals.map((item) => (
            <MeterBar
              key={item.value}
              label={item.name}
              value={item.count}
              max={memberCount}
              flavor={FLAVORS.dreamspell}
            />
          ))}
        </PageSection>

        <PageSection index={1} flavor={FLAVORS.dreamspell} eyebrow="Tone distribution">
          {topTones.map((item) => (
            <MeterBar
              key={item.value}
              label={item.name}
              value={item.count}
              max={memberCount}
              flavor={FLAVORS.dreamspell}
            />
          ))}
        </PageSection>

        <PageSection index={2} flavor={FLAVORS.dreamspell} eyebrow="Color balance">
          {COLOR_FLAVORS.map(({ key, flavor }) => (
            <MeterBar
              key={key}
              label={flavor.name}
              value={analysis.dreamspell.colorBalance[key].count}
              max={memberCount}
              flavor={flavor}
            />
          ))}
        </PageSection>

        {memberCount >= 2 && (
          <PageSection index={3} flavor={FLAVORS.dreamspell} eyebrow="Resonance">
            <AverageScore score={analysis.compatibility.averageScore} />
            {analysis.compatibility.highestPair !== null && (
              <Text variant="bodyMedium" color="onSurfaceVariant">
                {analysis.compatibility.highestPair.person1} and{' '}
                {analysis.compatibility.highestPair.person2} carry the strongest
                resonance at {analysis.compatibility.highestPair.score}%.
              </Text>
            )}
          </PageSection>
        )}

        <PageSection index={4} flavor={FLAVORS.integration} eyebrow="Insights">
          {insightsUnlocked ? (
            <InsightLines analysis={analysis} />
          ) : (
            <View style={styles.lockHost}>
              <LockedPage
                flavor={FLAVORS.integration}
                systemName="group insight"
                pill="Practitioner unlocks group insights"
                body="The circle's strengths, gaps and patterns are already read and waiting under this veil."
                onUnlock={() => setPaywallOpen(true)}
              >
                <InsightLines analysis={analysis} />
              </LockedPage>
            </View>
          )}
        </PageSection>

        <PageSection index={5} flavor={FLAVORS.dreamspell} eyebrow="Members">
          <MemberGrid members={analyzable} excluded={excluded} onOpen={openPerson} />
        </PageSection>
      </ReadingPage>
    )
  }

  return (
    <View style={styles.screen}>
      <TopAppBar
        title={group?.name ?? 'Circle'}
        navigationIcon={
          <IconButton
            icon={(color) => <CaretLeftIcon size={24} color={color} />}
            onPress={goBack}
            accessibilityLabel="Back"
          />
        }
        actions={
          group !== undefined ? (
            <>
              <IconButton
                icon={(color) => <PencilSimpleIcon size={24} color={color} />}
                onPress={() => setEditOpen(true)}
                accessibilityLabel={`Edit ${group.name}`}
              />
              <IconButton
                icon={(color) => <ShareNetworkIcon size={24} color={color} />}
                onPress={() => setShareOpen(true)}
                accessibilityLabel={`Share ${group.name}`}
              />
            </>
          ) : undefined
        }
      />

      <View style={styles.body}>{renderBody()}</View>

      <CircleSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        initial={sheetInitial}
      />

      <PaywallSheet
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trigger="group-insights"
      />

      {group !== undefined && (
        <ShareSheet
          visible={shareOpen}
          onClose={() => setShareOpen(false)}
          subject={{ type: 'group', groupId: group.id, title: group.name }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  stateBlock: {
    paddingHorizontal: SPACE.margin,
    paddingTop: SPACE.lg,
    gap: SPACE.lg,
  },
  skeletonBlock: {
    height: 56,
    borderRadius: SHAPE.medium,
  },
  skeletonNarrow: {
    width: '62%',
  },
  insightList: {
    gap: SPACE.lg,
  },
  insightRow: {
    gap: SPACE.xs,
  },
  lockHost: {
    minHeight: 260,
  },
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.md,
  },
  memberCell: {
    width: '30%',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
  },
  memberAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    textAlign: 'center',
  },
})
