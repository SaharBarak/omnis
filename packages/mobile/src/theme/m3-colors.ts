/**
 * GENERATED — do not edit by hand.
 * Run `node scripts/generate-m3-palette.mjs` after changing the seed.
 *
 * Material 3 colour roles derived from the brand seed #7D5BC9 via
 * SchemeFidelity (contrast 0). See scripts/generate-m3-palette.mjs
 * for why Fidelity and not TonalSpot.
 */

/** The 49 M3 roles. Every colour in the app is one of these. */
export interface M3ColorScheme {
  background: string
  onBackground: string
  surface: string
  surfaceDim: string
  surfaceBright: string
  surfaceContainerLowest: string
  surfaceContainerLow: string
  surfaceContainer: string
  surfaceContainerHigh: string
  surfaceContainerHighest: string
  onSurface: string
  surfaceVariant: string
  onSurfaceVariant: string
  inverseSurface: string
  inverseOnSurface: string
  outline: string
  outlineVariant: string
  shadow: string
  scrim: string
  surfaceTint: string
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  inversePrimary: string
  secondary: string
  onSecondary: string
  secondaryContainer: string
  onSecondaryContainer: string
  tertiary: string
  onTertiary: string
  tertiaryContainer: string
  onTertiaryContainer: string
  error: string
  onError: string
  errorContainer: string
  onErrorContainer: string
  primaryFixed: string
  primaryFixedDim: string
  onPrimaryFixed: string
  onPrimaryFixedVariant: string
  secondaryFixed: string
  secondaryFixedDim: string
  onSecondaryFixed: string
  onSecondaryFixedVariant: string
  tertiaryFixed: string
  tertiaryFixedDim: string
  onTertiaryFixed: string
  onTertiaryFixedVariant: string
}

export type M3ColorRole = keyof M3ColorScheme

/** The seed. Exported so the About screen can name where the palette came from. */
export const SEED_COLOR = '#7D5BC9'

export const DARK_COLORS: M3ColorScheme = {
  background: '#151219',
  onBackground: '#e7e0ea',
  surface: '#151219',
  surfaceDim: '#151219',
  surfaceBright: '#3b3840',
  surfaceContainerLowest: '#0f0d14',
  surfaceContainerLow: '#1d1a21',
  surfaceContainer: '#211e26',
  surfaceContainerHigh: '#2c2930',
  surfaceContainerHighest: '#36333b',
  onSurface: '#e7e0ea',
  surfaceVariant: '#494552',
  onSurfaceVariant: '#cbc3d4',
  inverseSurface: '#e7e0ea',
  inverseOnSurface: '#322f37',
  outline: '#958e9d',
  outlineVariant: '#494552',
  shadow: '#000000',
  scrim: '#000000',
  surfaceTint: '#d1bcff',
  primary: '#d1bcff',
  onPrimary: '#3c0f85',
  primaryContainer: '#7d5bc9',
  onPrimaryContainer: '#f9f2ff',
  inversePrimary: '#6b49b6',
  secondary: '#cfbff1',
  onSecondary: '#362952',
  secondaryContainer: '#4d406a',
  onSecondaryContainer: '#bdadde',
  tertiary: '#f1bf59',
  onTertiary: '#412d00',
  tertiaryContainer: '#916900',
  onTertiaryContainer: '#fff3e4',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  primaryFixed: '#eaddff',
  primaryFixedDim: '#d1bcff',
  onPrimaryFixed: '#24005b',
  onPrimaryFixedVariant: '#532f9c',
  secondaryFixed: '#eaddff',
  secondaryFixedDim: '#cfbff1',
  onSecondaryFixed: '#20143b',
  onSecondaryFixedVariant: '#4d406a',
  tertiaryFixed: '#ffdea4',
  tertiaryFixedDim: '#f1bf59',
  onTertiaryFixed: '#261900',
  onTertiaryFixedVariant: '#5d4200',
}

export const LIGHT_COLORS: M3ColorScheme = {
  background: '#fef7ff',
  onBackground: '#1d1a21',
  surface: '#fef7ff',
  surfaceDim: '#ded8e2',
  surfaceBright: '#fef7ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f8f1fb',
  surfaceContainer: '#f2ecf6',
  surfaceContainerHigh: '#ede6f0',
  surfaceContainerHighest: '#e7e0ea',
  onSurface: '#1d1a21',
  surfaceVariant: '#e8dff0',
  onSurfaceVariant: '#494552',
  inverseSurface: '#322f37',
  inverseOnSurface: '#f5eef9',
  outline: '#7a7483',
  outlineVariant: '#cbc3d4',
  shadow: '#000000',
  scrim: '#000000',
  surfaceTint: '#6b49b6',
  primary: '#6441ae',
  onPrimary: '#ffffff',
  primaryContainer: '#7d5bc9',
  onPrimaryContainer: '#f9f2ff',
  inversePrimary: '#d1bcff',
  secondary: '#655783',
  onSecondary: '#ffffff',
  secondaryContainer: '#ddccff',
  onSecondaryContainer: '#625480',
  tertiary: '#725200',
  onTertiary: '#ffffff',
  tertiaryContainer: '#916900',
  onTertiaryContainer: '#fff3e4',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  primaryFixed: '#eaddff',
  primaryFixedDim: '#d1bcff',
  onPrimaryFixed: '#24005b',
  onPrimaryFixedVariant: '#532f9c',
  secondaryFixed: '#eaddff',
  secondaryFixedDim: '#cfbff1',
  onSecondaryFixed: '#20143b',
  onSecondaryFixedVariant: '#4d406a',
  tertiaryFixed: '#ffdea4',
  tertiaryFixedDim: '#f1bf59',
  onTertiaryFixed: '#261900',
  onTertiaryFixedVariant: '#5d4200',
}
