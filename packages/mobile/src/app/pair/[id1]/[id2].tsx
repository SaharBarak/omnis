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
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BondSheet } from '@/components/pair/bond-sheet'
import { PaywallSheet } from '@/components/billing/paywall-sheet'
import {
  DataRow,
  LockedPage,
  MeterBar,
  PageSection,
  ReadingPage,
} from '@/components/person/scaffold'
import { EmptyState } from '@/components/ui/empty-state'
import { Button, Eyebrow } from '@/components/ui/primitives'
import { ToastHost } from '@/components/ui/toast'
import { useSubscription } from '@/lib/api'
import { useCountUp } from '@/lib/motion/use-count-up'
import { usePeople } from '@/lib/people/hooks'
import { useCreateRelationship } from '@/lib/relationships/hooks'
import { showToast } from '@/lib/toast'
import { COLORS, FLAVORS, SPACE, TYPE, type SystemFlavor } from '@/theme/tokens'

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
    label: 'DREAMSPELL',
    flavor: FLAVORS.dreamspell,
    missingNote: 'NEEDS BIRTH DATES',
  },
  {
    key: 'tzolkin',
    label: 'TZOLKIN',
    flavor: FLAVORS.tzolkin,
    missingNote: 'NEEDS BIRTH DATES',
  },
  {
    key: 'astrology',
    label: 'ASTROLOGY',
    flavor: FLAVORS.astrology,
    missingNote: 'NEEDS BIRTH DATA',
  },
  {
    key: 'humanDesign',
    label: 'HUMAN DESIGN',
    flavor: FLAVORS.humanDesign,
    missingNote: 'NEEDS BOTH BIRTH TIMES',
  },
  {
    key: 'gematria',
    label: 'KABBALAH',
    flavor: FLAVORS.gematria,
    missingNote: 'NEEDS BOTH HEBREW NAMES',
  },
]

const TOP_ASPECTS = 3

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}

function toCompatInput(person: PersonWithTags): PersonCompatInput {
  return {
    birthDate: person.birth_date,
    birthTime: person.birth_time,
    birthPlace: person.birth_place,
    hebrewName: person.hebrew_name,
    name: person.name,
  }
}

/** Micro line inside an expanded system detail. */
function DetailLine({ eyebrow, body }: { eyebrow?: string; body: string }) {
  return (
    <View style={styles.detailLine}>
      {eyebrow !== undefined && <Text style={styles.detailEyebrow}>{eyebrow}</Text>}
      <Text style={styles.detailBody}>{body}</Text>
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
  const [expanded, setExpanded] = useState(false)
  const display = useCountUp(score)
  const Caret = expanded ? CaretUpIcon : CaretDownIcon

  return (
    <PageSection index={index} flavor={flavor} eyebrow={label}>
      <Pressable
        onPress={() => setExpanded((value) => !value)}
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
        <Caret size={14} color={COLORS.text50} />
      </Pressable>
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
      <Text style={styles.missingNote}>{note}</Text>
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
      <Eyebrow color={flavor.accentSoft}>{label}</Eyebrow>
      {available ? (
        <MeterBar
          label={`${Math.round(weight * 100)}%`}
          value={score}
          max={100}
          flavor={flavor}
        />
      ) : (
        <Text style={styles.missingNote}>{missingNote}</Text>
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
            label="KINS"
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
                eyebrow={getHarmonyLabel(connection.harmony).english.toUpperCase()}
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
            label="SIGN · TONE"
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
              eyebrow={(connection.aspect ?? 'aspect').toUpperCase()}
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
              label="TYPES"
              value={`${detail.type1} × ${detail.type2}`}
              last={false}
            />
          )}
          {detail.typeDynamic !== undefined && (
            <DetailLine eyebrow="TYPE DYNAMIC" body={detail.typeDynamic.english} />
          )}
          {electromagnetic.length === 0 ? (
            <DetailLine body="No electromagnetic channels — this bond runs on companionship, not spark." />
          ) : (
            electromagnetic.map((connection) => (
              <DetailLine
                key={connection.channelId}
                eyebrow={`CHANNEL ${connection.gates[0]}–${connection.gates[1]}`}
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
              label="VALUES"
              value={`${comparison.value1} × ${comparison.value2}`}
              mono
              last={false}
            />
            <DataRow
              label="SHARED ROOT"
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
  const insets = useSafeAreaInsets()
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
      <View style={[styles.screen, { paddingTop: insets.top + SPACE.gutter }]}>
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

      <View style={styles.header}>
        <View style={styles.avatars}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(person1.name)}</Text>
          </View>
          <View style={[styles.avatar, styles.avatarOverlap]}>
            <Text style={styles.avatarText}>{initialsOf(person2.name)}</Text>
          </View>
        </View>
        <Text style={TYPE.zone} numberOfLines={2}>
          {person1.name} × {person2.name}
        </Text>
      </View>

      <ReadingPage>
        <PageSection index={0} flavor={FLAVORS.integration} eyebrow="RESONANCE">
          <CompositeScore
            score={compositeScore}
            label={unlocked ? 'COMPOSITE' : 'DREAMSPELL ONLY'}
          />
          {unlocked && <Text style={styles.summary}>{fusion.summary.english}</Text>}
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
                pill="COMPLETE UNLOCKS THIS BOND"
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
          <Button disabled={!unlocked} onPress={() => setBondOpen(true)}>
            Keep this bond
          </Button>
          {!unlocked && <Text style={styles.gateNote}>BONDS OPEN WITH COMPLETE</Text>}
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

      <ToastHost />
    </View>
  )
}

/** The big number — counts up once, tabular mono, brandBright. */
function CompositeScore({ score, label }: { score: number; label: string }) {
  const display = useCountUp(score)
  return (
    <View>
      <Text style={styles.compositeValue}>{display}</Text>
      <Text style={TYPE.statLabel}>{label}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: SPACE.gutter,
    paddingTop: SPACE.unit * 2,
    paddingBottom: SPACE.cardPad,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.brandSoft,
  },
  avatarOverlap: {
    marginLeft: -14,
    borderColor: COLORS.border,
  },
  avatarText: {
    ...TYPE.eyebrow,
    color: COLORS.text70,
    letterSpacing: 1,
  },
  compositeValue: {
    ...TYPE.stat,
    fontSize: 56,
    lineHeight: 62,
  },
  summary: {
    ...TYPE.bodySm,
    color: COLORS.text70,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  meterWrap: {
    flex: 1,
  },
  detailBlock: {
    gap: 12,
  },
  detailLine: {
    gap: 3,
  },
  detailEyebrow: {
    ...TYPE.statLabel,
  },
  detailBody: {
    ...TYPE.bodySm,
    color: COLORS.text70,
  },
  missingNote: {
    ...TYPE.statLabel,
    color: COLORS.text35,
  },
  lockWrap: {
    minHeight: 360,
  },
  lockPreviewRows: {
    gap: SPACE.cardPad,
    paddingTop: SPACE.unit * 2,
  },
  previewRow: {
    gap: 8,
  },
  gateNote: {
    ...TYPE.statLabel,
    textAlign: 'center',
    marginTop: 10,
  },
})
