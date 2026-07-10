import { useEffect, useState, type PropsWithChildren } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
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
import { Button, Eyebrow } from '@/components/ui/primitives'
import { useAuth, type AuthConnection } from '@/lib/auth'
import { COLORS, DURATION, SPACE, TYPE } from '@/theme/tokens'

// Completes the pending auth session when the browser redirects back (web).
WebBrowser.maybeCompleteAuthSession()

const STAGGER_MS = 70
const RISE_PT = 16
const EASE_SMOOTH = Easing.bezier(0.4, 0, 0.2, 1)

/** Staggered fade-up entrance — transform+opacity only, 60–80ms cascade. */
function FadeUp({
  index,
  children,
  style,
}: PropsWithChildren<{ index: number; style?: object }>) {
  const reduced = useReducedMotion()
  const progress = useSharedValue(reduced ? 1 : 0)

  useEffect(() => {
    if (!reduced) {
      progress.value = withDelay(
        index * STAGGER_MS,
        withTiming(1, { duration: DURATION.slower, easing: EASE_SMOOTH })
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
          <Eyebrow>ASTROLOGY · DREAMSPELL · TZOLKIN · HUMAN DESIGN · KABBALAH</Eyebrow>
        </FadeUp>
        <FadeUp index={2}>
          <Text style={TYPE.hero}>Map the people who shape your life.</Text>
        </FadeUp>
        <FadeUp index={3}>
          <Text style={styles.subline}>
            Every birthday you care about, read through five wisdom systems.
          </Text>
        </FadeUp>
      </View>

      <View style={styles.actions}>
        {isIos && (
          <FadeUp index={4}>
            <Button
              onPress={() => void handleSignIn('apple')}
              disabled={pending !== null}
            >
              {pending === 'apple' ? 'Opening Apple sign-in…' : 'Continue with Apple'}
            </Button>
          </FadeUp>
        )}
        <FadeUp index={isIos ? 5 : 4}>
          <Button
            variant={isIos ? 'secondary' : 'primary'}
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
            variant="secondary"
            onPress={() => void handleSignIn('Username-Password-Authentication')}
            disabled={pending !== null}
          >
            {pending === 'Username-Password-Authentication'
              ? 'Opening sign-in…'
              : 'Continue with email'}
          </Button>
        </FadeUp>
        {error !== null && <Text style={styles.error}>{error}</Text>}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: SPACE.gutter,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACE.cardPad,
    paddingBottom: SPACE.section,
  },
  eyebrowBlock: {
    marginTop: SPACE.unit,
  },
  subline: {
    ...TYPE.body,
    color: COLORS.text50,
  },
  actions: {
    gap: 12,
    paddingBottom: SPACE.section,
  },
  error: {
    ...TYPE.bodySm,
    color: COLORS.destructive,
    textAlign: 'center',
    marginTop: SPACE.unit,
  },
})
