import * as Haptics from 'expo-haptics'
import { XIcon } from 'phosphor-react-native'
import { useState } from 'react'
import { Alert, Platform, ScrollView, Share, StyleSheet, View } from 'react-native'

import type { SharedView } from '@pleiad/api-client'

import {
  BottomSheet,
  Button,
  Chip,
  Divider,
  IconButton,
  Text,
  TextField,
  Touchable,
} from '@/components/m3'
import { ErrorState } from '@/components/ui/error-state'
import {
  useCreateShare,
  useRevokeShare,
  useSubjectShares,
  shareUrl,
  type ShareSubject,
} from '@/lib/shares/hooks'
import { showToast } from '@/lib/toast'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'

/**
 * S16 Share composer — F8. One sheet: mint a link (expiry, view cap,
 * optional password), hand it to the native share sheet, and manage the
 * subject's active links (view counts + revoke). Shares are not plan-gated
 * server-side, so there is no paywall path here.
 */

type ExpiryChoice = '7d' | '30d' | 'never'
type ViewsChoice = 'none' | '10' | '100'

const EXPIRY_CHOICES: Array<{ key: ExpiryChoice; label: string }> = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'never', label: 'Never' },
]

const VIEWS_CHOICES: Array<{ key: ViewsChoice; label: string }> = [
  { key: 'none', label: 'No cap' },
  { key: '10', label: '10 views' },
  { key: '100', label: '100 views' },
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
      {choices.map(({ key, label }) => (
        <Chip
          key={key}
          variant="filter"
          label={label}
          selected={key === active}
          onPress={() => onSelect(key)}
        />
      ))}
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
  const theme = useTheme()

  return (
    <View style={styles.linkRow}>
      <View style={styles.linkBody}>
        <Text variant="dataSmall" numberOfLines={1}>
          {shareUrl(share.url_token)}
        </Text>
        <Text variant="labelMedium" color="onSurfaceVariant">
          {`${share.view_count} ${share.view_count === 1 ? 'view' : 'views'}`}
          {share.max_views !== null ? ` of ${share.max_views}` : ''}
          {share.expires_at !== null
            ? ` · until ${share.expires_at.slice(0, 10)}`
            : ' · no expiry'}
        </Text>
      </View>

      {/*
       * Revoking is destructive, so the label wears `error` rather than the
       * primary an m3 Button would give it. Everything else is a text button.
       */}
      <Touchable
        onPress={onRevoke}
        disabled={revoking}
        radius={SHAPE.full}
        stateLayerColor={theme.colors.error}
        accessibilityRole="button"
        accessibilityLabel="Revoke this link"
        accessibilityState={{ disabled: revoking }}
        hitSlop={{ top: 4, bottom: 4 }}
        style={styles.revokeButton}
      >
        <Text variant="labelLarge" color="error">
          Revoke
        </Text>
      </Touchable>
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
  const theme = useTheme()

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
          <View
            style={[
              styles.skeletonRow,
              { backgroundColor: theme.colors.surfaceContainerHighest },
            ]}
          />
          <View
            style={[
              styles.skeletonRow,
              styles.skeletonNarrow,
              { backgroundColor: theme.colors.surfaceContainerHighest },
            ]}
          />
        </View>
      )
    }
    if (links.isError) {
      return (
        <ErrorState
          message="Existing links are out of reach."
          onRetry={links.refetch}
        />
      )
    }
    if (links.shares.length === 0) {
      return (
        <Text variant="bodyMedium" color="onSurfaceVariant">
          No active links yet — mint the first.
        </Text>
      )
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
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text variant="labelLarge" color="primary">
          Share this reading
        </Text>
        <IconButton
          icon={(color) => <XIcon size={24} color={color} />}
          onPress={onClose}
          accessibilityLabel="Close"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <Text variant="titleMedium" numberOfLines={1}>
          {subject.title}
        </Text>

        <View style={styles.field}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            Link lifetime
          </Text>
          <ChipRow choices={EXPIRY_CHOICES} active={expiry} onSelect={setExpiry} />
        </View>

        <View style={styles.field}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            View limit
          </Text>
          <ChipRow choices={VIEWS_CHOICES} active={views} onSelect={setViews} />
        </View>

        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          supportingText="Viewers will be asked for it. Leave empty for an open link."
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={128}
        />

        <Button fullWidth onPress={mint} disabled={create.isPending}>
          {create.isPending ? 'Minting…' : 'Create link'}
        </Button>

        <View style={styles.linksSection}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            Active links
          </Text>
          {renderLinks()}
        </View>
      </ScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.sm,
  },
  scrollContent: {
    gap: SPACE.lg,
    paddingBottom: SPACE.xl,
  },
  field: {
    gap: SPACE.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACE.md,
  },
  linksSection: {
    gap: SPACE.md,
    paddingTop: SPACE.lg,
  },
  linkList: {
    gap: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    minHeight: 56,
  },
  linkBody: {
    flex: 1,
    gap: SPACE.xs,
  },
  revokeButton: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACE.md,
  },
  skeletonRow: {
    height: 44,
    borderRadius: SHAPE.small,
  },
  skeletonNarrow: {
    width: '70%',
  },
})
