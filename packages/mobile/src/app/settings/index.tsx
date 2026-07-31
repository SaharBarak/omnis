import type { Profile } from '@pleiad/api-client'
import {
  SYSTEM_CATALOG,
  resolveSystemPreferences,
  type SystemGroup,
  type SystemInfo,
  type SystemKey,
} from '@pleiad/engine/services/system-preferences'
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
import { Alert, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { PaywallSheet } from '@/components/billing/paywall-sheet'
import {
  Button,
  Divider,
  IconButton,
  LARGE_TITLE_COLLAPSE_DISTANCE,
  ListItem,
  Text,
  TopAppBar,
  useScrollProgress,
} from '@/components/m3'
import { ProfileEditSheet } from '@/components/settings/profile-edit-sheet'
import { ErrorState } from '@/components/ui/error-state'
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
import { SHAPE, SPACE, useTheme } from '@/theme/m3'

/**
 * S17 Settings — F12. One M3 list per group: profile, system toggles,
 * notifications, plan + usage, account, about. Destructive actions confirm
 * natively — the red lives in the confirmation dialog, which is where a
 * destructive decision is actually made; sign-out wipes tokens and the query
 * cache (auth store).
 */

/** Stored shape of profile.preferences.systems — the shared record the web
 * chooser, the person tabs, the Today board and the digest all resolve. */
type SystemPrefs = Record<SystemKey, boolean>

/** The chooser's two groups, in the web's order and with its copy. */
const SYSTEM_GROUPS: ReadonlyArray<{
  id: SystemGroup
  title: string
  blurb: string
}> = [
  {
    id: 'readings',
    title: 'Reading systems',
    blurb: 'Shape person pages and your readings',
  },
  {
    id: 'calendars',
    title: 'Calendars & sky',
    blurb: 'Shape the Today board and your daily brief',
  },
] as const

function parseDigestTime(time: string): Date {
  const [hours = 8, minutes = 0] = time.split(':').map(Number)
  const value = new Date()
  value.setHours(hours, minutes, 0, 0)
  return value
}

type PushStatus = 'unknown' | 'granted' | 'denied' | 'undetermined'

function SectionHeader({ title }: { title: string }) {
  return (
    <Text variant="labelLarge" color="primary" style={styles.sectionHeader}>
      {title}
    </Text>
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
      <ListItem
        headline={label}
        trailing={
          <Text
            variant={mono ? 'dataMedium' : 'bodyMedium'}
            color="onSurfaceVariant"
            numberOfLines={1}
          >
            {value}
          </Text>
        }
      />
      {!last && <Divider />}
    </>
  )
}

/** The one line of copy a system row owes the reader, if any. */
function requirementNote(system: SystemInfo): string | null {
  if (system.requiresTime === true && system.requiresLocation === true)
    return 'Needs birth time and place'
  if (system.requiresTime === true) return 'Needs a birth time'
  if (system.requiresLocation === true) return 'Needs a birth place'
  return null
}

function ToggleRow({
  label,
  supportingText,
  value,
  onChange,
  disabled = false,
  last = false,
}: {
  label: string
  supportingText?: string
  value: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  last?: boolean
}) {
  const theme = useTheme()

  return (
    <>
      {/*
       * The row itself toggles. A bare Switch is 31dp tall and misses the 48dp
       * floor; the list item around it clears 56 and is the target M3 intends.
       */}
      <ListItem
        headline={label}
        supportingText={supportingText}
        onPress={disabled ? undefined : () => onChange(!value)}
        accessibilityLabel={label}
        trailing={
          <Switch
            value={value}
            onValueChange={onChange}
            disabled={disabled}
            trackColor={{
              false: theme.colors.surfaceContainerHighest,
              true: theme.colors.primary,
            }}
            thumbColor={value ? theme.colors.onPrimary : theme.colors.outline}
            ios_backgroundColor={theme.colors.surfaceContainerHighest}
            accessibilityLabel={label}
          />
        }
      />
      {!last && <Divider />}
    </>
  )
}

function LinkRow({
  label,
  onPress,
  external = false,
  last = false,
  destructive = false,
}: {
  label: string
  onPress: () => void
  external?: boolean
  last?: boolean
  destructive?: boolean
}) {
  const theme = useTheme()

  return (
    <>
      <ListItem
        headline={label}
        onPress={onPress}
        accessibilityLabel={label}
        destructive={destructive}
        trailing={
          external ? (
            <ArrowSquareOutIcon size={18} color={theme.colors.onSurfaceVariant} />
          ) : undefined
        }
      />
      {!last && <Divider />}
    </>
  )
}

/** Loading blocks that hold the shape of the rows they'll become. */
function SkeletonBlock({ lines = 2 }: { lines?: number }) {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const pulse = useSharedValue(0.45)

  useEffect(() => {
    if (reduced) return
    pulse.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true)
  }, [reduced, pulse])

  const shimmer = useAnimatedStyle(() => ({ opacity: pulse.value }))

  return (
    <Animated.View style={[styles.skeletonBlock, shimmer]}>
      {Array.from({ length: lines }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonLine,
            { backgroundColor: theme.colors.surfaceContainerHighest },
            index === lines - 1 && styles.skeletonNarrow,
          ]}
        />
      ))}
    </Animated.View>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const theme = useTheme()
  const queryClient = useQueryClient()
  const signOut = useAuthStore((state) => state.signOut)
  const { progress, onScroll } = useScrollProgress(LARGE_TITLE_COLLAPSE_DISTANCE)

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
  const systemPrefs = resolveSystemPreferences(profile.data?.preferences)
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
    if (profile.isPending) return <SkeletonBlock />
    if (profile.isError || profile.data === undefined) {
      return (
        <View style={styles.inset}>
          <ErrorState
            message="Your profile is out of reach."
            onRetry={() => void profile.refetch()}
          />
        </View>
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
        <View style={styles.sectionAction}>
          <Button variant="outlined" onPress={() => setEditOpen(true)}>
            Edit
          </Button>
        </View>
      </View>
    )
  }

  const renderNotificationsSection = () => {
    const settings = notificationSettings.data
    return (
      <View>
        <ValueRow
          label="Push"
          value={
            pushStatus === 'granted'
              ? 'On'
              : pushStatus === 'denied'
                ? 'Off in system settings'
                : pushStatus === 'undetermined'
                  ? 'Not enabled yet'
                  : '—'
          }
        />
        {pushStatus === 'undetermined' && (
          <View style={styles.sectionAction}>
            <Button variant="outlined" onPress={() => void enablePush()}>
              Enable the morning digest
            </Button>
          </View>
        )}
        {pushStatus === 'denied' && (
          <View style={styles.sectionAction}>
            <Button variant="outlined" onPress={() => void Linking.openSettings()}>
              Open system settings
            </Button>
          </View>
        )}

        {notificationSettings.isPending ? (
          <SkeletonBlock lines={1} />
        ) : notificationSettings.isError || settings === undefined ? (
          <View style={styles.inset}>
            <ErrorState
              message="Digest preferences are out of reach."
              onRetry={() => void notificationSettings.refetch()}
            />
          </View>
        ) : (
          <View>
            <ToggleRow
              label="Daily digest"
              supportingText="Your board each morning, in the systems you keep on"
              value={settings.dailyDigest}
              disabled={updateNotifications.isPending}
              onChange={(next) => updateNotifications.mutate({ dailyDigest: next })}
              last={!settings.dailyDigest}
            />
            {settings.dailyDigest && (
              <>
                <ListItem
                  headline="Digest time"
                  onPress={() => setDigestPickerOpen((previous) => !previous)}
                  accessibilityLabel="Change the digest time"
                  trailing={
                    <Text variant="dataMedium" color="onSurfaceVariant">
                      {settings.dailyDigestTime}
                    </Text>
                  }
                />
                {digestPickerOpen && (
                  <DateTimePicker
                    value={parseDigestTime(settings.dailyDigestTime)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant={theme.dark ? 'dark' : 'light'}
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
    if (subscription.isPending) return <SkeletonBlock />
    if (subscription.isError || subscription.data === undefined) {
      return (
        <View style={styles.inset}>
          <ErrorState
            message="Your plan is out of reach."
            onRetry={() => void subscription.refetch()}
          />
        </View>
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
        <View style={styles.sectionAction}>
          <Button variant="outlined" onPress={() => setPaywallOpen(true)}>
            See plans
          </Button>
        </View>
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
    <View style={styles.screen}>
      <TopAppBar
        title="Settings"
        variant="large"
        progress={progress}
        navigationIcon={
          <IconButton
            icon={(color) => <CaretLeftIcon size={24} color={color} />}
            onPress={goBack}
            accessibilityLabel="Back"
          />
        }
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.section}>
          <SectionHeader title="Profile" />
          {renderProfileSection()}
        </View>

        {SYSTEM_GROUPS.map((group) => {
          const systems = SYSTEM_CATALOG.filter((system) => system.group === group.id)
          return (
            <View key={group.id} style={styles.section}>
              <SectionHeader title={group.title} />
              <Text
                variant="bodySmall"
                color="onSurfaceVariant"
                style={styles.sectionBlurb}
              >
                {group.blurb}
              </Text>
              {systems.map((system, index) => (
                <ToggleRow
                  key={system.key}
                  label={system.label}
                  supportingText={requirementNote(system) ?? system.description}
                  value={systemPrefs[system.key]}
                  disabled={profile.data === undefined || updateSystems.isPending}
                  onChange={(next) => toggleSystem(system.key, next)}
                  last={index === systems.length - 1}
                />
              ))}
            </View>
          )
        })}

        <View style={styles.section}>
          <SectionHeader title="Notifications" />
          {renderNotificationsSection()}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Plan" />
          {renderPlanSection()}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Account" />
          <LinkRow label="Sign out" onPress={confirmSignOut} destructive />
          <LinkRow
            label="Delete account"
            external
            destructive
            onPress={() => void Linking.openURL(`${ENV.apiUrl}/app/settings`)}
            last
          />
          <Text variant="labelSmall" color="onSurfaceVariant" style={styles.footnote}>
            Account deletion happens on the web
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="About" />
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
      </Animated.ScrollView>

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
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACE.xxl * 2,
    gap: SPACE.xl,
  },
  section: {
    gap: SPACE.xs,
  },
  // The rows carry the screen margin themselves (ListItem does), so everything
  // that isn't a row has to be inset to line up with them.
  sectionHeader: {
    paddingHorizontal: SPACE.margin,
    paddingBottom: SPACE.xs,
  },
  sectionBlurb: {
    paddingHorizontal: SPACE.margin,
    paddingBottom: SPACE.sm,
  },
  sectionAction: {
    paddingHorizontal: SPACE.margin,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.xs,
  },
  inset: {
    paddingHorizontal: SPACE.margin,
  },
  footnote: {
    paddingHorizontal: SPACE.margin,
    paddingTop: SPACE.sm,
  },
  skeletonBlock: {
    gap: SPACE.md,
    paddingHorizontal: SPACE.margin,
    paddingVertical: SPACE.md,
  },
  skeletonLine: {
    height: 18,
    borderRadius: SHAPE.full,
  },
  skeletonNarrow: {
    width: '58%',
  },
})
