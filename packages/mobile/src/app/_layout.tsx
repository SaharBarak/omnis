import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
} from '@expo-google-fonts/barlow'
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono'
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
  type Href,
} from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { BrandMark } from '@/components/brand-mark'
import { CosmicGround } from '@/components/cosmic-ground'
import { Button, Card, SnackbarHost, Text } from '@/components/m3'
import { useProfile } from '@/lib/api'
import { useAuthStore, type AuthStatus } from '@/lib/auth'
import { PERSIST_MAX_AGE_MS, queryClient, queryPersister } from '@/lib/query-client'
import { SPACE, useTheme, type M3Theme } from '@/theme/m3'

void SplashScreen.preventAutoHideAsync()

/** React Navigation's theme, fed from the M3 scheme so the two never disagree. */
function navigationTheme(theme: M3Theme) {
  const base = theme.dark ? DarkTheme : DefaultTheme
  return {
    ...base,
    dark: theme.dark,
    colors: {
      ...base.colors,
      // Transparent: the atmosphere canvas is painted behind the navigator and
      // an opaque background here would cover it on every screen.
      background: 'transparent',
      card: theme.surfaceAt(2),
      primary: theme.colors.primary,
      border: theme.colors.outlineVariant,
      text: theme.colors.onSurface,
      notification: theme.colors.error,
    },
  }
}

/** Shown while auth hydrates and the profile bootstraps. */
function BootVeil() {
  return (
    <View style={styles.veil}>
      <BrandMark size={48} />
      <Text variant="bodyMedium" color="onSurfaceVariant">
        Preparing your sky
      </Text>
    </View>
  )
}

function ProfileRetry({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <View style={styles.retryScreen}>
      <Card variant="filled">
        <Text variant="headlineSmall" color="onSurface">
          The sky is out of reach.
        </Text>
        <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.retryBody}>
          We couldn&apos;t load your profile. Check your connection. Your session is safe.
        </Text>
        <Button onPress={onRetry} disabled={retrying}>
          {retrying ? 'Trying…' : 'Try again'}
        </Button>
      </Card>
    </View>
  )
}

/**
 * Auth guards — expo-router's `useSegments` pattern:
 * signed out → /login · signed in without onboarding → /onboarding · else tabs.
 */
function RootNavigator({ status }: { status: AuthStatus }) {
  const segments: string[] = useSegments()
  const router = useRouter()
  const profileQuery = useProfile(status === 'signedIn')

  const inAuthGroup = segments[0] === '(auth)'
  const onOnboarding = inAuthGroup && segments[1] === 'onboarding'

  const ready =
    status !== 'loading' &&
    (status === 'signedOut' || profileQuery.isSuccess || profileQuery.isError)

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  const profile = profileQuery.data
  const target = useMemo<Href | null>(() => {
    if (!ready) return null
    if (status === 'signedOut') return inAuthGroup && !onOnboarding ? null : '/login'
    if (profile === undefined) return null // fetch failed — the retry screen below
    if (!profile.onboarding_completed) return onOnboarding ? null : '/onboarding'
    return inAuthGroup ? '/' : null
  }, [ready, status, profile, inAuthGroup, onOnboarding])

  useEffect(() => {
    if (target !== null) router.replace(target)
  }, [target, router])

  if (!ready) return <BootVeil />

  if (status === 'signedIn' && profileQuery.isError) {
    return (
      <ProfileRetry
        onRetry={() => void profileQuery.refetch()}
        retrying={profileQuery.isFetching}
      />
    )
  }

  return (
    <View style={styles.flex}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      {/* Masks the single frame between mount and the redirect committing. */}
      {target !== null && <MaskFrame />}
    </View>
  )
}

function MaskFrame() {
  const theme = useTheme()
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]}
    />
  )
}

function App({ status }: { status: AuthStatus }) {
  const theme = useTheme()

  return (
    <ThemeProvider value={navigationTheme(theme)}>
      <View style={styles.flex}>
        <CosmicGround />
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <RootNavigator status={status} />
        {/*
         * One snackbar host for the whole app. Screens used to mount their own,
         * which meant a toast raised from inside a sheet could be unmounted
         * along with the sheet before anyone read it.
         */}
        <SnackbarHost />
      </View>
    </ThemeProvider>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  })
  const status = useAuthStore((state) => state.status)
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={styles.flex}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE_MS }}
      >
        <App status={status} />
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  veil: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.lg,
  },
  retryScreen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACE.margin,
  },
  retryBody: {
    marginTop: SPACE.sm,
    marginBottom: SPACE.lg,
  },
})
