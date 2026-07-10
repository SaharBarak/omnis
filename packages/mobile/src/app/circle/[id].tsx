import type { GroupMember } from '@pleiad/api-client'
import {
  analyzeGroup,
  analyzeGroupMember,
  type FullGroupAnalysis,
  type GroupMemberAnalysis,
} from '@pleiad/engine/services/group-analysis'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CaretLeftIcon, PencilSimpleIcon, ShareNetworkIcon } from 'phosphor-react-native'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { PaywallSheet } from '@/components/billing/paywall-sheet'
import { CircleSheet, type CircleSheetInitial } from '@/components/circles/circle-sheet'
import { ShareSheet } from '@/components/share/share-sheet'
import {
  LockedPage,
  MeterBar,
  PageSection,
  ReadingPage,
  SEAL_COLOR_HEX,
} from '@/components/person/scaffold'
import { EmptyState } from '@/components/ui/empty-state'
import { Button, Eyebrow, Panel, StatNumber } from '@/components/ui/primitives'
import { ToastHost } from '@/components/ui/toast'
import { useSubscription } from '@/lib/api'
import { useGroup } from '@/lib/groups/hooks'
import { useCountUp } from '@/lib/motion/use-count-up'
import { COLORS, FLAVORS, RADII, SPACE, TYPE, type SystemFlavor } from '@/theme/tokens'

/**
 * S12 Circle analysis (F7) — the whole reading computed on-device from the
 * members' birth data via the engine's analyzeGroup. Distributions and
 * balance are open to every plan; the INSIGHTS section is practitioner-gated
 * (Subscription.features.groupAnalysis) — loading/error counts as locked so
 * a gated section never flashes open.
 */

const TOP_ROWS = 5

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

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}

const COLOR_FLAVORS: Array<{ key: 'red' | 'white' | 'blue' | 'yellow'; flavor: SystemFlavor }> = [
  { key: 'red', flavor: { name: 'Red', accent: SEAL_COLOR_HEX.red, accentSoft: SEAL_COLOR_HEX.red } },
  { key: 'white', flavor: { name: 'White', accent: SEAL_COLOR_HEX.white, accentSoft: SEAL_COLOR_HEX.white } },
  { key: 'blue', flavor: { name: 'Blue', accent: SEAL_COLOR_HEX.blue, accentSoft: SEAL_COLOR_HEX.blue } },
  { key: 'yellow', flavor: { name: 'Yellow', accent: SEAL_COLOR_HEX.yellow, accentSoft: SEAL_COLOR_HEX.yellow } },
]

/** Average compatibility — counts up once per mount, tabular mono. */
function AverageScore({ score }: { score: number }) {
  const display = useCountUp(score)
  return <StatNumber value={`${display}%`} label="AVERAGE COMPATIBILITY" />
}

function InsightLines({ analysis }: { analysis: FullGroupAnalysis }) {
  if (analysis.insights.length === 0) {
    return (
      <Text style={styles.quietLine}>
        The circle reads even — no single pattern dominates yet.
      </Text>
    )
  }
  return (
    <View style={styles.insightList}>
      {analysis.insights.map((insight, index) => (
        <View key={index} style={styles.insightRow}>
          <Eyebrow color={FLAVORS.integration.accentSoft}>
            {insight.type.toUpperCase()}
          </Eyebrow>
          <Text style={styles.insightBody}>{insight.english}</Text>
        </View>
      ))}
    </View>
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
  return (
    <View style={styles.memberGrid}>
      {members.map((member) => (
        <Pressable
          key={member.id}
          onPress={() => onOpen(member.id)}
          style={styles.memberCell}
          accessibilityRole="button"
          accessibilityLabel={member.name}
        >
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>{initialsOf(member.name)}</Text>
          </View>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.name}
          </Text>
          <Eyebrow color={FLAVORS.dreamspell.accentSoft}>
            {`KIN ${member.dreamspell.kin}`}
          </Eyebrow>
        </Pressable>
      ))}
      {excluded.map((member) => (
        <Pressable
          key={member.id}
          onPress={() => onOpen(member.id)}
          style={styles.memberCell}
          accessibilityRole="button"
          accessibilityLabel={member.name}
        >
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>{initialsOf(member.name)}</Text>
          </View>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.name}
          </Text>
          <Eyebrow>NO BIRTH DATA</Eyebrow>
        </Pressable>
      ))}
    </View>
  )
}

export default function CircleScreen() {
  const insets = useSafeAreaInsets()
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
    if (isPending) {
      return (
        <View style={styles.stateBlock}>
          <View style={[styles.skeletonBlock, styles.skeletonWide]} />
          <View style={[styles.skeletonBlock, styles.skeletonWide]} />
          <View style={[styles.skeletonBlock, styles.skeletonNarrow]} />
        </View>
      )
    }

    if (isError || group === undefined) {
      return (
        <View style={styles.stateBlock}>
          <Panel style={styles.errorPanel}>
            <Text style={TYPE.card}>This circle is out of reach.</Text>
            <Text style={styles.errorBody}>
              We couldn't load it. It's safe — check your connection.
            </Text>
            <Button variant="secondary" onPress={refetch} disabled={isRefetching}>
              {isRefetching ? 'Trying…' : 'Try again'}
            </Button>
          </Panel>
        </View>
      )
    }

    if (group.members.length < 2) {
      return (
        <EmptyState
          title="A circle needs two people."
          body="Add members and the dynamic reads itself — seals, tones, balance."
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
        {excluded.length > 0 && (
          <Text style={styles.quietLine}>
            {excluded.length === 1
              ? `${excluded[0].name} is missing a readable birth date and sits outside this reading.`
              : `${excluded.length} members are missing a readable birth date and sit outside this reading.`}
          </Text>
        )}

        <PageSection index={0} flavor={FLAVORS.dreamspell} eyebrow="SEAL DISTRIBUTION">
          {topSeals.map((item) => (
            <MeterBar
              key={item.value}
              label={item.name.toUpperCase()}
              value={item.count}
              max={memberCount}
              flavor={FLAVORS.dreamspell}
            />
          ))}
        </PageSection>

        <PageSection index={1} flavor={FLAVORS.dreamspell} eyebrow="TONE DISTRIBUTION">
          {topTones.map((item) => (
            <MeterBar
              key={item.value}
              label={item.name.toUpperCase()}
              value={item.count}
              max={memberCount}
              flavor={FLAVORS.dreamspell}
            />
          ))}
        </PageSection>

        <PageSection index={2} flavor={FLAVORS.dreamspell} eyebrow="COLOR BALANCE">
          {COLOR_FLAVORS.map(({ key, flavor }) => (
            <MeterBar
              key={key}
              label={flavor.name.toUpperCase()}
              value={analysis.dreamspell.colorBalance[key].count}
              max={memberCount}
              flavor={flavor}
            />
          ))}
        </PageSection>

        {memberCount >= 2 && (
          <PageSection index={3} flavor={FLAVORS.dreamspell} eyebrow="RESONANCE">
            <AverageScore score={analysis.compatibility.averageScore} />
            {analysis.compatibility.highestPair !== null && (
              <Text style={styles.quietLine}>
                {analysis.compatibility.highestPair.person1} and{' '}
                {analysis.compatibility.highestPair.person2} carry the strongest
                resonance at {analysis.compatibility.highestPair.score}%.
              </Text>
            )}
          </PageSection>
        )}

        <PageSection index={4} flavor={FLAVORS.integration} eyebrow="INSIGHTS">
          {insightsUnlocked ? (
            <InsightLines analysis={analysis} />
          ) : (
            <View style={styles.lockHost}>
              <LockedPage
                flavor={FLAVORS.integration}
                systemName="group insight"
                pill="PRACTITIONER UNLOCKS GROUP INSIGHTS"
                body="The circle's strengths, gaps and patterns are already read and waiting under this veil."
                onUnlock={() => setPaywallOpen(true)}
              >
                <InsightLines analysis={analysis} />
              </LockedPage>
            </View>
          )}
        </PageSection>

        <PageSection index={5} flavor={FLAVORS.dreamspell} eyebrow="MEMBERS">
          <MemberGrid members={analyzable} excluded={excluded} onOpen={openPerson} />
        </PageSection>
      </ReadingPage>
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
        <View style={styles.topBarSpacer} />
        {group !== undefined && (
          <>
            <Pressable
              onPress={() => setEditOpen(true)}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${group.name}`}
            >
              <PencilSimpleIcon size={20} color={COLORS.text70} />
            </Pressable>
            <Pressable
              onPress={() => setShareOpen(true)}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={`Share ${group.name}`}
            >
              <ShareNetworkIcon size={20} color={COLORS.text70} />
            </Pressable>
          </>
        )}
      </View>

      {group !== undefined && (
        <View style={styles.header}>
          <Eyebrow>
            {`${group.members.length} ${group.members.length === 1 ? 'PERSON' : 'PEOPLE'} · CIRCLE`}
          </Eyebrow>
          <Text style={TYPE.zone} numberOfLines={1}>
            {group.name}
          </Text>
        </View>
      )}

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

      <ToastHost />
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
  topBarSpacer: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: SPACE.gutter,
    paddingTop: SPACE.unit * 2,
    paddingBottom: SPACE.unit * 2,
    gap: 6,
  },
  body: {
    flex: 1,
  },
  stateBlock: {
    paddingHorizontal: SPACE.gutter,
    paddingTop: SPACE.cardPad,
    gap: 14,
  },
  skeletonBlock: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.button,
  },
  skeletonWide: {
    height: 56,
  },
  skeletonNarrow: {
    height: 56,
    width: '62%',
  },
  errorPanel: {
    gap: 14,
  },
  errorBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  quietLine: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  insightList: {
    gap: SPACE.cardPad,
  },
  insightRow: {
    gap: 4,
  },
  insightBody: {
    ...TYPE.body,
    color: COLORS.text70,
  },
  lockHost: {
    minHeight: 260,
  },
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  memberCell: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberAvatarText: {
    ...TYPE.eyebrow,
    color: COLORS.text70,
    letterSpacing: 1,
  },
  memberName: {
    ...TYPE.bodySm,
    color: COLORS.text90,
    textAlign: 'center',
  },
})
