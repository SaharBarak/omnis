import { LETTER_BY_ID } from '@pleiad/engine/data/hebrew-letters'
import {
  SEFIRAH_BY_ID,
  SEFIROT,
  TREE_PATHS,
  type Pillar,
  type Sefirah,
  type TreePath,
} from '@pleiad/engine/data/tree-of-life'
import { useRouter } from 'expo-router'
import { CaretLeftIcon } from 'phosphor-react-native'
import { useState } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg'

import { Card, Chip, IconButton, Text, TopAppBar } from '@/components/m3'
import { DataRow, PageSection, ReadingPage } from '@/components/person/scaffold'
import { SPACE, alpha, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'

/**
 * Tree of Life (#76) — the ten sefirot and twenty-two lettered paths as one
 * interactive figure: tap a circle or a line and the panel below reads it.
 * The letters are the same gematria data the app reads names with, so every
 * path carries its letter's value onto the tree.
 *
 * Layout coordinates come from the shared data (the web figure uses the same
 * ones), so the two trees are the same tree.
 */

const FLAVOR = FLAVORS.gematria

const VIEW_WIDTH = 100
const VIEW_HEIGHT = 132
const NODE_RADIUS = 6.4
/** The invisible stroke that makes a 0.6-wide line tappable by a finger. */
const PATH_HIT_WIDTH = 5

const PILLAR_LABELS: Record<Pillar, string> = {
  severity: 'Pillar of Severity',
  equilibrium: 'Middle Pillar',
  mercy: 'Pillar of Mercy',
}

type Selection =
  | { kind: 'sefirah'; sefirah: Sefirah }
  | { kind: 'path'; path: TreePath }
  | null

function TreeFigure({
  selection,
  onSelect,
}: {
  selection: Selection
  onSelect: (next: Selection) => void
}) {
  const theme = useTheme()
  const { width } = useWindowDimensions()

  const figureWidth = Math.min(width - SPACE.margin * 4, 420)
  const figureHeight = (figureWidth * VIEW_HEIGHT) / VIEW_WIDTH

  const selectedSefirah = selection?.kind === 'sefirah' ? selection.sefirah.id : null
  const selectedPath = selection?.kind === 'path' ? selection.path.number : null

  const idle = alpha(theme.colors.onSurface, 0.18)
  const idleLetter = alpha(theme.colors.onSurface, 0.45)

  return (
    <Svg
      width={figureWidth}
      height={figureHeight}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      accessibilityLabel="Tree of Life diagram"
    >
      {TREE_PATHS.map((path) => {
        const from = SEFIRAH_BY_ID[path.from]
        const to = SEFIRAH_BY_ID[path.to]
        const letter = LETTER_BY_ID[path.letterId]
        if (from === undefined || to === undefined || letter === undefined) return null
        const active = selectedPath === path.number

        return (
          <G key={path.number}>
            <Line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={active ? FLAVOR.accent : idle}
              strokeWidth={active ? 1.1 : 0.6}
            />
            {/* Drawn last-but-one and transparent: the finger target, not the line. */}
            <Line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="transparent"
              strokeWidth={PATH_HIT_WIDTH}
              onPress={() => onSelect({ kind: 'path', path })}
              accessibilityLabel={`Path ${path.number}, letter ${letter.name}`}
            />
            <SvgText
              x={(from.x + to.x) / 2}
              y={(from.y + to.y) / 2 + 1.1}
              textAnchor="middle"
              fontSize={3.2}
              fill={active ? FLAVOR.accent : idleLetter}
            >
              {letter.letter}
            </SvgText>
          </G>
        )
      })}

      {SEFIROT.map((sefirah) => {
        const active = selectedSefirah === sefirah.id
        return (
          <G
            key={sefirah.id}
            onPress={() => onSelect({ kind: 'sefirah', sefirah })}
            accessibilityLabel={`${sefirah.name} — ${sefirah.translation}`}
          >
            <Circle
              cx={sefirah.x}
              cy={sefirah.y}
              r={NODE_RADIUS}
              fill={
                active ? alpha(FLAVOR.accent, 0.25) : theme.colors.surfaceContainerHighest
              }
              stroke={active ? FLAVOR.accent : alpha(theme.colors.onSurface, 0.35)}
              strokeWidth={active ? 0.9 : 0.5}
            />
            <SvgText
              x={sefirah.x}
              y={sefirah.y}
              textAnchor="middle"
              fontSize={2.6}
              fill={alpha(theme.colors.onSurface, 0.85)}
            >
              {sefirah.hebrew}
            </SvgText>
            <SvgText
              x={sefirah.x}
              y={sefirah.y + 3.4}
              textAnchor="middle"
              fontSize={1.9}
              fill={alpha(theme.colors.onSurface, 0.5)}
            >
              {sefirah.name}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}

function SelectionPanel({ selection }: { selection: Selection }) {
  if (selection === null) {
    return (
      <Text variant="bodyMedium" color="onSurfaceVariant">
        Tap a sefirah or a path — every circle is a station of emanation, every
        line one of the twenty-two letters.
      </Text>
    )
  }

  if (selection.kind === 'sefirah') {
    const { sefirah } = selection
    return (
      <Card variant="outlined">
        <View style={styles.panelHead}>
          <Text variant="headlineSmall" color="onSurface">
            {sefirah.hebrew} {sefirah.name}
          </Text>
          <Chip label={String(sefirah.number)} variant="suggestion" />
        </View>
        <DataRow label="Translation" value={sefirah.translation} />
        <DataRow label="Pillar" value={PILLAR_LABELS[sefirah.pillar]} />
        <DataRow label="Meaning" value={sefirah.meaning} last />
      </Card>
    )
  }

  const { path } = selection
  const letter = LETTER_BY_ID[path.letterId]
  const from = SEFIRAH_BY_ID[path.from]
  const to = SEFIRAH_BY_ID[path.to]
  if (letter === undefined || from === undefined || to === undefined) return null

  return (
    <Card variant="outlined">
      <View style={styles.panelHead}>
        <Text variant="headlineSmall" color="onSurface">
          {letter.letter} {letter.name}
        </Text>
        <Chip label={`path ${path.number}`} variant="suggestion" />
      </View>
      <DataRow label="Connects" value={`${from.name} ↔ ${to.name}`} />
      <DataRow label="Gematria" value={String(letter.standardValue)} mono />
      <DataRow label="Keywords" value={letter.keywords.join(' · ')} last />
    </Card>
  )
}

export default function TreeOfLifeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [selection, setSelection] = useState<Selection>(null)

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/library')
  }

  const pillars = (['mercy', 'equilibrium', 'severity'] as const).map((pillar) => ({
    pillar,
    sefirot: SEFIROT.filter((sefirah) => sefirah.pillar === pillar),
  }))

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="Tree of Life"
        navigationIcon={
          <IconButton
            icon={(color) => <CaretLeftIcon size={24} color={color} />}
            onPress={goBack}
            accessibilityLabel="Back"
          />
        }
      />

      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="The tree">
          <View style={styles.figure}>
            <TreeFigure selection={selection} onSelect={setSelection} />
          </View>
          <SelectionPanel selection={selection} />
          <Text variant="bodySmall" color="onSurfaceVariant" style={styles.note}>
            Path-letter placement follows the Kircher tree, the most widely
            illustrated arrangement; the GRA and Ari trees draw several paths
            differently. The sefirot and pillars are common to all.
          </Text>
        </PageSection>

        <PageSection index={1} flavor={FLAVOR} eyebrow="Emanation">
          <Text variant="bodyLarge" color="onSurfaceVariant">
            In Kabbalah, creation is not an event but a flow: the infinite (Ein
            Sof) pours through ten vessels — the sefirot — each refracting the
            light into a more particular register, from the first stirring of
            will (Keter) down to the manifest world (Malkhut).
          </Text>
          <Text variant="bodyLarge" color="onSurfaceVariant">
            The tree also reads as a map of the person: the right pillar gives,
            the left restrains, and the middle reconciles. A life leaning too
            far into kindness dissolves; too far into severity, it hardens. The
            work is the middle.
          </Text>
          <Text variant="bodyLarge" color="onSurfaceVariant">
            Between Binah and Chesed the tradition places Da&rsquo;at —
            knowledge — not a sefirah but the invisible point where
            understanding becomes lived. It is drawn as an absence on purpose.
          </Text>
        </PageSection>

        {pillars.map(({ pillar, sefirot }, index) => (
          <PageSection
            key={pillar}
            index={2 + index}
            flavor={FLAVOR}
            eyebrow={PILLAR_LABELS[pillar]}
          >
            {sefirot.map((sefirah, i) => (
              <DataRow
                key={sefirah.id}
                label={`${sefirah.number} · ${sefirah.name}`}
                value={sefirah.translation}
                last={i === sefirot.length - 1}
              />
            ))}
          </PageSection>
        ))}

        <PageSection index={5} flavor={FLAVOR} eyebrow="The letters on the tree">
          {TREE_PATHS.map((path, index) => {
            const letter = LETTER_BY_ID[path.letterId]
            const from = SEFIRAH_BY_ID[path.from]
            const to = SEFIRAH_BY_ID[path.to]
            if (letter === undefined || from === undefined || to === undefined) {
              return null
            }
            return (
              <DataRow
                key={path.number}
                label={`${path.number} · ${letter.letter} ${letter.name}`}
                value={`${from.name} ↔ ${to.name}`}
                detail={letter.keywords.join(' · ')}
                last={index === TREE_PATHS.length - 1}
              />
            )
          })}
          <Text variant="bodySmall" color="onSurfaceVariant" style={styles.note}>
            The same letters Pleiad reads names with — each path carries its
            gematria value into the tree.
          </Text>
        </PageSection>

        <View style={{ height: insets.bottom + SPACE.xl }} />
      </ReadingPage>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  figure: {
    alignItems: 'center',
    paddingVertical: SPACE.md,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
    paddingBottom: SPACE.sm,
  },
  note: {
    paddingTop: SPACE.sm,
  },
})
