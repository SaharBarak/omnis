import type { PersonWithTags } from '@pleiad/api-client'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import * as Haptics from 'expo-haptics'
import { CheckIcon, XIcon } from 'phosphor-react-native'
import { useEffect, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Divider, Eyebrow } from '@/components/ui/primitives'
import { TextField } from '@/components/ui/text-field'
import { useCreateGroup, useSetGroupMembers, useUpdateGroup } from '@/lib/groups/hooks'
import { usePeople } from '@/lib/people/hooks'
import { COLORS, FLAVORS, RADII, SPACE, SPRING, DURATION, TYPE } from '@/theme/tokens'

/**
 * S11 circle sheet — create or edit a circle: name, description, and a
 * multi-select member picker wearing the pair person-picker's visual
 * language (avatar, name, kin line) plus a checkmark ring.
 */

export interface CircleSheetInitial {
  id: string
  name: string
  description: string | null
  memberIds: string[]
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}

function kinLine(birthDate: string): string {
  try {
    const kin = dateToKin(birthDate)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return `KIN ${kin} · ${tone.name} ${seal.english}`.toUpperCase()
  } catch {
    return birthDate
  }
}

function MemberRow({
  person,
  selected,
  onToggle,
}: {
  person: PersonWithTags
  selected: boolean
  onToggle: () => void
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={styles.memberRow}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={person.name}
    >
      <View style={[styles.avatar, selected && styles.avatarSelected]}>
        <Text style={styles.avatarText}>{initialsOf(person.name)}</Text>
      </View>
      <View style={styles.memberBody}>
        <Text style={TYPE.card} numberOfLines={1}>
          {person.name}
        </Text>
        <Text style={styles.memberLine} numberOfLines={1}>
          {kinLine(person.birth_date)}
        </Text>
      </View>
      <View style={[styles.checkRing, selected && styles.checkRingActive]}>
        {selected && <CheckIcon size={14} color={COLORS.text90} weight="bold" />}
      </View>
    </Pressable>
  )
}

export function CircleSheet({
  visible,
  onClose,
  initial,
}: {
  visible: boolean
  onClose: () => void
  /** When set the sheet renames + replaces members instead of creating. */
  initial?: CircleSheetInitial
}) {
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()
  const editing = initial !== undefined
  const { people } = usePeople()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [memberIds, setMemberIds] = useState<ReadonlySet<string>>(new Set())
  const [nameError, setNameError] = useState<string | undefined>(undefined)

  // Re-seed the form each time the sheet opens (create: blank, edit: group).
  useEffect(() => {
    if (!visible) return
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setMemberIds(new Set(initial?.memberIds ?? []))
    setNameError(undefined)
  }, [visible, initial])

  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()
  const setMembers = useSetGroupMembers()

  const toggleMember = (personId: string) => {
    setMemberIds((previous) => {
      const next = new Set(previous)
      if (next.has(personId)) next.delete(personId)
      else next.add(personId)
      return next
    })
  }

  const save = () => {
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      setNameError('Give the circle a name.')
      return
    }
    const trimmedDescription = description.trim()
    const personIds = [...memberIds]

    if (initial !== undefined) {
      if (trimmed !== initial.name || trimmedDescription !== (initial.description ?? '')) {
        updateGroup.mutate({
          id: initial.id,
          updates: {
            name: trimmed,
            description: trimmedDescription.length > 0 ? trimmedDescription : null,
          },
        })
      }
      const previousIds = [...initial.memberIds].sort().join(',')
      if (previousIds !== [...personIds].sort().join(',')) {
        setMembers.mutate({ id: initial.id, personIds })
      }
    } else {
      createGroup.mutate({
        name: trimmed,
        ...(trimmedDescription.length > 0 ? { description: trimmedDescription } : {}),
        ...(personIds.length > 0 ? { personIds } : {}),
      })
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.normal)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={[StyleSheet.absoluteFill, styles.scrim]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          entering={
            reduced
              ? undefined
              : SlideInDown.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)
          }
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACE.cardPad }]}
        >
          <View style={styles.header}>
            <View style={styles.headerTitles}>
              <Eyebrow color={FLAVORS.dreamspell.accentSoft}>
                {editing ? 'EDIT CIRCLE' : 'NEW CIRCLE'}
              </Eyebrow>
              <Text style={TYPE.section}>
                {editing ? 'Reshape the circle.' : 'Name the dynamic you live in.'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <XIcon size={20} color={COLORS.text50} />
            </Pressable>
          </View>

          <TextField
            label="NAME"
            value={name}
            onChangeText={(value) => {
              setName(value)
              if (nameError !== undefined && value.trim().length > 0) {
                setNameError(undefined)
              }
            }}
            placeholder="Family, founding team, the band"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={200}
            error={nameError}
          />

          <TextField
            label="DESCRIPTION"
            value={description}
            onChangeText={setDescription}
            placeholder="What holds these people together"
            autoCapitalize="sentences"
          />

          <View style={styles.membersBlock}>
            <View style={styles.membersHeader}>
              <Text style={TYPE.eyebrow}>MEMBERS</Text>
              <Text style={styles.membersCount}>{memberIds.size} CHOSEN</Text>
            </View>
            {people.length === 0 ? (
              <Text style={styles.membersEmpty}>
                A circle needs people — add someone to your map first.
              </Text>
            ) : (
              <FlatList
                data={people}
                keyExtractor={(person) => person.id}
                ItemSeparatorComponent={Divider}
                style={styles.memberList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <MemberRow
                    person={item}
                    selected={memberIds.has(item.id)}
                    onToggle={() => toggleMember(item.id)}
                  />
                )}
              />
            )}
          </View>

          <Button
            onPress={save}
            disabled={createGroup.isPending || updateGroup.isPending || setMembers.isPending}
          >
            {editing ? 'Save the circle' : 'Form the circle'}
          </Button>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: 'rgba(11,13,22,0.72)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.feature,
    borderTopRightRadius: RADII.feature,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE.featurePad,
    paddingTop: SPACE.featurePad,
    gap: SPACE.cardPad,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitles: {
    flex: 1,
    gap: 6,
  },
  membersBlock: {
    flexShrink: 1,
    gap: 8,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membersCount: {
    ...TYPE.statLabel,
  },
  membersEmpty: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  memberList: {
    flexGrow: 0,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  memberBody: {
    flex: 1,
    gap: 3,
  },
  memberLine: {
    ...TYPE.eyebrow,
    color: COLORS.text50,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarSelected: {
    borderColor: COLORS.brandSoft,
  },
  avatarText: {
    ...TYPE.eyebrow,
    color: COLORS.text70,
    letterSpacing: 1,
  },
  checkRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkRingActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brandSoft,
  },
})
