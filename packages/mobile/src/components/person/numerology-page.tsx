import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import type { PersonWithTags } from '@pleiad/api-client'
import {
  NUMBER_MEANINGS,
  numerologyChart,
} from '@pleiad/engine/calculations/numerology'
import { Text } from '@/components/m3'
import { DataRow, PageSection, ReadingPage } from '@/components/person/scaffold'
import { SPACE } from '@/theme/m3'
import type { SystemFlavor } from '@/theme/tokens'

/**
 * Numerology (#72) — the Pythagorean chart, computed here from the person's
 * name and birth date (the math is a few additions; no reading-layer slice
 * needed). Name numbers go honest-null when the name has no Latin letters.
 */

const FLAVOR: SystemFlavor = {
  name: 'Numerology',
  accent: '#10B981',
  accentSoft: '#6EE7B7',
}

const ORDINALS = ['First', 'Second', 'Third', 'Fourth'] as const

function meaning(n: number | null): string {
  if (n === null) return 'Needs a name written in Latin letters'
  return NUMBER_MEANINGS[n] ?? ''
}

function show(n: number | null): string {
  return n === null ? '—' : String(n)
}

function ageNow(birthDate: string): number {
  const birth = new Date(`${birthDate}T12:00:00Z`)
  const now = new Date()
  let age = now.getUTCFullYear() - birth.getUTCFullYear()
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

export function NumerologyPage({ person }: { person: PersonWithTags }) {
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], [])
  const chart = useMemo(
    () => numerologyChart(person.birth_date, person.name, todayIso),
    [person.birth_date, person.name, todayIso]
  )
  const age = useMemo(() => ageNow(person.birth_date), [person.birth_date])

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="Life Path">
        <View style={styles.hero}>
          <Text variant="displaySmall" color="primary">
            {chart.lifePath}
          </Text>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {meaning(chart.lifePath)}
          </Text>
        </View>
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="Core numbers">
        <DataRow
          label="Expression / Destiny"
          value={show(chart.expression)}
          detail={meaning(chart.expression)}
          mono
        />
        <DataRow
          label="Soul Urge"
          value={show(chart.soulUrge)}
          detail={meaning(chart.soulUrge)}
          mono
        />
        <DataRow
          label="Personality"
          value={show(chart.personality)}
          detail={meaning(chart.personality)}
          mono
        />
        <DataRow
          label="Birthday"
          value={String(chart.birthday)}
          detail={meaning(chart.birthday)}
          mono
        />
        <DataRow
          label="Maturity"
          value={show(chart.maturity)}
          detail={meaning(chart.maturity)}
          mono
          last
        />
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="Cycles now">
        <DataRow
          label="Personal Year"
          value={String(chart.personalYear)}
          detail={meaning(chart.personalYear)}
          mono
        />
        <DataRow
          label="Personal Month"
          value={String(chart.personalMonth)}
          detail={meaning(chart.personalMonth)}
          mono
        />
        <DataRow
          label="Personal Day"
          value={String(chart.personalDay)}
          detail={meaning(chart.personalDay)}
          mono
          last
        />
      </PageSection>

      <PageSection index={3} flavor={FLAVOR} eyebrow="Pinnacles">
        {chart.pinnacles.map((p, i) => {
          const active = age >= p.fromAge && (p.toAge === null || age <= p.toAge)
          return (
            <DataRow
              key={`${i}-${p.number}`}
              label={`${ORDINALS[i]}${active ? ' · now' : ''}`}
              value={`${p.number} · ages ${p.fromAge}–${p.toAge ?? '∞'}`}
              detail={meaning(p.number)}
              mono
              last={i === chart.pinnacles.length - 1}
            />
          )
        })}
      </PageSection>

      <PageSection index={4} flavor={FLAVOR} eyebrow="Challenges">
        {chart.challenges.map((c, i) => (
          <DataRow
            key={`${i}-${c}`}
            label={ORDINALS[i]}
            value={String(c)}
            detail={meaning(c)}
            mono
            last={i === chart.challenges.length - 1}
          />
        ))}
      </PageSection>
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  hero: {
    gap: SPACE.xs,
  },
})
