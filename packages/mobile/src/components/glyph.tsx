import { createElement } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

import {
  ELEMENT_GLYPHS,
  HD_CENTER_GLYPHS,
  HD_TYPE_GLYPHS,
  LETTER_GLYPHS,
  NAWAL_GLYPHS,
  PLANET_GLYPHS,
  SEAL_GLYPHS,
  SIGN_GLYPHS,
  TONE_GLYPHS,
  type GlyphComponent,
} from '@/assets/glyphs/glyphs.gen'

/**
 * The system glyphs — one tintable line-art mark per reading. Each SVG is
 * painted `currentColor`, so `color` recolours the whole mark; pass a domain
 * flavour and it reads as that tradition. The art is square-boxed with
 * preserveAspectRatio, so a non-square glyph letterboxes rather than squashes.
 *
 * Callers speak the reading's own vocabulary — `seal={12}`, `planet="mars"`,
 * `center="ajna" defined` — never a file name.
 */

type Base = {
  size?: number
  color?: string
  opacity?: number
  style?: StyleProp<ViewStyle>
}

type Spec =
  | { seal: number }
  | { tone: number }
  | { sign: number }
  | { letter: number }
  /** Traditional Tzolkin day-sign number (1-20, Imix-first) → Kʼicheʼ nawal. */
  | { tzolkin: number }
  | { planet: string }
  | { element: string }
  | { hdType: string }
  | { center: string; defined?: boolean }

export type GlyphProps = Base & Spec

/**
 * The Yucatec Tzolkin count (Imix = 1) and the Kʼicheʼ Cholqʼij nawal set share
 * the same twenty archetypes but start at different signs, so the day-sign
 * number can't index the nawal art directly — it routes through the sign's own
 * Kʼicheʼ slug. Source: src/lib/docs/content.ts nawales.dayNames.
 */
const NAWAL_BY_TZOLKIN: readonly string[] = [
  'imox', 'iq', 'aqabal', 'kat', 'kan', 'kame', 'kej', 'qanil', 'toj', 'tzi',
  'batz', 'e', 'aj', 'ix', 'tzikin', 'ajmaq', 'noj', 'tijax', 'kawoq', 'ajpu',
]

function resolve(spec: Spec): GlyphComponent | undefined {
  if ('seal' in spec) return SEAL_GLYPHS[spec.seal]
  if ('tone' in spec) return TONE_GLYPHS[spec.tone]
  if ('sign' in spec) return SIGN_GLYPHS[spec.sign]
  if ('letter' in spec) return LETTER_GLYPHS[spec.letter]
  if ('tzolkin' in spec) return NAWAL_GLYPHS[NAWAL_BY_TZOLKIN[spec.tzolkin - 1] ?? '']
  if ('planet' in spec) return PLANET_GLYPHS[spec.planet.toLowerCase()]
  if ('element' in spec) return ELEMENT_GLYPHS[spec.element.toLowerCase()]
  if ('hdType' in spec) return HD_TYPE_GLYPHS[spec.hdType]
  const centre = HD_CENTER_GLYPHS[spec.center]
  return centre === undefined ? undefined : spec.defined ? centre.defined : centre.base
}

export function Glyph({ size = 24, color, opacity, style, ...spec }: GlyphProps) {
  // The glyph is selected from the static registry, not created here — but a
  // capitalized local rendered as JSX trips react-hooks/static-components, so
  // it goes through createElement, which the rule reads correctly as a lookup.
  const component = resolve(spec)
  if (component === undefined) return null
  return createElement(component, { width: size, height: size, color, opacity, style })
}
