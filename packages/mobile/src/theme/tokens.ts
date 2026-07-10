/**
 * Pleiad mobile design tokens — transcribed from the locked web system.
 * Sources: src/lib/design/landing-tokens.ts, system-flavors.ts,
 * dashboard.css. See specs/mobile/DESIGN_LANGUAGE.md. Do not invent values
 * here; change the spec first.
 */

export const COLORS = {
  ground: '#0B0D16',
  surface: '#0D101A',
  surface2: '#12151F',
  brand: '#7D5BC9',
  brandSoft: '#A78FDF',
  brandBright: '#EFEAFA',
  border: 'rgba(228,232,245,0.07)',
  borderHover: 'rgba(228,232,245,0.12)',
  cardFill: 'rgba(13,16,26,0.82)',
  muted: '#8B90A8',
  destructive: '#D64545',
  // Text emphasis — exactly four steps, never ad-hoc grays.
  text90: 'rgba(255,255,255,0.90)',
  text70: 'rgba(255,255,255,0.70)',
  text50: 'rgba(255,255,255,0.50)',
  text35: 'rgba(255,255,255,0.35)',
} as const

export type SystemKey =
  | 'astrology'
  | 'dreamspell'
  | 'tzolkin'
  | 'humanDesign'
  | 'gematria'
  | 'integration'

export interface SystemFlavor {
  name: string
  accent: string
  accentSoft: string
}

export const FLAVORS: Record<SystemKey, SystemFlavor> = {
  astrology: { name: 'Astrology', accent: '#C9A227', accentSoft: '#E7D08A' },
  dreamspell: { name: 'Dreamspell', accent: '#A87BD1', accentSoft: '#CDB2E8' },
  tzolkin: { name: 'Tzolkin', accent: '#2E6E5E', accentSoft: '#7FB5A6' },
  humanDesign: { name: 'Human Design', accent: '#7FD4C1', accentSoft: '#B9E8DD' },
  gematria: { name: 'Kabbalah', accent: '#D4AF37', accentSoft: '#EFD98B' },
  integration: { name: 'Integration', accent: '#C9A227', accentSoft: '#E7D08A' },
} as const

export const FONTS = {
  display: 'SpaceGrotesk_600SemiBold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemi: 'Barlow_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const

/** Type ramp — DESIGN_LANGUAGE.md §2.1. Weight carries hierarchy. */
export const TYPE = {
  hero: {
    fontFamily: FONTS.display,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1,
    color: COLORS.text90,
  },
  zone: {
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: COLORS.text90,
  },
  section: {
    fontFamily: FONTS.display,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: COLORS.text90,
  },
  card: {
    fontFamily: FONTS.displayMedium,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.text90,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text70,
  },
  bodySm: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text70,
  },
  eyebrow: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 2.2,
    textTransform: 'uppercase' as const,
    color: COLORS.text50,
  },
  stat: {
    fontFamily: FONTS.monoMedium,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'] as Array<'tabular-nums'>,
    color: COLORS.brandBright,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: COLORS.text50,
  },
} as const

export const RADII = {
  panel: 16,
  feature: 20,
  heroInset: 32,
  button: 12,
  input: 12,
  pill: 999,
} as const

export const SPACE = {
  unit: 4,
  gutter: 20,
  section: 32,
  cardPad: 20,
  featurePad: 24,
} as const

export const DURATION = {
  fast: 120,
  normal: 200,
  slow: 300,
  slower: 500,
} as const

/** Reanimated spring defaults — MOTION spec. Nothing bounces. */
export const SPRING = { stiffness: 100, damping: 20 } as const
