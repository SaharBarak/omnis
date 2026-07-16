import {
  Text as RNText,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native'

import { TYPE, useTheme, type M3ColorRole, type TypeRole } from '@/theme/m3'

/**
 * Text, addressed by M3 role rather than by size.
 *
 * `variant` picks a step on the type scale; `color` picks a colour role. Both
 * are names from the spec, so a call site never has to know a pixel value or a
 * hex. Passing a raw colour string is allowed for the few places that carry a
 * system's own accent (a seal colour, a flavour tint) rather than a theme role.
 */
export interface TextProps extends Omit<RNTextProps, 'style'> {
  variant?: TypeRole
  color?: M3ColorRole | (string & {})
  style?: StyleProp<TextStyle>
}

export function Text({
  variant = 'bodyMedium',
  color = 'onSurface',
  style,
  ...rest
}: TextProps) {
  const theme = useTheme()
  const resolved = color in theme.colors ? theme.colors[color as M3ColorRole] : color

  return <RNText style={[TYPE[variant], { color: resolved }, style]} {...rest} />
}
