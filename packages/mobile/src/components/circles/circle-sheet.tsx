import type { PersonWithTags } from '@pleiad/api-client'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import * as Haptics from 'expo-haptics'
import { CheckIcon, XIcon } from 'phosphor-react-native'
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'

import { Glyph } from '@/components/glyph'
import {
  BottomSheet,
  Button,
  Divider,
  IconButton,
  Text,
  TextField,
  Touchable,
} from '@/components/m3'
import { useCreateGroup, useSetGroupMembers, useUpdateGroup } from '@/lib/groups/hooks'
import { usePeople } from '@/lib/people/hooks'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'
import { initialsOf } from '@/lib/text'

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

function kinLine(birthDate: string): string {
  try {
    const kin = dateToKin(birthDate)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return `Kin ${kin} · ${tone.name} ${seal.english}`
  } catch {
    return birthDate
  }
}

/** The person's Dreamspell seal number, or null for an uncomputable date. */
function sealNumberOf(birthDate: string): number | null {
  try {
    return kinToSeal(dateToKin(birthDate))
  } catch {
    return null
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
  const theme = useTheme()
  const seal = sealNumberOf(person.birth_date)

  return (
    <Touchable
      onPress={onToggle}
      stateLayerColor={theme.colors.onSurface}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={person.name}
      style={styles.memberRow}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: theme.colors.surfaceContainerHighest,
            borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
          },
        ]}
      >
        <Text variant="labelLarge" color="onSurfaceVariant">
          {initialsOf(person.name)}
        </Text>
        {seal !== null && (
          <View
            style={[
              styles.avatarBadge,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Glyph seal={seal} size={13} color={FLAVORS.dreamspell.accent} />
          </View>
        )}
      </View>

      <View style={styles.memberBody}>
        <Text variant="bodyLarge" numberOfLines={1}>
          {person.name}
        </Text>
        <Text variant="labelMedium" color="onSurfaceVariant" numberOfLines={1}>
          {kinLine(person.birth_date)}
        </Text>
      </View>

      {/* The ring is filled *and* checked: colour alone can't carry selection. */}
      <View
        style={[
          styles.checkRing,
          { borderColor: theme.colors.outline },
          selected && {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        {selected && <CheckIcon size={14} color={theme.colors.onPrimary} weight="bold" />}
      </View>
    </Touchable>
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
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text variant="labelLarge" color="primary">
            {editing ? 'Edit circle' : 'New circle'}
          </Text>
          <Text variant="headlineSmall">
            {editing ? 'Reshape the circle.' : 'Name the dynamic you live in.'}
          </Text>
        </View>
        <IconButton
          icon={(color) => <XIcon size={24} color={color} />}
          onPress={onClose}
          accessibilityLabel="Close"
        />
      </View>

      <View style={styles.form}>
        <TextField
          label="Name"
          value={name}
          onChangeText={(value) => {
            setName(value)
            if (nameError !== undefined && value.trim().length > 0) {
              setNameError(undefined)
            }
          }}
          supportingText="Family, founding team, the band"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={200}
          error={nameError}
        />

        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          supportingText="What holds these people together"
          autoCapitalize="sentences"
        />

        <View style={styles.membersBlock}>
          <View style={styles.membersHeader}>
            <Text variant="labelLarge" color="onSurfaceVariant">
              Members
            </Text>
            <Text variant="labelMedium" color="onSurfaceVariant">
              {memberIds.size} chosen
            </Text>
          </View>
          {people.length === 0 ? (
            <Text variant="bodyMedium" color="onSurfaceVariant">
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
          fullWidth
          onPress={save}
          disabled={createGroup.isPending || updateGroup.isPending || setMembers.isPending}
        >
          {editing ? 'Save the circle' : 'Form the circle'}
        </Button>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.md,
    marginBottom: SPACE.lg,
  },
  headerTitles: {
    flex: 1,
    gap: SPACE.xs,
  },
  form: {
    gap: SPACE.xl,
  },
  membersBlock: {
    flexShrink: 1,
    gap: SPACE.sm,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  /**
   * The list runs to the sheet's edges so a row's state layer reaches them
   * too — the row keeps the 16dp margin as its own padding.
   */
  memberList: {
    flexGrow: 0,
    marginHorizontal: -SPACE.margin,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    minHeight: 72,
    paddingHorizontal: SPACE.margin,
    paddingVertical: SPACE.sm,
  },
  memberBody: {
    flex: 1,
    gap: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: SHAPE.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRing: {
    width: 24,
    height: 24,
    borderRadius: SHAPE.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
})
