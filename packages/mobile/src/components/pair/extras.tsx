import type { PersonWithTags } from '@pleiad/api-client'
import { getMoonReading, type MoonReading } from '@pleiad/engine/calculations/moon'
import {
  numerologyCompatibility,
  lifePathNumber,
} from '@pleiad/engine/calculations/numerology'
import {
  comparePersonalities,
  type PersonalityProfile,
} from '@pleiad/engine/calculations/personality'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

import { Card, Text } from '@/components/m3'
import { DataRow, PageSection } from '@/components/person/scaffold'
import { SPACE, useTheme } from '@/theme/m3'
import { FLAVORS, type SystemFlavor } from '@/theme/tokens'

/**
 * The three readings of a bond that aren't one of the five weighted systems
 * (#75, #72): the moon each person was born under, their Life Path pair, and
 * whatever personality frameworks they both filled in.
 *
 * They sit apart from the scored rows on purpose — none of them feeds the
 * composite, and pretending otherwise would change what that number means.
 */

const PERSONALITY_FLAVOR: SystemFlavor = {
  name: 'Personality',
  accent: '#C9CDD4',
  accentSoft: '#E2E5E9',
}

const NUMEROLOGY_FLAVOR: SystemFlavor = {
  name: 'Numerology',
  accent: '#10B981',
  accentSoft: '#6EE7B7',
}

const MOON_SIZE = 56

/**
 * The moon disc for a Sun→Moon elongation angle (0 = new, 180 = full). Port
 * of src/components/moon/moon-glyph.tsx, geometry unchanged: the lit region
 * is a half-disc on the lit side closed by an elliptical terminator whose
 * x-radius follows cos(angle) — zero at the quarters, so the terminator is a
 * straight line there without the shape having to switch.
 */
function MoonGlyph({ angle }: { angle: number }) {
  const theme = useTheme()
  const r = 45
  const c = 50
  const rx = r * Math.abs(Math.cos((angle * Math.PI) / 180))
  const normalized = ((angle % 360) + 360) % 360
  const waxing = normalized < 180
  const gibbous = normalized > 90 && normalized < 270

  const outerSweep = waxing ? 1 : 0
  const terminatorSweep = waxing ? (gibbous ? 1 : 0) : gibbous ? 0 : 1

  return (
    <Svg
      width={MOON_SIZE}
      height={MOON_SIZE}
      viewBox="0 0 100 100"
      accessibilityLabel={`Moon at ${Math.round(angle)} degrees`}
    >
      <Circle
        cx={c}
        cy={c}
        r={r}
        fill={theme.colors.surfaceContainerHighest}
        stroke={theme.colors.outlineVariant}
        strokeWidth={2}
      />
      <Path
        d={`M ${c} ${c - r} A ${r} ${r} 0 0 ${outerSweep} ${c} ${c + r} A ${rx} ${r} 0 0 ${terminatorSweep} ${c} ${c - r} Z`}
        fill={theme.colors.onSurface}
        opacity={0.92}
      />
    </Svg>
  )
}

function BornUnder({
  person1,
  person2,
  moon1,
  moon2,
  index,
}: {
  person1: PersonWithTags
  person2: PersonWithTags
  moon1: MoonReading
  moon2: MoonReading
  index: number
}) {
  const same = moon1.phaseIndex === moon2.phaseIndex
  const opposite = Math.abs(moon1.phaseIndex - moon2.phaseIndex) === 4

  return (
    <PageSection index={index} flavor={FLAVORS.integration} eyebrow="Born under">
      <View style={styles.moons}>
        {[
          { person: person1, moon: moon1 },
          { person: person2, moon: moon2 },
        ].map(({ person, moon }) => (
          <View key={person.id} style={styles.moonRow}>
            <MoonGlyph angle={moon.angle} />
            <View style={styles.moonText}>
              <Text variant="titleSmall" color="onSurface" numberOfLines={1}>
                {person.name}
              </Text>
              <Text variant="bodyMedium" color="onSurfaceVariant">
                {moon.phase}
              </Text>
              <Text variant="dataMedium" color="onSurfaceVariant">
                {Math.round(moon.illumination * 100)}% lit
              </Text>
            </View>
          </View>
        ))}
      </View>
      {(same || opposite) && (
        <Text variant="bodyMedium" color="onSurfaceVariant">
          {same
            ? 'Born under the same lunar phase — the month moves through both on one rhythm.'
            : 'Born under opposite lunar phases — each stands where the other’s cycle turns.'}
        </Text>
      )}
    </PageSection>
  )
}

export function PairExtras({
  person1,
  person2,
  index,
  /** Computed readings stay behind the same gate as the scored systems. */
  unlocked,
}: {
  person1: PersonWithTags
  person2: PersonWithTags
  index: number
  unlocked: boolean
}) {
  const moons = useMemo(() => {
    try {
      return {
        m1: getMoonReading(person1.birth_date),
        m2: getMoonReading(person2.birth_date),
      }
    } catch {
      return null
    }
  }, [person1.birth_date, person2.birth_date])

  const numerology = useMemo(() => {
    try {
      const a = lifePathNumber(person1.birth_date)
      const b = lifePathNumber(person2.birth_date)
      return { a, b, verdict: numerologyCompatibility(a, b) }
    } catch {
      return null
    }
  }, [person1.birth_date, person2.birth_date])

  // User-entered on both sides or there is nothing to compare.
  const personalityLines = useMemo(() => {
    if (person1.personality == null || person2.personality == null) return []
    return comparePersonalities(
      person1.personality as PersonalityProfile,
      person2.personality as PersonalityProfile
    )
  }, [person1.personality, person2.personality])

  let next = index

  return (
    <>
      {unlocked && moons !== null && (
        <BornUnder
          person1={person1}
          person2={person2}
          moon1={moons.m1}
          moon2={moons.m2}
          index={next++}
        />
      )}

      {unlocked && numerology !== null && (
        <PageSection index={next++} flavor={NUMEROLOGY_FLAVOR} eyebrow="Life Path">
          <View style={styles.lifePath}>
            <Text variant="displaySmall" color={NUMEROLOGY_FLAVOR.accentSoft}>
              {numerology.a} × {numerology.b}
            </Text>
            <Text variant="labelLarge" color="onSurfaceVariant">
              {numerology.verdict.harmony}
            </Text>
          </View>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {numerology.verdict.note}
          </Text>
        </PageSection>
      )}

      {/* Never gated: this is what the reader typed about these two people. */}
      {personalityLines.length > 0 && (
        <PageSection
          index={next++}
          flavor={PERSONALITY_FLAVOR}
          eyebrow="Personality"
        >
          <View style={styles.personality}>
            {personalityLines.map((line) => (
              <Card key={line.framework} variant="outlined">
                <DataRow
                  label={line.framework}
                  value={`${line.a} · ${line.b}`}
                  last
                />
                <Text
                  variant="bodyMedium"
                  color="onSurfaceVariant"
                  style={styles.personalityNote}
                >
                  {line.note}
                </Text>
              </Card>
            ))}
          </View>
        </PageSection>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  moons: {
    gap: SPACE.lg,
    paddingVertical: SPACE.sm,
  },
  moonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
  },
  moonText: {
    flex: 1,
    gap: SPACE.xs,
  },
  lifePath: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  personality: {
    gap: SPACE.md,
    paddingTop: SPACE.sm,
  },
  personalityNote: {
    paddingTop: SPACE.sm,
  },
})
