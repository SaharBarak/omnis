import {
  Canvas,
  Circle,
  Fill,
  Group,
  Image,
  LinearGradient,
  Mask,
  RadialGradient,
  Rect,
  useImage,
  vec,
} from '@shopify/react-native-skia'
import { useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import {
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { alpha, useTheme } from '@/theme/m3'

/**
 * The atmosphere behind every screen.
 *
 * This is the one place the app departs from stock Material, deliberately: M3's
 * `background` role is a single flat colour, and a flat colour is the least
 * immersive thing a night-sky product could sit on. Everything *in* the
 * foreground is M3; the backdrop it sits on is not.
 *
 * The previous version approximated this with two `borderRadius: 240` Views at
 * 7% opacity, which renders as two visible hard-edged discs, not glows — React
 * Native has no radial gradient. Skia does, and it was already in the bundle
 * for the relationship map. So were the murals: `hero-sky.webp` has shipped in
 * `assets/` since onboarding was built, and no authed screen ever drew it.
 *
 * Three layers, painted once, never re-rendered:
 *
 *   1. the M3 `background` role, flat
 *   2. the hero-sky mural across the top, masked into a vertical fade so it
 *      dissolves into the background rather than ending on a seam
 *   3. two soft radial glows in the seed's own primary and tertiary
 *
 * The whole stack drifts ±6dp over 40 seconds. It is under the threshold of
 * noticing, which is the point — it keeps the background from reading as a
 * static image without ever pulling the eye off the content.
 */

/** How far down the screen the mural reaches before it has fully dissolved. */
const MURAL_FADE_RATIO = 0.55

const DRIFT_DISTANCE = 6
const DRIFT_PERIOD_MS = 20_000

export function CosmicGround() {
  const theme = useTheme()
  const { width, height } = useWindowDimensions()
  const reduced = useReducedMotion()

  const sky = useImage(require('../../assets/mural/hero-sky.webp'))

  const drift = useSharedValue(0)

  useEffect(() => {
    if (reduced) return
    drift.value = withRepeat(
      withTiming(1, { duration: DRIFT_PERIOD_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    )
  }, [reduced, drift])

  // Skia reads the transform straight off the UI thread — the drift never
  // touches JS, so it costs nothing per frame.
  const transform = useDerivedValue(
    () => [{ translateY: -DRIFT_DISTANCE + drift.value * DRIFT_DISTANCE * 2 }],
    [drift]
  )

  const muralHeight = height * MURAL_FADE_RATIO

  return (
    <Canvas style={{ position: 'absolute', width, height }} pointerEvents="none">
      <Fill color={theme.colors.background} />

      <Group transform={transform}>
        {sky !== null && (
          <Mask
            mode="luminance"
            mask={
              <Rect x={0} y={0} width={width} height={muralHeight}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, muralHeight)}
                  colors={['white', 'black']}
                />
              </Rect>
            }
          >
            {/*
             * Skia's Image paints into a canvas — it is not an <img>, has no
             * alt, and is never in the accessibility tree. jsx-a11y can't tell
             * the two apart by element name.
             */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              image={sky}
              x={0}
              y={0}
              width={width}
              height={muralHeight}
              fit="cover"
              // Atmosphere, not content. In the light scheme it has to be
              // fainter still or it turns a white page grey.
              opacity={theme.dark ? 0.5 : 0.12}
            />
          </Mask>
        )}

        <Circle cx={width} cy={0} r={width * 0.9}>
          <RadialGradient
            c={vec(width, 0)}
            r={width * 0.9}
            colors={[alpha(theme.colors.primary, theme.dark ? 0.16 : 0.1), 'transparent']}
          />
        </Circle>

        <Circle cx={0} cy={height} r={width * 0.8}>
          <RadialGradient
            c={vec(0, height)}
            r={width * 0.8}
            colors={[alpha(theme.colors.tertiary, theme.dark ? 0.1 : 0.06), 'transparent']}
          />
        </Circle>
      </Group>
    </Canvas>
  )
}
