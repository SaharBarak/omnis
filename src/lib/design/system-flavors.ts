/**
 * Per-system folklore flavor tokens for the redesigned marketing surfaces.
 *
 * One shared layout grammar, five skins (docs/redesign/DESIGN_LANGUAGE.md).
 * Flavor lives in backgrounds, borders, motifs, and accent color — layout,
 * spacing, and component behavior stay identical across systems.
 */

export type SystemKey =
  | 'astrology'
  | 'dreamspell'
  | 'tzolkin'
  | 'humanDesign'
  | 'gematria'

export interface SystemFlavor {
  readonly key: SystemKey
  readonly name: string
  /** Accent used for pills, rail nodes, link hovers within the zone. */
  readonly accent: string
  /** Softer companion tone for gradients and glows. */
  readonly accentSoft: string
  /** Mural band asset for the zone background. */
  readonly muralSrc: string
  /** Wide-short banner for the /learn doc hero (ASSET_MAP C2). */
  readonly bannerSrc: string
  /** One-line lineage note shown at the bottom of the zone. */
  readonly lineage: string
  readonly learnHref: string
  readonly learnLabel: string
}

export const SYSTEM_FLAVORS: Readonly<Record<SystemKey, SystemFlavor>> =
  Object.freeze({
    astrology: {
      key: 'astrology',
      name: 'Astrology',
      accent: '#C9A227',
      accentSoft: '#E7D08A',
      muralSrc: '/images/redesign/mural/zone-astrology.webp',
      bannerSrc: '/images/redesign/docs/doc-astrology.webp',
      lineage:
        'From the Uranographia atlases to the modern ephemeris — the sky, engraved.',
      learnHref: '/learn/astrology',
      learnLabel: 'Learn astrology',
    },
    dreamspell: {
      key: 'dreamspell',
      name: 'Dreamspell',
      accent: '#A87BD1',
      accentSoft: '#CDB2E8',
      muralSrc: '/images/redesign/mural/zone-dreamspell.webp',
      bannerSrc: '/images/redesign/docs/doc-dreamspell.webp',
      lineage:
        'In the Dreamspell, no kin stands alone — every sign has its guide, its antipode, its occult ally.',
      learnHref: '/learn/dreamspell',
      learnLabel: 'Learn the Dreamspell',
    },
    tzolkin: {
      key: 'tzolkin',
      name: 'Tzolkin',
      accent: '#2E6E5E',
      accentSoft: '#7FB5A6',
      muralSrc: '/images/redesign/mural/zone-tzolkin.webp',
      bannerSrc: '/images/redesign/docs/doc-tzolkin.webp',
      lineage:
        'The Maya kept day-counts on bark paper for generations. This codex is yours.',
      learnHref: '/learn/tzolkin',
      learnLabel: 'Learn the Tzolkin',
    },
    humanDesign: {
      key: 'humanDesign',
      name: 'Human Design',
      accent: '#7FD4C1',
      accentSoft: '#B9E8DD',
      muralSrc: '/images/redesign/mural/zone-human-design.webp',
      bannerSrc: '/images/redesign/docs/doc-human-design.webp',
      lineage:
        'Human Design maps the channels that only exist when two people stand together.',
      learnHref: '/learn/human-design',
      learnLabel: 'Learn Human Design',
    },
    gematria: {
      key: 'gematria',
      name: 'Kabbalah',
      accent: '#D4AF37',
      accentSoft: '#EFD98B',
      muralSrc: '/images/redesign/mural/zone-gematria.webp',
      bannerSrc: '/images/redesign/docs/doc-gematria.webp',
      lineage:
        'In Kabbalah the letters themselves create — to send a word is to send a world.',
      learnHref: '/learn/gematria',
      learnLabel: 'Learn Gematria',
    },
  })

/** Order the five system threads appear along the mural descent. */
export const FLAVOR_DESCENT: readonly SystemKey[] = Object.freeze([
  'astrology',
  'dreamspell',
  'tzolkin',
  'humanDesign',
  'gematria',
])

/** Shared near-black every mural band fades into (DESIGN_LANGUAGE.md). */
export const MURAL_GROUND = '#0B0D16'

/** Doc section ids used by /learn routes and src/lib/docs/content.ts. */
export type DocSectionId =
  | 'astrology'
  | 'dreamspell'
  | 'tzolkin'
  | 'human-design'
  | 'gematria'
  | 'integration'

/**
 * Flavor for /learn/integration — the five threads braided into one.
 * Not a SystemFlavor: it has no zone on the homepage mural.
 */
export const INTEGRATION_FLAVOR = Object.freeze({
  key: 'integration' as const,
  name: 'Integration',
  accent: '#C9A227',
  accentSoft: '#E7D08A',
  bannerSrc: '/images/redesign/docs/doc-integration.webp',
  lineage:
    'Five traditions, one person — where the readings agree, pay attention.',
  learnHref: '/learn/integration',
  learnLabel: 'Read the systems together',
})

export type DocFlavor = Pick<
  SystemFlavor,
  'name' | 'accent' | 'accentSoft' | 'bannerSrc' | 'lineage' | 'learnHref'
>

/** Look up flavor tokens by doc section id (kebab-case route segment). */
export const DOC_FLAVORS: Readonly<Record<DocSectionId, DocFlavor>> =
  Object.freeze({
    astrology: SYSTEM_FLAVORS.astrology,
    dreamspell: SYSTEM_FLAVORS.dreamspell,
    tzolkin: SYSTEM_FLAVORS.tzolkin,
    'human-design': SYSTEM_FLAVORS.humanDesign,
    gematria: SYSTEM_FLAVORS.gematria,
    integration: INTEGRATION_FLAVOR,
  })
