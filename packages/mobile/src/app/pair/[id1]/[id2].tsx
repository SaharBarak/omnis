import type {
  PersonWithTags,
  RelationshipStrength,
  RelationshipType,
} from '@pleiad/api-client'
import { compareNames } from '@pleiad/engine/calculations/gematria'
import {
  calculateFiveSystemCompatibility,
  getHarmonyLabel,
  type CompatSystem,
  type FiveSystemCompatibility,
  type PersonCompatInput,
} from '@pleiad/engine/services/compatibility'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CaretDownIcon, CaretLeftIcon, CaretUpIcon } from 'phosphor-react-native'
import { useMemo, useState, type PropsWithChildren, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { BondSheet } from '@/components/pair/bond-sheet'
import { PaywallSheet } from '@/components/billing/paywall-sheet'
import { Button, IconButton, Text, TopAppBar, Touchable } from '@/components/m3'
import {
  DataRow,
  LockedPage,
  MeterBar,
  PageSection,
  ReadingPage,
} from '@/components/person/scaffold'
import { EmptyState } from '@/components/ui/empty-state'
import { useSubscription } from '@/lib/api'
import { useCountUp } from '@/lib/motion/use-count-up'
import { usePeople } from '@/lib/people/hooks'
import { sentenceCase, initialsOf  } from '@/lib/text'
import { useCreateRelationship } from '@/lib/relationships/hooks'
import { showToast } from '@/lib/toast'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'
import { FLAVORS, type SystemFlavor } from '@/theme/tokens'

/**
 * S9 Pair compare (F5) — the five-system reading of a bond, computed
 * on-device from both persons' birth data via the engine's fusion. Scores
 * count up once; each system expands into what the engine can honestly
 * derive (missing inputs render calm needs-data rows, never zeros dressed
 * as truth). Relationships are a complete+ feature: below that plan only
 * the Dreamspell row opens — the other four wait under the veil.
 */

const SYSTEM_ORDER: ReadonlyArray<{
  key: CompatSystem
  label: string
  flavor: SystemFlavor
  missingNote: string
}> = [
  {
    key: 'dreamspell',
    label: 'Dreamspell',
    flavor: FLAVORS.dreamspell,
    missingNote: 'Needs birth dates',
  },
  {
    key: 'tzolkin',
    label: 'Tzolkin',
    flavor: FLAVORS.tzolkin,
    missingNote: 'Needs birth dates',
  },
  {
    key: 'astrology',
    label: 'Astrology',
    flavor: FLAVORS.astrology,
    missingNote: 'Needs birth data',
  },
  {
    key: 'humanDesign',
    label: 'Human Design',
    flavor: FLAVORS.humanDesign,
    missingNote: 'Needs both birth times',
  },
  {
    key: 'gematria',
    label: 'Kabbalah',
    flavor: FLAVORS.gematria,
    missingNote: 'Needs both Hebrew names',
  },
]

const TOP_ASPECTS = 3
const AVATAR_SIZE = 48

function toCompatInput(person: PersonWithTags): PersonCompatInput {
  return {
    birthDate: person.birth_date,
    birthTime: person.birth_time,
    birthPlace: person.birth_place,
    hebrewName: person.hebrew_name,
    name: person.name,
  }
}

function PairAvatars({ name1, name2 }: { name1: string; name2: string }) {
  const theme = useTheme()
  return (
    <View style={styles.avatars}>
      <View
        style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
      >
        <Text variant="labelLarge" color={theme.colors.onPrimaryContainer}>
          {initialsOf(name1)}
        </Text>
      </View>
      <View
        style={[
          styles.avatar,
          styles.avatarOverlap,
          {
            backgroundColor: theme.colors.secondaryContainer,
            borderColor: theme.colors.surface,
          },
        ]}
      >
        <Text variant="labelLarge" color={theme.colors.onSecondaryContainer}>
          {initialsOf(name2)}
        </Text>
      </View>
    </View>
  )
}

/** Micro line inside an expanded system detail. */
function DetailLine({ eyebrow, body }: { eyebrow?: string; body: string }) {
  return (
    <View style={styles.detailLine}>
      {eyebrow !== undefined && (
        <Text variant="labelMedium" color="onSurfaceVariant">
          {eyebrow}
        </Text>
      )}
      <Text variant="bodyMedium" color="onSurfaceVariant">
        {body}
      </Text>
    </View>
  )
}

/** Available system: weight-labelled meter + count-up score + expandable detail. */
function SystemRow({
  index,
  flavor,
  label,
  score,
  weight,
  children,
}: PropsWithChildren<{
  index: number
  flavor: SystemFlavor
  label: string
  score: number
  weight: number
}>) {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const display = useCountUp(score)
  const Caret = expanded ? CaretUpIcon : CaretDownIcon

  return (
    <PageSection index={index} flavor={flavor} eyebrow={label}>
      <Touchable
        onPress={() => setExpanded((value) => !value)}
        radius={SHAPE.small}
        stateLayerColor={theme.colors.onSurface}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${label} detail`}
        style={styles.meterRow}
      >
        <View style={styles.meterWrap}>
          <MeterBar
            label={`${Math.round(weight * 100)}%`}
            value={display}
            max={100}
            flavor={flavor}
          />
        </View>
        <Caret size={18} color={theme.colors.onSurfaceVariant} />
      </Touchable>
      {expanded && <View style={styles.detailBlock}>{children}</View>}
    </PageSection>
  )
}

/** System the engine can't derive yet — the honest partial state. */
function MissingRow({
  index,
  flavor,
  label,
  note,
}: {
  index: number
  flavor: SystemFlavor
  label: string
  note: string
}) {
  return (
    <PageSection index={index} flavor={flavor} eyebrow={label}>
      <Text variant="labelMedium" color="onSurfaceVariant">
        {note}
      </Text>
    </PageSection>
  )
}

/** Static preview row rendered under the plan veil (no count-up, no expand). */
function PreviewRow({
  flavor,
  label,
  score,
  weight,
  available,
  missingNote,
}: {
  flavor: SystemFlavor
  label: string
  score: number
  weight: number
  available: boolean
  missingNote: string
}) {
  return (
    <View style={styles.previewRow}>
      <Text variant="labelLarge" color={flavor.accentSoft}>
        {label}
      </Text>
      {available ? (
        <MeterBar
          label={`${Math.round(weight * 100)}%`}
          value={score}
          max={100}
          flavor={flavor}
        />
      ) : (
        <Text variant="labelMedium" color="onSurfaceVariant">
          {missingNote}
        </Text>
      )}
    </View>
  )
}

function systemDetail(
  key: CompatSystem,
  fusion: FiveSystemCompatibility,
  person1: PersonWithTags,
  person2: PersonWithTags
): ReactNode {
  switch (key) {
    case 'dreamspell': {
      const detail = fusion.dreamspellDetail
      return (
        <>
          <DataRow
            label="Kins"
            value={`${detail.person1Kin} × ${detail.person2Kin}`}
            mono
            last={detail.connections.length === 0}
          />
          {detail.connections.length === 0 ? (
            <DetailLine body="No direct oracle relation — two distinct currents." />
          ) : (
            detail.connections.map((connection) => (
              <DetailLine
                key={connection.type}
                eyebrow={getHarmonyLabel(connection.harmony).english}
                body={connection.description}
              />
            ))
          )}
        </>
      )
    }
    case 'tzolkin': {
      const detail = fusion.tzolkinDetail
      return (
        <>
          <DataRow
            label="Sign · tone"
            value={`${detail.person1Sign}·${detail.person1Tone} × ${detail.person2Sign}·${detail.person2Tone}`}
            mono
            last={detail.connections.length === 0}
          />
          {detail.connections.length === 0 ? (
            <DetailLine body="No shared sign, tone or trecena — complementary counts." />
          ) : (
            detail.connections.map((connection) => (
              <DetailLine key={connection.type} body={connection.description} />
            ))
          )}
        </>
      )
    }
    case 'astrology': {
      const detail = fusion.synastryDetail
      if (detail === null) return null
      const aspects = detail.connections
        .filter((connection) => connection.type === 'cross-aspect')
        .slice(0, TOP_ASPECTS)
      const elements = detail.connections.filter(
        (connection) => connection.type === 'element'
      )
      return (
        <>
          {aspects.length === 0 && elements.length === 0 && (
            <DetailLine body="No major cross-aspects between the key planets." />
          )}
          {aspects.map((connection, index) => (
            <DetailLine
              key={`${connection.planet1 ?? 'p1'}-${connection.planet2 ?? 'p2'}-${index}`}
              eyebrow={sentenceCase(connection.aspect ?? 'aspect')}
              body={connection.description}
            />
          ))}
          {elements.map((connection, index) => (
            <DetailLine key={`element-${index}`} body={connection.description} />
          ))}
        </>
      )
    }
    case 'humanDesign': {
      const detail = fusion.hdDetail
      if (detail === null) return null
      const electromagnetic = detail.connections.filter(
        (connection) => connection.type === 'electromagnetic'
      )
      return (
        <>
          {detail.type1 !== undefined && detail.type2 !== undefined && (
            <DataRow
              label="Types"
              value={`${detail.type1} × ${detail.type2}`}
              last={false}
            />
          )}
          {detail.typeDynamic !== undefined && (
            <DetailLine eyebrow="Type dynamic" body={detail.typeDynamic.english} />
          )}
          {electromagnetic.length === 0 ? (
            <DetailLine body="No electromagnetic channels — this bond runs on companionship, not spark." />
          ) : (
            electromagnetic.map((connection) => (
              <DetailLine
                key={connection.channelId}
                eyebrow={`Channel ${connection.gates[0]}–${connection.gates[1]}`}
                body={connection.description}
              />
            ))
          )}
        </>
      )
    }
    case 'gematria': {
      const name1 = person1.hebrew_name?.trim() ?? ''
      const name2 = person2.hebrew_name?.trim() ?? ''
      if (name1.length === 0 || name2.length === 0) return null
      try {
        const comparison = compareNames(name1, name2)
        return (
          <>
            <DataRow
              label="Values"
              value={`${comparison.value1} × ${comparison.value2}`}
              mono
              last={false}
            />
            <DataRow
              label="Shared root"
              value={comparison.sharedDigitalRoot ? 'Yes' : 'No'}
              last={false}
            />
            {comparison.interpretation !== null && (
              <DetailLine body={comparison.interpretation} />
            )}
          </>
        )
      } catch {
        return <DetailLine body="The names resist calculation — check the spelling." />
      }
    }
    default:
      return null
  }
}

export default function PairScreen() {
  const router = useRouter()
  const { id1, id2 } = useLocalSearchParams<{ id1: string; id2: string }>()

  const { people, isPending } = usePeople()
  const subscription = useSubscription()

  const [bondOpen, setBondOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)

  const person1 = people.find((person) => person.id === id1)
  const person2 = people.find((person) => person.id === id2)

  const fusion = useMemo<FiveSystemCompatibility | null>(() => {
    if (person1 === undefined || person2 === undefined) return null
    try {
      return calculateFiveSystemCompatibility(
        toCompatInput(person1),
        toCompatInput(person2)
      )
    } catch {
      return null
    }
  }, [person1, person2])

  const createRelationship = useCreateRelationship({
    onDuplicate: () => showToast('Already on your map'),
  })

  // Entitlements — relationships open at complete+ (§6). Loading/error reads
  // as locked so the stack never flashes open while the plan resolves.
  const relationshipsFeature = subscription.data?.features.relationships
  const unlocked = relationshipsFeature === 'basic' || relationshipsFeature === 'advanced'

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/map')
  }

  const backButton = (
    <IconButton
      icon={(color) => <CaretLeftIcon size={24} color={color} />}
      onPress={goBack}
      accessibilityLabel="Back"
    />
  )

  const keepBond = (type: RelationshipType, strength: RelationshipStrength) => {
    if (person1 === undefined || person2 === undefined) return
    setBondOpen(false)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    createRelationship.mutate({
      person1_id: person1.id,
      person2_id: person2.id,
      type,
      strength,
    })
    // Optimistic — the edge is already on the map when it appears.
    router.replace('/map')
  }

  const invalidPair = id1 === undefined || id2 === undefined || id1 === id2

  if (invalidPair || person1 === undefined || person2 === undefined || fusion === null) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="" navigationIcon={backButton} />
        <EmptyState
          title={
            isPending && !invalidPair ? 'Aligning the charts…' : "This pair isn't on your map."
          }
          body={
            isPending && !invalidPair
              ? undefined
              : 'Both people need to be on your map to compare them.'
          }
          actionLabel="Back to the map"
          onAction={goBack}
        />
      </View>
    )
  }

  const compositeScore = unlocked ? fusion.overallScore : fusion.systems.dreamspell.score

  const availableRows = SYSTEM_ORDER.map((system, index) => {
    const entry = fusion.systems[system.key]
    if (!entry.available) {
      return (
        <MissingRow
          key={system.key}
          index={index + 1}
          flavor={system.flavor}
          label={system.label}
          note={system.missingNote}
        />
      )
    }
    return (
      <SystemRow
        key={system.key}
        index={index + 1}
        flavor={system.flavor}
        label={system.label}
        score={entry.score}
        weight={entry.weight}
      >
        {systemDetail(system.key, fusion, person1, person2)}
      </SystemRow>
    )
  })

  const dreamspellRow = availableRows[0]
  const lockedRows = SYSTEM_ORDER.slice(1).map((system) => {
    const entry = fusion.systems[system.key]
    return (
      <PreviewRow
        key={system.key}
        flavor={system.flavor}
        label={system.label}
        score={entry.score}
        weight={entry.weight}
        available={entry.available}
        missingNote={system.missingNote}
      />
    )
  })

  return (
    <View style={styles.screen}>
      <TopAppBar
        title={`${person1.name} × ${person2.name}`}
        navigationIcon={backButton}
      />

      <View style={styles.header}>
        <PairAvatars name1={person1.name} name2={person2.name} />
      </View>

      <ReadingPage>
        <PageSection index={0} flavor={FLAVORS.integration} eyebrow="Resonance">
          <CompositeScore
            score={compositeScore}
            label={unlocked ? 'Composite' : 'Dreamspell only'}
          />
          {unlocked && (
            <Text variant="bodyMedium" color="onSurfaceVariant">
              {fusion.summary.english}
            </Text>
          )}
        </PageSection>

        {unlocked ? (
          availableRows
        ) : (
          <>
            {dreamspellRow}
            <View style={styles.lockWrap}>
              <LockedPage
                flavor={FLAVORS.integration}
                systemName="full compatibility"
                pill="Complete unlocks this bond"
                body="Four more systems are already computed for this pair — synastry, Human Design, Tzolkin and name resonance wait under the veil."
                onUnlock={() => setPaywallOpen(true)}
              >
                <View style={styles.lockPreviewRows}>{lockedRows}</View>
              </LockedPage>
            </View>
          </>
        )}

        <PageSection
          index={SYSTEM_ORDER.length + 1}
          flavor={FLAVORS.integration}
        >
          {/* The one filled button on the page — this is the page's whole point. */}
          <Button fullWidth disabled={!unlocked} onPress={() => setBondOpen(true)}>
            Keep this bond
          </Button>
          {!unlocked && (
            <Text
              variant="labelMedium"
              color="onSurfaceVariant"
              style={styles.gateNote}
            >
              Bonds open with Complete
            </Text>
          )}
        </PageSection>
      </ReadingPage>

      <BondSheet
        visible={bondOpen}
        onClose={() => setBondOpen(false)}
        onKeep={keepBond}
      />

      <PaywallSheet
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trigger="bond-lock"
      />
    </View>
  )
}

/** The big number — counts up once, tabular. */
function CompositeScore({ score, label }: { score: number; label: string }) {
  const display = useCountUp(score)
  return (
    <View>
      <Text variant="dataLarge" color="primary">
        {String(display)}
      </Text>
      <Text variant="labelMedium" color="onSurfaceVariant">
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACE.margin,
    paddingBottom: SPACE.sm,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlap: {
    marginLeft: -SPACE.md,
    // The ring is the surface itself — it's what separates the two discs where
    // they overlap, without introducing a colour that isn't already on screen.
    borderWidth: 2,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    // The meter is 4dp tall; the row it lives in is the tap target.
    minHeight: 48,
  },
  meterWrap: {
    flex: 1,
  },
  detailBlock: {
    gap: SPACE.md,
  },
  detailLine: {
    gap: SPACE.xs,
  },
  lockWrap: {
    minHeight: 360,
  },
  lockPreviewRows: {
    gap: SPACE.lg,
    paddingTop: SPACE.sm,
  },
  previewRow: {
    gap: SPACE.sm,
  },
  gateNote: {
    textAlign: 'center',
    marginTop: SPACE.sm,
  },
})
