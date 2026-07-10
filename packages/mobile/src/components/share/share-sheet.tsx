import * as Haptics from 'expo-haptics'
import { XIcon } from 'phosphor-react-native'
import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { SharedView } from '@pleiad/api-client'

import { Button, Divider, Eyebrow } from '@/components/ui/primitives'
import { TextField } from '@/components/ui/text-field'
import {
  useCreateShare,
  useRevokeShare,
  useSubjectShares,
  shareUrl,
  type ShareSubject,
} from '@/lib/shares/hooks'
import { showToast } from '@/lib/toast'
import { COLORS, DURATION, FONTS, RADII, SPACE, SPRING, TYPE } from '@/theme/tokens'

/**
 * S16 Share composer — F8. One sheet: mint a link (expiry, view cap,
 * optional password), hand it to the native share sheet, and manage the
 * subject's active links (view counts + revoke). Shares are not plan-gated
 * server-side, so there is no paywall path here.
 */

type ExpiryChoice = '7d' | '30d' | 'never'
type ViewsChoice = 'none' | '10' | '100'

const EXPIRY_CHOICES: Array<{ key: ExpiryChoice; label: string }> = [
  { key: '7d', label: '7 DAYS' },
  { key: '30d', label: '30 DAYS' },
  { key: 'never', label: 'NEVER' },
]

const VIEWS_CHOICES: Array<{ key: ViewsChoice; label: string }> = [
  { key: 'none', label: 'NO CAP' },
  { key: '10', label: '10 VIEWS' },
  { key: '100', label: '100 VIEWS' },
]

const DAY_MS = 24 * 60 * 60 * 1000

function expiresAtFor(choice: ExpiryChoice): string | null {
  if (choice === 'never') return null
  const days = choice === '7d' ? 7 : 30
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

function maxViewsFor(choice: ViewsChoice): number | null {
  if (choice === 'none') return null
  return choice === '10' ? 10 : 100
}

/** Hand the minted URL to the OS share sheet. Never throws into the UI. */
async function presentNativeShare(url: string, title: string): Promise<void> {
  try {
    await Share.share(
      Platform.OS === 'ios' ? { url, message: title } : { message: `${title}\n${url}` }
    )
  } catch {
    // Dismissed or unavailable — the link exists either way; the list shows it.
  }
}

function ChipRow<T extends string>({
  choices,
  active,
  onSelect,
}: {
  choices: Array<{ key: T; label: string }>
  active: T
  onSelect: (key: T) => void
}) {
  return (
    <View style={styles.chipRow}>
      {choices.map(({ key, label }) => {
        const selected = key === active
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={[styles.chip, selected && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function ActiveLinkRow({
  share,
  onRevoke,
  revoking,
}: {
  share: SharedView
  onRevoke: () => void
  revoking: boolean
}) {
  return (
    <View style={styles.linkRow}>
      <View style={styles.linkBody}>
        <Text style={styles.linkUrl} numberOfLines={1}>
          {shareUrl(share.url_token)}
        </Text>
        <Text style={styles.linkMeta}>
          {`${share.view_count} ${share.view_count === 1 ? 'VIEW' : 'VIEWS'}`}
          {share.max_views !== null ? ` OF ${share.max_views}` : ''}
          {share.expires_at !== null
            ? ` · UNTIL ${share.expires_at.slice(0, 10)}`
            : ' · NO EXPIRY'}
        </Text>
      </View>
      <Pressable
        onPress={onRevoke}
        disabled={revoking}
        hitSlop={8}
        style={styles.revokeButton}
        accessibilityRole="button"
        accessibilityLabel="Revoke this link"
      >
        <Text style={styles.revokeText}>REVOKE</Text>
      </Pressable>
    </View>
  )
}

export function ShareSheet({
  visible,
  onClose,
  subject,
}: {
  visible: boolean
  onClose: () => void
  subject: ShareSubject
}) {
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()

  const [expiry, setExpiry] = useState<ExpiryChoice>('30d')
  const [views, setViews] = useState<ViewsChoice>('none')
  const [password, setPassword] = useState('')

  const links = useSubjectShares(subject, visible)
  const revoke = useRevokeShare()
  const create = useCreateShare({
    onCreated: (share) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setPassword('')
      void presentNativeShare(shareUrl(share.url_token), subject.title)
    },
  })

  const mint = () => {
    if (create.isPending) return
    create.mutate({
      subject,
      expiresAt: expiresAtFor(expiry),
      maxViews: maxViewsFor(views),
      password: password.trim().length > 0 ? password.trim() : null,
    })
  }

  const confirmRevoke = (share: SharedView) => {
    Alert.alert(
      'Revoke this link?',
      'Anyone holding it loses access immediately.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => {
            revoke.mutate(share.id, {
              onSuccess: () => showToast('The link is dark.'),
            })
          },
        },
      ]
    )
  }

  const renderLinks = () => {
    if (links.isPending) {
      return (
        <View style={styles.linkList}>
          <View style={styles.skeletonRow} />
          <View style={[styles.skeletonRow, styles.skeletonNarrow]} />
        </View>
      )
    }
    if (links.isError) {
      return (
        <Text style={styles.quietLine}>
          Existing links are out of reach.{' '}
          <Text style={styles.retryText} onPress={links.refetch}>
            Try again
          </Text>
        </Text>
      )
    }
    if (links.shares.length === 0) {
      return <Text style={styles.quietLine}>No active links yet — mint the first.</Text>
    }
    return (
      <View style={styles.linkList}>
        {links.shares.map((share, index) => (
          <View key={share.id}>
            <ActiveLinkRow
              share={share}
              revoking={revoke.isPending}
              onRevoke={() => confirmRevoke(share)}
            />
            {index < links.shares.length - 1 && <Divider />}
          </View>
        ))}
      </View>
    )
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
            <Eyebrow color={COLORS.brandSoft}>SHARE THIS READING</Eyebrow>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <XIcon size={20} color={COLORS.text50} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={TYPE.card} numberOfLines={1}>
              {subject.title}
            </Text>

            <View style={styles.field}>
              <Eyebrow>LINK LIFETIME</Eyebrow>
              <ChipRow choices={EXPIRY_CHOICES} active={expiry} onSelect={setExpiry} />
            </View>

            <View style={styles.field}>
              <Eyebrow>VIEW LIMIT</Eyebrow>
              <ChipRow choices={VIEWS_CHOICES} active={views} onSelect={setViews} />
            </View>

            <TextField
              label="PASSWORD"
              value={password}
              onChangeText={setPassword}
              placeholder="Optional"
              helper="Viewers will be asked for it. Leave empty for an open link."
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={128}
            />

            <Button onPress={mint} disabled={create.isPending}>
              {create.isPending ? 'Minting…' : 'Create link'}
            </Button>

            <View style={styles.linksSection}>
              <Eyebrow>ACTIVE LINKS</Eyebrow>
              {renderLinks()}
            </View>
          </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    gap: SPACE.cardPad,
    paddingBottom: SPACE.unit * 2,
  },
  field: {
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: COLORS.brandSoft,
    backgroundColor: COLORS.surface2,
  },
  chipText: {
    ...TYPE.eyebrow,
    color: COLORS.text50,
  },
  chipTextActive: {
    color: COLORS.brandSoft,
  },
  linksSection: {
    gap: 10,
    paddingTop: SPACE.unit * 2,
  },
  linkList: {
    gap: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.cardPad,
    paddingVertical: 14,
  },
  linkBody: {
    flex: 1,
    gap: 4,
  },
  linkUrl: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text90,
  },
  linkMeta: {
    ...TYPE.statLabel,
  },
  revokeButton: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  revokeText: {
    ...TYPE.eyebrow,
    color: COLORS.destructive,
  },
  quietLine: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  retryText: {
    color: COLORS.brandSoft,
  },
  skeletonRow: {
    height: 44,
    borderRadius: RADII.button,
    backgroundColor: COLORS.surface2,
  },
  skeletonNarrow: {
    width: '70%',
  },
})
