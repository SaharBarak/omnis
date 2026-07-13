import type { Profile, SystemKey } from '@pleiad/api-client'
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Constants from 'expo-constants'
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { ArrowSquareOutIcon, CaretLeftIcon } from 'phosphor-react-native'
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { PaywallSheet } from '@/components/billing/paywall-sheet'
import { ProfileEditSheet } from '@/components/settings/profile-edit-sheet'
import { Button, Divider, Eyebrow } from '@/components/ui/primitives'
import { ToastHost } from '@/components/ui/toast'
import { api, useProfile, useSubscription } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { ENV } from '@/lib/env'
import { formatBirthTime } from '@/lib/onboarding/draft-store'
import { registerForPush } from '@/lib/notifications/push'
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/lib/notifications/settings'
import { showToast } from '@/lib/toast'
import { COLORS, FONTS, RADII, SPACE, TYPE } from '@/theme/tokens'

/**
 * S17 Settings — F12. Hairline groups, no cards: profile, system toggles,
 * notifications, plan + usage, account, about. Destructive actions confirm
 * natively; sign-out wipes tokens and the query cache (auth store).
 */

/** Stored shape of profile.preferences.systems — mirrors the web
 * use-system-preferences.ts exactly: a Record of system → enabled. */
type SystemPrefs = Record<SystemKey, boolean>

const DEFAULT_SYSTEM_PREFS: SystemPrefs = {
  dreamspell: true,
  tzolkin: true,
  longcount: true,
  astrology: true,
  humandesign: true,
  gematria: true,
}

const SYSTEM_TOGGLES: ReadonlyArray<{ key: SystemKey; label: string }> = [
  { key: 'dreamspell', label: 'Dreamspell' },
  { key: 'tzolkin', label: 'Tzolkin' },
  { key: 'longcount', label: 'Long Count' },
  { key: 'astrology', label: 'Astrology' },
  { key: 'humandesign', label: 'Human Design' },
  { key: 'gematria', label: 'Kabbalah' },
] as const

/** Read the stored record, tolerating the legacy/absent shapes. */
function readSystemPrefs(profile: Profile | undefined): SystemPrefs {
  const raw = (profile?.preferences as Record<string, unknown> | undefined)?.systems
  if (raw === undefined || raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_SYSTEM_PREFS
  }
  const stored = raw as Partial<Record<SystemKey, unknown>>
  const merged = { ...DEFAULT_SYSTEM_PREFS }
  for (const { key } of SYSTEM_TOGGLES) {
    const value = stored[key]
    if (typeof value === 'boolean') merged[key] = value
  }
  return merged
}

function parseDigestTime(time: string): Date {
  const [hours = 8, minutes = 0] = time.split(':').map(Number)
  const value = new Date()
  value.setHours(hours, minutes, 0, 0)
  return value
}

type PushStatus = 'unknown' | 'granted' | 'denied' | 'undetermined'

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Eyebrow>{title}</Eyebrow>
    </View>
  )
}

function ValueRow({
  label,
  value,
  mono = false,
  last = false,
}: {
  label: string
  value: string
  mono?: boolean
  last?: boolean
}) {
  return (
    <>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={mono ? styles.rowValueMono : styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {!last && <Divider />}
    </>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
  disabled = false,
  last = false,
}: {
  label: string
  value: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  last?: boolean
}) {
  return (
    <>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Switch
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{ false: COLORS.surface2, true: COLORS.brand }}
          thumbColor={COLORS.brandBright}
          accessibilityLabel={label}
        />
      </View>
      {!last && <Divider />}
    </>
  )
}

function LinkRow({
  label,
  onPress,
  destructive = false,
  external = false,
  last = false,
}: {
  label: string
  onPress: () => void
  destructive?: boolean
  external?: boolean
  last?: boolean
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={[styles.rowLabel, destructive && styles.rowDestructive]}>
          {label}
        </Text>
        {external && <ArrowSquareOutIcon size={16} color={COLORS.text35} />}
      </Pressable>
      {!last && <Divider />}
    </>
  )
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const queryClient = useQueryClient()
  const signOut = useAuthStore((state) => state.signOut)

  const profile = useProfile()
  const subscription = useSubscription()
  const notificationSettings = useNotificationSettings()
  const updateNotifications = useUpdateNotificationSettings()

  const [editOpen, setEditOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [pushStatus, setPushStatus] = useState<PushStatus>('unknown')
  const [digestPickerOpen, setDigestPickerOpen] = useState(false)
  const [billingBusy, setBillingBusy] = useState(false)

  const refreshPushStatus = useCallback(async () => {
    try {
      const permission = await Notifications.getPermissionsAsync()
      setPushStatus(
        permission.granted
          ? 'granted'
          : permission.canAskAgain
            ? 'undetermined'
            : 'denied'
      )
    } catch {
      setPushStatus('unknown')
    }
  }, [])

  useEffect(() => {
    void refreshPushStatus()
  }, [refreshPushStatus])

  // SYSTEMS — optimistic write of the full preferences object.
  const systemPrefs = readSystemPrefs(profile.data)
  const updateSystems = useMutation<
    Profile,
    unknown,
    SystemPrefs,
    { previous: Profile | undefined }
  >({
    mutationFn: (next) =>
      api.profile.update({
        preferences: {
          ...((profile.data?.preferences ?? {}) as Record<string, unknown>),
          systems: next,
        },
      }),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] })
      const previous = queryClient.getQueryData<Profile>(['profile'])
      if (previous !== undefined) {
        // The stored shape is the web's Record<system, boolean> — the client
        // type still declares the legacy array, hence the double cast.
        queryClient.setQueryData<Profile>(['profile'], {
          ...previous,
          preferences: {
            ...(previous.preferences as Record<string, unknown>),
            systems: next,
          } as unknown as Profile['preferences'],
        })
      }
      return { previous }
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(['profile'], context?.previous)
      showToast("The toggle didn't hold. Try again.")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const toggleSystem = (key: SystemKey, value: boolean) => {
    updateSystems.mutate({ ...systemPrefs, [key]: value })
  }

  const enablePush = async () => {
    const token = await registerForPush()
    await refreshPushStatus()
    if (token !== null) showToast('The morning sky will find you.')
  }

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Your map stays safe on the server.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ])
  }

  /**
   * The App Store / Google Play own the subscription lifecycle — cancelling and
   * resuming happen in the OS subscription settings, not here. This resolves the
   * store's management deep link; whatever the user changes there flows back to
   * us through the billing webhook.
   */
  const manageSubscription = () => {
    setBillingBusy(true)
    api.billing
      .portal()
      .then(({ url }) => Linking.openURL(url))
      .catch(() => showToast("Couldn't open your subscription settings."))
      .finally(() => {
        setBillingBusy(false)
        void queryClient.invalidateQueries({ queryKey: ['subscription'] })
      })
  }

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  const renderProfileSection = () => {
    if (profile.isPending) {
      return (
        <View style={styles.skeletonBlock}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.skeletonNarrow]} />
        </View>
      )
    }
    if (profile.isError || profile.data === undefined) {
      return (
        <Text style={styles.quietLine}>
          Your profile is out of reach.{' '}
          <Text style={styles.retryText} onPress={() => void profile.refetch()}>
            Try again
          </Text>
        </Text>
      )
    }
    const data = profile.data
    const place =
      data.birth_place?.city !== undefined && data.birth_place.city.length > 0
        ? [data.birth_place.city, data.birth_place.country]
            .filter((part): part is string => part !== undefined && part.length > 0)
            .join(', ')
        : '—'
    return (
      <View>
        <ValueRow label="Name" value={data.display_name} />
        <ValueRow label="Born" value={data.birth_date ?? '—'} mono />
        <ValueRow label="Time" value={data.birth_time ?? 'Unknown'} mono />
        <ValueRow label="Place" value={place} />
        <ValueRow label="Hebrew name" value={data.hebrew_name ?? '—'} last />
        <Button
          variant="secondary"
          onPress={() => setEditOpen(true)}
          style={styles.sectionAction}
        >
          Edit
        </Button>
      </View>
    )
  }

  const renderNotificationsSection = () => {
    const settings = notificationSettings.data
    return (
      <View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Push</Text>
          <Text style={styles.rowValue}>
            {pushStatus === 'granted'
              ? 'On'
              : pushStatus === 'denied'
                ? 'Off in system settings'
                : pushStatus === 'undetermined'
                  ? 'Not enabled yet'
                  : '—'}
          </Text>
        </View>
        <Divider />
        {pushStatus === 'undetermined' && (
          <Button
            variant="secondary"
            onPress={() => void enablePush()}
            style={styles.sectionAction}
          >
            Enable the morning digest
          </Button>
        )}
        {pushStatus === 'denied' && (
          <Button
            variant="secondary"
            onPress={() => void Linking.openSettings()}
            style={styles.sectionAction}
          >
            Open system settings
          </Button>
        )}

        {notificationSettings.isPending ? (
          <View style={styles.skeletonBlock}>
            <View style={styles.skeletonLine} />
          </View>
        ) : notificationSettings.isError || settings === undefined ? (
          <Text style={styles.quietLine}>
            Digest preferences are out of reach.{' '}
            <Text
              style={styles.retryText}
              onPress={() => void notificationSettings.refetch()}
            >
              Try again
            </Text>
          </Text>
        ) : (
          <View>
            <ToggleRow
              label="Daily digest"
              value={settings.dailyDigest}
              disabled={updateNotifications.isPending}
              onChange={(next) => updateNotifications.mutate({ dailyDigest: next })}
              last={!settings.dailyDigest}
            />
            {settings.dailyDigest && (
              <>
                <Pressable
                  onPress={() => setDigestPickerOpen((previous) => !previous)}
                  style={styles.row}
                  accessibilityRole="button"
                  accessibilityLabel="Change the digest time"
                >
                  <Text style={styles.rowLabel}>Digest time</Text>
                  <Text style={styles.rowValueMono}>{settings.dailyDigestTime}</Text>
                </Pressable>
                {digestPickerOpen && (
                  <DateTimePicker
                    value={parseDigestTime(settings.dailyDigestTime)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant="dark"
                    onChange={(_event: DateTimePickerEvent, next?: Date) => {
                      if (Platform.OS !== 'ios') setDigestPickerOpen(false)
                      if (next !== undefined) {
                        updateNotifications.mutate({
                          dailyDigestTime: formatBirthTime(next),
                        })
                      }
                    }}
                  />
                )}
              </>
            )}
          </View>
        )}
      </View>
    )
  }

  const renderPlanSection = () => {
    if (subscription.isPending) {
      return (
        <View style={styles.skeletonBlock}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.skeletonNarrow]} />
        </View>
      )
    }
    if (subscription.isError || subscription.data === undefined) {
      return (
        <Text style={styles.quietLine}>
          Your plan is out of reach.{' '}
          <Text style={styles.retryText} onPress={() => void subscription.refetch()}>
            Try again
          </Text>
        </Text>
      )
    }
    const sub = subscription.data
    const renewal = sub.cancelAtPeriodEnd
      ? `Ends ${sub.currentPeriodEnd?.slice(0, 10) ?? 'at period end'}`
      : sub.plan === 'lifetime'
        ? 'Yours forever'
        : sub.currentPeriodEnd != null
          ? `Renews ${sub.currentPeriodEnd.slice(0, 10)}`
          : '—'
    const people = sub.usage.profiles
    const ai = sub.usage.aiInterpretations
    return (
      <View>
        <ValueRow label="Plan" value={sub.planName} />
        <ValueRow label="Renewal" value={renewal} />
        <ValueRow
          label="People"
          value={`${people.used} / ${people.limit ?? '∞'}`}
          mono
        />
        <ValueRow
          label="AI readings"
          value={ai.limit === null || ai.limit > 0 ? `${ai.used} / ${ai.limit ?? '∞'}` : '—'}
          mono
          last
        />
        <Button
          variant="secondary"
          onPress={() => setPaywallOpen(true)}
          style={styles.sectionAction}
        >
          See plans
        </Button>
        {sub.hasSubscription && (
          <LinkRow
            label={billingBusy ? 'Opening…' : 'Manage subscription'}
            onPress={manageSubscription}
            last
          />
        )}
      </View>
    )
  }

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={TYPE.zone}>Settings</Text>

        <View style={styles.section}>
          <SectionHeader title="PROFILE" />
          {renderProfileSection()}
        </View>

        <View style={styles.section}>
          <SectionHeader title="SYSTEMS" />
          {SYSTEM_TOGGLES.map(({ key, label }, index) => (
            <ToggleRow
              key={key}
              label={label}
              value={systemPrefs[key]}
              disabled={profile.data === undefined || updateSystems.isPending}
              onChange={(next) => toggleSystem(key, next)}
              last={index === SYSTEM_TOGGLES.length - 1}
            />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader title="NOTIFICATIONS" />
          {renderNotificationsSection()}
        </View>

        <View style={styles.section}>
          <SectionHeader title="PLAN" />
          {renderPlanSection()}
        </View>

        <View style={styles.section}>
          <SectionHeader title="ACCOUNT" />
          <LinkRow label="Sign out" destructive onPress={confirmSignOut} />
          <LinkRow
            label="Delete account"
            external
            onPress={() => void Linking.openURL(`${ENV.apiUrl}/app/settings`)}
            last
          />
          <Text style={styles.footnote}>ACCOUNT DELETION HAPPENS ON THE WEB</Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="ABOUT" />
          <ValueRow
            label="Version"
            value={Constants.expoConfig?.version ?? '1.0.0'}
            mono
          />
          <LinkRow
            label="Privacy"
            external
            onPress={() => void Linking.openURL(`${ENV.apiUrl}/privacy`)}
          />
          <LinkRow
            label="Terms"
            external
            onPress={() => void Linking.openURL(`${ENV.apiUrl}/terms`)}
            last
          />
        </View>
      </ScrollView>

      {profile.data !== undefined && (
        <ProfileEditSheet
          visible={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile.data}
        />
      )}

      <PaywallSheet
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trigger="generic"
      />

      <ToastHost />
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
  content: {
    paddingHorizontal: SPACE.gutter,
    paddingTop: SPACE.unit * 2,
    paddingBottom: SPACE.section * 2,
    gap: SPACE.section,
  },
  section: {
    gap: 4,
  },
  sectionHeader: {
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.cardPad,
    paddingVertical: 14,
  },
  rowLabel: {
    ...TYPE.body,
    color: COLORS.text90,
  },
  rowDestructive: {
    color: COLORS.destructive,
  },
  rowValue: {
    ...TYPE.body,
    color: COLORS.text50,
    flexShrink: 1,
    textAlign: 'right',
  },
  rowValueMono: {
    fontFamily: FONTS.mono,
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.text70,
    fontVariant: ['tabular-nums'],
  },
  sectionAction: {
    marginTop: 10,
    marginBottom: 6,
  },
  quietLine: {
    ...TYPE.bodySm,
    color: COLORS.text50,
    paddingVertical: 10,
  },
  retryText: {
    color: COLORS.brandSoft,
  },
  footnote: {
    ...TYPE.statLabel,
    paddingTop: 8,
  },
  skeletonBlock: {
    gap: 10,
    paddingVertical: 10,
  },
  skeletonLine: {
    height: 18,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface2,
  },
  skeletonNarrow: {
    width: '58%',
  },
})
