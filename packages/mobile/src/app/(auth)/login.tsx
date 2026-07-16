import { useEffect, useState, type PropsWithChildren } from 'react'
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import * as WebBrowser from 'expo-web-browser'

import { BrandMark } from '@/components/brand-mark'
import { Button, Text } from '@/components/m3'
import { Notice } from '@/components/ui/notice'
import { useAuth, DB_CONNECTION, type AuthConnection } from '@/lib/auth'
import { DURATION, EASING, SPACE } from '@/theme/m3'

// Completes the pending auth session when the browser redirects back (web).
WebBrowser.maybeCompleteAuthSession()

const STAGGER_MS = 70
const RISE_PT = 16

/** Staggered fade-up entrance — transform+opacity only, 60–80ms cascade. */
function FadeUp({
  index,
  children,
  style,
}: PropsWithChildren<{ index: number; style?: StyleProp<ViewStyle> }>) {
  const reduced = useReducedMotion()
  const progress = useSharedValue(reduced ? 1 : 0)

  useEffect(() => {
    if (!reduced) {
      progress.value = withDelay(
        index * STAGGER_MS,
        withTiming(1, {
          duration: DURATION.long1,
          easing: Easing.bezier(...EASING.emphasizedDecelerate),
        })
      )
    }
  }, [index, reduced, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * RISE_PT }],
  }))

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
}

/** S2 Welcome/Login — USER_FLOWS F1. Cancelled Auth0 → stay here, no toast. */
export default function LoginScreen() {
  const signIn = useAuth((state) => state.signIn)
  const [pending, setPending] = useState<AuthConnection | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async (connection: AuthConnection) => {
    if (pending !== null) return
    setPending(connection)
    setError(null)
    try {
      await signIn(connection)
      // Success or dismissal — the root guard routes signed-in sessions on.
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed. Try again.')
    } finally {
      setPending(null)
    }
  }

  const isIos = Platform.OS === 'ios'

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <FadeUp index={0}>
          <BrandMark size={44} />
        </FadeUp>
        <FadeUp index={1} style={styles.eyebrowBlock}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            Astrology · Dreamspell · Tzolkin · Human Design · Kabbalah
          </Text>
        </FadeUp>
        <FadeUp index={2}>
          <Text variant="displaySmall" color="onSurface">
            Map the people who shape your life.
          </Text>
        </FadeUp>
        <FadeUp index={3}>
          <Text variant="bodyLarge" color="onSurfaceVariant">
            Every birthday you care about, read through five wisdom systems.
          </Text>
        </FadeUp>
      </View>

      <View style={styles.actions}>
        {/*
         * One filled button per screen: the platform's own sign-in. Everything
         * else is a real alternative, so it takes the outlined emphasis.
         */}
        {isIos && (
          <FadeUp index={4}>
            <Button
              fullWidth
              onPress={() => void handleSignIn('apple')}
              disabled={pending !== null}
            >
              {pending === 'apple' ? 'Opening Apple sign-in…' : 'Continue with Apple'}
            </Button>
          </FadeUp>
        )}
        <FadeUp index={isIos ? 5 : 4}>
          <Button
            fullWidth
            variant={isIos ? 'outlined' : 'filled'}
            onPress={() => void handleSignIn('google-oauth2')}
            disabled={pending !== null}
          >
            {pending === 'google-oauth2'
              ? 'Opening Google sign-in…'
              : 'Continue with Google'}
          </Button>
        </FadeUp>
        <FadeUp index={isIos ? 6 : 5}>
          <Button
            fullWidth
            variant="outlined"
            onPress={() => void handleSignIn(DB_CONNECTION)}
            disabled={pending !== null}
          >
            {pending === DB_CONNECTION
              ? 'Opening sign-in…'
              : 'Continue with email'}
          </Button>
        </FadeUp>
        {error !== null && <Notice variant="error">{error}</Notice>}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: SPACE.margin,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACE.lg,
    paddingBottom: SPACE.xxl,
  },
  eyebrowBlock: {
    marginTop: SPACE.xs,
  },
  actions: {
    gap: SPACE.md,
    paddingBottom: SPACE.xxl,
  },
})
