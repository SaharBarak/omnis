import { useLocalSearchParams, useRouter } from 'expo-router'
import { CaretLeftIcon } from 'phosphor-react-native'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'

import { EmptyState } from '@/components/ui/empty-state'
import { Eyebrow, Panel, StatNumber } from '@/components/ui/primitives'
import { usePeople } from '@/lib/people/hooks'
import { COLORS, FLAVORS, SPACE, TYPE } from '@/theme/tokens'

/**
 * S8 person detail — M1c builds the six-system pager. This stub keeps the
 * navigation contract alive: name + dreamspell identity from the cached
 * people list, computed on-device.
 */
export default function PersonScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { people, isPending } = usePeople()

  const person = people.find((candidate) => candidate.id === id)

  const dreamspell = useMemo(() => {
    if (person === undefined) return null
    try {
      const kin = dateToKin(person.birth_date)
      const seal = getSeal(kinToSeal(kin))
      const tone = getTone(kinToTone(kin))
      return {
        kin: Number(kin),
        line: `${seal.color} ${tone.name} ${seal.english}`.toUpperCase(),
      }
    } catch {
      return null
    }
  }, [person])

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/people')
  }

  if (person === undefined) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + SPACE.gutter }]}>
        <EmptyState
          title={isPending ? 'Finding them…' : "They aren't on your map."}
          body={isPending ? undefined : 'This person may have been removed.'}
          actionLabel="Back to your people"
          onAction={goBack}
        />
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + SPACE.gutter }]}>
      <Pressable
        onPress={goBack}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <CaretLeftIcon size={20} color={COLORS.text70} />
      </Pressable>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {person.name.trim().slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={TYPE.zone}>{person.name}</Text>
        {dreamspell !== null && (
          <Eyebrow color={FLAVORS.dreamspell.accentSoft}>{dreamspell.line}</Eyebrow>
        )}
      </View>

      {dreamspell !== null && (
        <Panel feature style={styles.kinPanel}>
          <Eyebrow color={FLAVORS.dreamspell.accentSoft}>DREAMSPELL</Eyebrow>
          <StatNumber value={`KIN ${dreamspell.kin}`} label={dreamspell.line} />
          <Text style={styles.note}>
            The full six-system reading assembles here with the next milestone.
          </Text>
        </Panel>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: SPACE.gutter,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  header: {
    marginTop: SPACE.cardPad,
    gap: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    ...TYPE.section,
    color: COLORS.text70,
  },
  kinPanel: {
    marginTop: SPACE.section,
    gap: 12,
  },
  note: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
})
