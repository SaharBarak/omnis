import type { PropsWithChildren } from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { SHAPE, TOUCH_TARGET, stateLayer } from '@/theme/m3'

/**
 * The M3 interaction primitive. Everything pressable in the app is built on it.
 *
 * M3 does not signal a press by changing a component's fill or shrinking it —
 * it lays a translucent veil of the component's *content* colour over the
 * container and leaves the fill alone. That veil is the state layer, and this
 * is the only place it is drawn.
 *
 * Android additionally gets a native ripple, because a ripple is what an
 * Android press feels like; iOS gets the state layer alone.
 */
export interface TouchableProps extends PropsWithChildren<Omit<PressableProps, 'style'>> {
  /** The content colour the state layer is tinted from — usually `onSurface`. */
  stateLayerColor: string
  /** Corner radius. The state layer and the ripple are both clipped to it. */
  radius?: number
  /** Ripple ignores the bounds and blooms outward — icon buttons, chips. */
  borderless?: boolean
  /** Guarantee the M3 48dp minimum, even when the visual is smaller. */
  minTouchTarget?: boolean
  style?: StyleProp<ViewStyle>
}

export function Touchable({
  children,
  stateLayerColor,
  radius = SHAPE.none,
  borderless = false,
  minTouchTarget = false,
  disabled = false,
  style,
  ...rest
}: TouchableProps) {
  return (
    <Pressable
      disabled={disabled}
      android_ripple={
        disabled
          ? undefined
          : { color: stateLayer(stateLayerColor, 'pressed'), borderless, radius: borderless ? TOUCH_TARGET / 2 : undefined }
      }
      style={[
        { borderRadius: radius, overflow: 'hidden' },
        minTouchTarget && styles.minTarget,
        style,
      ]}
      {...rest}
    >
      {({ pressed }) => (
        <>
          {children}
          {/*
           * iOS has no native ripple, so the state layer carries the whole
           * press signal there. On Android the ripple already reads, and a
           * second overlay would double-darken.
           */}
          {pressed && !disabled && Platform.OS !== 'android' && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: stateLayer(stateLayerColor, 'pressed'), borderRadius: radius },
              ]}
            />
          )}
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  minTarget: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
