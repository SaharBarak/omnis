import { useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'

import { COLORS, RADII, TYPE } from '@/theme/tokens'

interface TextFieldProps
  extends Pick<
    TextInputProps,
    | 'value'
    | 'onChangeText'
    | 'placeholder'
    | 'autoFocus'
    | 'autoCapitalize'
    | 'autoCorrect'
    | 'keyboardType'
    | 'returnKeyType'
    | 'onSubmitEditing'
    | 'maxLength'
  > {
  label: string
  helper?: string
  error?: string
  style?: StyleProp<ViewStyle>
}

/**
 * Form field — DESIGN_LANGUAGE §7: label above, error below, 8pt gaps.
 * Input: surface2 fill, radius 12, 1px border, focus → brand border.
 */
export function TextField({ label, helper, error, style, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false)
  const hasError = error !== undefined && error.length > 0
  return (
    <View style={[styles.block, style]}>
      <Text style={TYPE.eyebrow}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[
          styles.input,
          focused && styles.inputFocused,
          hasError && styles.inputError,
        ]}
        placeholderTextColor={COLORS.text35}
        keyboardAppearance="dark"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
      />
      {hasError ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper !== undefined ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  input: {
    height: 52,
    borderRadius: RADII.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
    paddingHorizontal: 16,
    fontFamily: TYPE.body.fontFamily,
    fontSize: TYPE.body.fontSize,
    color: COLORS.text90,
  },
  inputFocused: {
    borderColor: COLORS.brand,
  },
  inputError: {
    borderColor: COLORS.destructive,
  },
  helper: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  error: {
    ...TYPE.bodySm,
    color: COLORS.destructive,
  },
})
