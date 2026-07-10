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
import { QueryClientProvider } from '@tanstack/react-query'
import {
  DarkTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
  type Href,
} from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import { BrandMark } from '@/components/brand-mark'
import { CosmicGround } from '@/components/cosmic-ground'
import { Button, Eyebrow, Panel } from '@/components/ui/primitives'
import { useProfile } from '@/lib/api'
import { useAuthStore, type AuthStatus } from '@/lib/auth'
import { queryClient } from '@/lib/query-client'
import { COLORS, SPACE, TYPE } from '@/theme/tokens'

void SplashScreen.preventAutoHideAsync()

/** Dark only — the product is the night sky. */
const pleiadTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.ground,
    card: COLORS.surface,
    primary: COLORS.brand,
    border: COLORS.border,
    text: COLORS.text90,
  },
}

/** Quiet cosmic moment while auth hydrates / the profile bootstraps. */
function BootVeil() {
  return (
    <View style={styles.veil}>
      <BrandMark size={44} />
      <Eyebrow>PREPARING YOUR SKY</Eyebrow>
    </View>
  )
}

/** F1: network down at profile fetch → retry, cached-token session kept. */
function ProfileRetry({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <View style={styles.retryScreen}>
      <Panel style={styles.retryPanel}>
        <Text style={TYPE.section}>The sky is out of reach.</Text>
        <Text style={styles.retryBody}>
          We couldn't load your profile. Check your connection — your session is safe.
        </Text>
        <Button onPress={onRetry} disabled={retrying}>
          {retrying ? 'Trying…' : 'Try again'}
        </Button>
      </Panel>
    </View>
  )
}

/**
 * Declarative auth guards — expo-router useSegments pattern:
 * signedOut → /login · signedIn without onboarding → /onboarding · else tabs.
 */
function RootNavigator({ status }: { status: AuthStatus }) {
  const segments: string[] = useSegments()
  const router = useRouter()
  const profileQuery = useProfile(status === 'signedIn')

  const inAuthGroup = segments[0] === '(auth)'
  const onOnboarding = inAuthGroup && segments[1] === 'onboarding'

  // Ready = auth hydrated and, when signed in, the profile query settled.
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
    if (profile === undefined) return null // fetch failed — retry screen below
    if (!profile.onboarding_completed) return onOnboarding ? null : '/onboarding'
    return inAuthGroup ? '/' : null
  }, [ready, status, profile, inAuthGroup, onOnboarding])

  useEffect(() => {
    if (target !== null) router.replace(target)
  }, [target, router])

  // No flicker: nothing renders while loading (native splash still covers
  // cold boot; post-login shows the quiet veil).
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
      {/* Mask the single frame between mount and the redirect committing. */}
      {target !== null && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.mask]} />
      )}
    </View>
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={pleiadTheme}>
        <View style={[styles.flex, { backgroundColor: COLORS.ground }]}>
          <CosmicGround />
          <StatusBar style="light" />
          <RootNavigator status={status} />
        </View>
      </ThemeProvider>
    </QueryClientProvider>
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
    gap: SPACE.cardPad,
  },
  retryScreen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACE.gutter,
  },
  retryPanel: {
    gap: SPACE.cardPad,
  },
  retryBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  mask: {
    backgroundColor: COLORS.ground,
  },
})
