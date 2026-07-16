import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg'

import { CHANNELS } from '@pleiad/engine/data/human-design-channels'
import type { Bodygraph, CenterId, Channel } from '@pleiad/engine/types/human-design'
import { CENTER_LABELS } from '@pleiad/engine/types/human-design'

import { Text } from '@/components/m3'
import {
  CENTER_COLORS,
  CENTER_POSITIONS,
  CHANNEL_PATHS,
  GATE_LABELS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  getCenterPath,
  pointsToPath,
  splitPolyline,
} from '@/components/person/bodygraph-layout'
import { FONTS, SPACE, alpha, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'

/**
 * Mobile bodygraph — 1:1 port of the web chart
 * (src/components/human-design/BodygraphChart.tsx) on react-native-svg.
 * Geometry comes verbatim from bodygraph-layout.ts. The one interaction
 * difference: web hover tooltips become TAP-to-reveal — tapping a center or
 * an activated channel selects it and its reading renders as rows under the
 * chart (scaffold grammar, never a floating box); tapping the same element
 * again dismisses.
 */

const FLAVOR = FLAVORS.humanDesign

/**
 * Gate/channel activation colors — domain colour, and these MIRROR the web
 * chart's literals (BodygraphChart.tsx): design (unconscious) is red,
 * personality (conscious) is light, both is gold. Gold solid replaces candy
 * stripes by design. Keep in sync with the web module.
 */
const GATE_ACTIVATION_COLORS = {
  design: '#D44C3C',
  personality: '#E8E8E8',
  both: '#F5C542',
} as const

type GateActivation = 'design' | 'personality' | 'both' | 'none'

function gateActivation(
  gate: number,
  personalityGates: ReadonlySet<number>,
  designGates: ReadonlySet<number>
): GateActivation {
  const p = personalityGates.has(gate)
  const d = designGates.has(gate)
  if (p && d) return 'both'
  if (p) return 'personality'
  if (d) return 'design'
  return 'none'
}

function halfStroke(activation: GateActivation): string | null {
  return activation === 'none' ? null : GATE_ACTIVATION_COLORS[activation]
}

// ---------------------------------------------------------------------------
// Tap-to-reveal selection — replaces the web hover tooltip
// ---------------------------------------------------------------------------

type Selection =
  | { kind: 'center'; id: CenterId }
  | { kind: 'channel'; id: string }

function sameSelection(a: Selection, b: Selection): boolean {
  return a.kind === b.kind && a.id === b.id
}

interface SelectionInfo {
  title: string
  lines: string[]
}

function describeGate(gate: number, activation: GateActivation): string {
  switch (activation) {
    case 'both': return `${gate}: both`
    case 'personality': return `${gate}: personality`
    case 'design': return `${gate}: design`
    case 'none': return `${gate}: open`
  }
}

function centerInfo(bodygraph: Bodygraph, centerId: CenterId): SelectionInfo {
  const state = bodygraph.centers[centerId]
  return {
    title: CENTER_LABELS[centerId],
    lines: [
      state.defined ? '● Defined' : '○ Undefined',
      `Gates: ${state.activeGates.length > 0 ? state.activeGates.join(', ') : 'none'}`,
    ],
  }
}

function channelInfo(
  channel: Channel,
  isDefined: boolean,
  personalityGates: ReadonlySet<number>,
  designGates: ReadonlySet<number>
): SelectionInfo {
  const [g0, g1] = channel.gates
  const a0 = gateActivation(g0, personalityGates, designGates)
  const a1 = gateActivation(g1, personalityGates, designGates)
  return {
    title: `${channel.name} (${channel.id})`,
    lines: [
      isDefined ? '● Defined channel' : '◐ Hanging gate',
      `${describeGate(g0, a0)} · ${describeGate(g1, a1)}`,
      `Circuit: ${channel.circuitry}`,
    ],
  }
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function BodygraphChart({ bodygraph }: { bodygraph: Bodygraph }) {
  const theme = useTheme()
  const [selection, setSelection] = useState<Selection | null>(null)

  const definedChannelIds = useMemo(
    () => new Set(bodygraph.channels.map(c => c.id)),
    [bodygraph]
  )

  const personalityGates = useMemo(
    () => new Set(bodygraph.activations.personality.map(a => a.gate)),
    [bodygraph]
  )

  const designGates = useMemo(
    () => new Set(bodygraph.activations.design.map(a => a.gate)),
    [bodygraph]
  )

  const toggle = (next: Selection) =>
    setSelection(prev => (prev !== null && sameSelection(prev, next) ? null : next))

  const info: SelectionInfo | null =
    selection === null
      ? null
      : selection.kind === 'center'
        ? centerInfo(bodygraph, selection.id)
        : (() => {
            const channel = CHANNELS.find(c => c.id === selection.id)
            if (!channel) return null
            return channelInfo(
              channel,
              definedChannelIds.has(channel.id),
              personalityGates,
              designGates
            )
          })()

  // The unlit parts of the chart are UI, not content, so they come from the
  // theme: the lane track, the open centers, and the open gate numbers.
  const laneColor = theme.colors.outlineVariant
  const openCenterFill = alpha(theme.colors.onSurface, 0.04)
  const openCenterStroke = theme.colors.outline
  const gateChipFill = theme.surfaceAt(2)

  return (
    <View>
      {/* Aspect-ratio frame — the 400:640 viewBox fills the section width. */}
      <View style={styles.chartFrame}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
          {/* === CHANNELS === */}
          {/* Every channel gets its own lane; each half colors by its gate's
              activation, so hanging gates read as half-filled channels. */}
          {CHANNELS.map((channel) => {
            const points = CHANNEL_PATHS[channel.id]
            if (!points) return null
            const [g0, g1] = channel.gates
            const a0 = gateActivation(g0, personalityGates, designGates)
            const a1 = gateActivation(g1, personalityGates, designGates)
            const [half0, half1] = splitPolyline(points)
            const stroke0 = halfStroke(a0)
            const stroke1 = halfStroke(a1)
            const isDefined = definedChannelIds.has(channel.id)
            const hasActivation = stroke0 !== null || stroke1 !== null
            const isSelected =
              selection !== null &&
              selection.kind === 'channel' &&
              selection.id === channel.id

            return (
              <G key={channel.id}>
                {/* Base lane — legible full-length track, so a colored half
                    reads as "half of a channel", never as a floating dash. */}
                <Path
                  d={pointsToPath(points)}
                  fill="none"
                  stroke={laneColor}
                  strokeOpacity={isSelected ? 1 : 0.7}
                  strokeWidth={2.5}
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                />
                {/* Butt caps: round caps at the shared midpoint painted a blob
                    over the seam where two half-colors meet. */}
                {stroke0 && (
                  <Path
                    d={pointsToPath(half0)}
                    fill="none"
                    stroke={stroke0}
                    strokeWidth={3.5}
                    strokeLinecap="butt"
                    strokeLinejoin="round"
                    opacity={isDefined ? 1 : 0.9}
                  />
                )}
                {stroke1 && (
                  <Path
                    d={pointsToPath(half1)}
                    fill="none"
                    stroke={stroke1}
                    strokeWidth={3.5}
                    strokeLinecap="butt"
                    strokeLinejoin="round"
                    opacity={isDefined ? 1 : 0.9}
                  />
                )}
                {/* Invisible wide hit lane — thumbs need more than 3.5 units.
                    Only activated channels are tappable, matching the web's
                    hover affordance. */}
                {hasActivation && (
                  <Path
                    d={pointsToPath(points)}
                    fill="none"
                    stroke={alpha(theme.colors.onSurface, 0.01)}
                    strokeWidth={16}
                    strokeLinecap="butt"
                    strokeLinejoin="round"
                    onPress={() => toggle({ kind: 'channel', id: channel.id })}
                  />
                )}
              </G>
            )
          })}

          {/* === CENTERS === */}
          {(Object.keys(CENTER_POSITIONS) as CenterId[]).map((centerId) => {
            const pos = CENTER_POSITIONS[centerId]
            const isDefined = bodygraph.centers[centerId].defined
            const path = getCenterPath(pos)
            const color = CENTER_COLORS[centerId]
            const isSelected =
              selection !== null &&
              selection.kind === 'center' &&
              selection.id === centerId

            // Center shape — names live in the tap panel, matching the
            // canonical unlabeled bodygraph so gate numbers stay legible.
            // Defined centers are tinted surfaces with a crisp colored edge,
            // not solid paint — color lives in the channels and gate chips.
            return (
              <Path
                key={centerId}
                d={path}
                fill={isDefined ? `${color}2E` : openCenterFill}
                stroke={isDefined ? color : openCenterStroke}
                strokeWidth={(isDefined ? 1.6 : 1.2) + (isSelected ? 0.8 : 0)}
                strokeLinejoin="round"
                onPress={() => toggle({ kind: 'center', id: centerId })}
              />
            )
          })}

          {/* === GATE NUMBERS === */}
          {/* All 64 gates at their channel mouths. Activated gates get a chip —
              an opaque disc with a colored ring — so the numbers that matter are
              readable at a glance; open gates stay as faint marks. No press
              handlers, so taps pass through to the center below. */}
          {Object.entries(GATE_LABELS).map(([gateStr, [x, y]]) => {
            const gate = Number(gateStr)
            const activation = gateActivation(gate, personalityGates, designGates)
            if (activation === 'none') {
              return (
                <SvgText
                  key={`gate-${gate}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fontSize={6.5}
                  fontFamily={FONTS.data}
                  fill={theme.colors.onSurfaceVariant}
                  opacity={0.55}
                >
                  {gate}
                </SvgText>
              )
            }

            const color = GATE_ACTIVATION_COLORS[activation]

            // The chip REPLACES the gate number at the identical slot — one
            // placement rule for every gate, activated or open. The medium
            // weight stands in for the web's bold (RN won't synthesize bold
            // for a 400-weight custom font).
            return (
              <G key={`gate-${gate}`}>
                <Circle
                  cx={x}
                  cy={y}
                  r={6}
                  fill={gateChipFill}
                  stroke={color}
                  strokeWidth={1.3}
                />
                <SvgText
                  x={x}
                  y={y}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fontSize={7}
                  fontFamily={FONTS.dataMedium}
                  fill={color}
                >
                  {gate}
                </SvgText>
              </G>
            )
          })}
        </Svg>
      </View>

      {/* Legend — RN text so its type scales with the app, not the viewBox. */}
      <View style={styles.legendRow}>
        {(
          [
            [GATE_ACTIVATION_COLORS.personality, 'Personality'],
            [GATE_ACTIVATION_COLORS.design, 'Design'],
            [GATE_ACTIVATION_COLORS.both, 'Both'],
          ] as const
        ).map(([swatch, label]) => (
          <View key={label} style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                { borderColor: swatch, backgroundColor: theme.surfaceAt(1) },
              ]}
            />
            <Text variant="labelSmall" color="onSurfaceVariant">
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Tap-to-reveal reading — the web tooltip, grounded in the scaffold
          grammar: flavor hairline, label title, quiet detail lines. */}
      {info !== null ? (
        <View style={styles.infoBlock}>
          <View style={[styles.infoHairline, { backgroundColor: FLAVOR.accent }]} />
          <Text variant="labelLarge" color={FLAVOR.accentSoft}>
            {info.title}
          </Text>
          {info.lines.map((line) => (
            <Text key={line} variant="bodyMedium" color="onSurfaceVariant">
              {line}
            </Text>
          ))}
        </View>
      ) : (
        <Text variant="labelMedium" color="onSurfaceVariant" style={styles.infoHint}>
          Tap a center or channel
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  chartFrame: {
    width: '100%',
    aspectRatio: VIEW_WIDTH / VIEW_HEIGHT,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE.xl,
    marginTop: SPACE.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  infoBlock: {
    marginTop: SPACE.lg,
    gap: SPACE.xs,
  },
  infoHairline: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.35,
    marginBottom: SPACE.xs,
  },
  infoHint: {
    textAlign: 'center',
    marginTop: SPACE.lg,
  },
})
