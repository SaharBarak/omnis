/**
 * Generates src/theme/m3-colors.ts from the brand seed.
 *
 * The Material 3 colour system is *derived*, not authored: every role is a
 * tone plucked from a palette that HCT builds out of one source colour. Hand
 * writing those hexes would be guessing at Google's maths, so we run Google's
 * maths instead and commit the output.
 *
 * SchemeFidelity is the variant that keeps faith with the seed — it lands
 * `primaryContainer` on the brand purple itself. TonalSpot (the M3 default)
 * desaturates the seed toward a neutral; Expressive rotates the hue away
 * entirely. Fidelity is the only one that still looks like this product.
 *
 *   node scripts/generate-m3-palette.mjs
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  Hct,
  MaterialDynamicColors,
  SchemeFidelity,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities'

/** Pleiad brand purple. The single source of the entire colour system. */
const SEED = '#7D5BC9'

/** M3 contrast levels: 0 standard, 0.5 medium, 1 high. */
const CONTRAST = 0

const ROLES = Object.keys(MaterialDynamicColors).filter(
  (role) => typeof MaterialDynamicColors[role]?.getArgb === 'function'
)

/** Key colours are palette introspection, not surfaces — no UI consumes them. */
const EMITTED = ROLES.filter((role) => !role.endsWith('PaletteKeyColor'))

function scheme(isDark) {
  const source = Hct.fromInt(argbFromHex(SEED))
  const built = new SchemeFidelity(source, isDark, CONTRAST)
  return Object.fromEntries(
    EMITTED.map((role) => [
      role,
      hexFromArgb(MaterialDynamicColors[role].getArgb(built)),
    ])
  )
}

function serialize(name, roles) {
  const body = Object.entries(roles)
    .map(([role, hex]) => `  ${role}: '${hex}',`)
    .join('\n')
  return `export const ${name}: M3ColorScheme = {\n${body}\n}`
}

const dark = scheme(true)
const light = scheme(false)

const file = `/**
 * GENERATED — do not edit by hand.
 * Run \`node scripts/generate-m3-palette.mjs\` after changing the seed.
 *
 * Material 3 colour roles derived from the brand seed ${SEED} via
 * SchemeFidelity (contrast ${CONTRAST}). See scripts/generate-m3-palette.mjs
 * for why Fidelity and not TonalSpot.
 */

/** The ${EMITTED.length} M3 roles. Every colour in the app is one of these. */
export interface M3ColorScheme {
${EMITTED.map((role) => `  ${role}: string`).join('\n')}
}

export type M3ColorRole = keyof M3ColorScheme

/** The seed. Exported so the About screen can name where the palette came from. */
export const SEED_COLOR = '${SEED}'

${serialize('DARK_COLORS', dark)}

${serialize('LIGHT_COLORS', light)}
`

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'src', 'theme', 'm3-colors.ts')
writeFileSync(out, file)

console.log(`m3-colors.ts — ${EMITTED.length} roles × 2 schemes from ${SEED}`)
console.log(`  primary        ${dark.primary}   (dark)  ${light.primary}   (light)`)
console.log(`  primaryContainer ${dark.primaryContainer} (dark)  ${light.primaryContainer} (light)`)
console.log(`  surface        ${dark.surface}   (dark)  ${light.surface}   (light)`)
