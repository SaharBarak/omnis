import { useEffect, useState, type PropsWithChildren } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import { BrandMark } from '@/components/brand-mark'
import { Button, Text, TextField } from '@/components/m3'
import { Notice } from '@/components/ui/notice'
import { useAuth } from '@/lib/auth'
import { DURATION, EASING, SPACE } from '@/theme/m3'

const STAGGER_MS = 70
const RISE_PT = 16
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

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

/** S2 Welcome/Login — email one-time-code sign-in (Supabase). */
export default function LoginScreen() {
  const requestEmailCode = useAuth((state) => state.requestEmailCode)
  const verifyEmailCode = useAuth((state) => state.verifyEmailCode)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendCode = async () => {
    if (pending) return
    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address.')
      return
    }
    setPending(true)
    setError(null)
    try {
      await requestEmailCode(trimmed)
      setStep('code')
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Could not send the code. Try again.'
      )
    } finally {
      setPending(false)
    }
  }

  const verify = async () => {
    if (pending) return
    const entered = code.trim()
    if (entered.length < 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setPending(true)
    setError(null)
    try {
      await verifyEmailCode(email.trim(), entered)
      // Success — the root guard routes the signed-in session on.
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'That code did not work. Try again.'
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <FadeUp index={0}>
          <BrandMark size={44} />
        </FadeUp>
        <FadeUp index={1} style={styles.eyebrowBlock}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            Astrology · Dreamspell · Tzolkin · Long Count · Human Design · Kabbalah
          </Text>
        </FadeUp>
        <FadeUp index={2}>
          <Text variant="displaySmall" color="onSurface">
            Map the people who shape your life.
          </Text>
        </FadeUp>
        <FadeUp index={3}>
          <Text variant="bodyLarge" color="onSurfaceVariant">
            Every birthday you care about, read through six wisdom systems.
          </Text>
        </FadeUp>
      </View>

      <View style={styles.actions}>
        {step === 'email' ? (
          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              inputMode="email"
              editable={!pending}
            />
            <Button fullWidth onPress={() => void sendCode()} disabled={pending}>
              {pending ? 'Sending code…' : 'Continue with email'}
            </Button>
          </View>
        ) : (
          <View style={styles.form}>
            <TextField
              label="Code from your email"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!pending}
              supportingText={`Paste the code or sign-in link sent to ${email.trim()}`}
            />
            <Button fullWidth onPress={() => void verify()} disabled={pending}>
              {pending ? 'Verifying…' : 'Verify & continue'}
            </Button>
            <Button
              fullWidth
              variant="text"
              onPress={() => {
                setStep('email')
                setCode('')
                setError(null)
              }}
              disabled={pending}
            >
              Use a different email
            </Button>
          </View>
        )}
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
  form: {
    gap: SPACE.md,
  },
})
